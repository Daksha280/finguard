const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const db = require('../database/connection');

const TEST_ADMIN = { name: 'Test Admin', email: `admin.test.${Date.now()}@finguard.com`, password: 'Admin@123', role: 'admin' };
const TEST_ANALYST = { name: 'Test Analyst', email: `analyst.test.${Date.now()}@finguard.com`, password: 'Analyst@123', role: 'analyst' };

let adminToken;
let analystToken;
let createdTransactionId;

beforeAll(async () => {
  // Ensure test users exist directly via DB (bypassing HTTP) for isolation
  const adminHash = await bcrypt.hash(TEST_ADMIN.password, 10);
  const analystHash = await bcrypt.hash(TEST_ANALYST.password, 10);

  await db.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)',
    [TEST_ADMIN.name, TEST_ADMIN.email, adminHash, 'admin']
  );
  await db.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)',
    [TEST_ANALYST.name, TEST_ANALYST.email, analystHash, 'analyst']
  );
});

afterAll(async () => {
  await db.query('DELETE FROM users WHERE email IN ($1, $2)', [TEST_ADMIN.email, TEST_ANALYST.email]);
  if (createdTransactionId) {
    await db.query('DELETE FROM transactions WHERE id = $1', [createdTransactionId]);
  }
  await db.pool.end();
});

describe('Auth', () => {
  test('POST /api/auth/login succeeds with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(TEST_ADMIN.email);
    adminToken = res.body.token;
  });

  test('POST /api/auth/login logs in the analyst too', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_ANALYST.email, password: TEST_ANALYST.password });

    expect(res.statusCode).toBe(200);
    analystToken = res.body.token;
  });

  test('POST /api/auth/login fails with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_ADMIN.email, password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
  });

  test('POST /api/auth/login fails with invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'whatever' });

    expect(res.statusCode).toBe(400);
  });
});

describe('Unauthorized access', () => {
  test('GET /api/transactions without a token returns 401', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/users as analyst (non-admin) returns 403', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(403);
  });
});

describe('Transactions', () => {
  test('GET /api/transactions returns a paginated list', async () => {
    const res = await request(app)
      .get('/api/transactions?page=1&pageSize=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.transactions)).toBe(true);
    expect(res.body.pagination).toHaveProperty('total');
  });

  test('POST /api/transactions creates a new transaction with computed risk score', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        customerName: 'Test Customer',
        amount: 250000,
        merchant: 'CryptoXchange India',
        location: 'Mumbai, MH',
        device: 'Unknown Device - Chrome',
        isNewDevice: true,
        isNewLocation: true,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.transaction).toHaveProperty('id');
    expect(res.body.transaction.riskLevel).toBe('HIGH');
    expect(res.body.transaction.riskScore).toBeGreaterThan(60);
    createdTransactionId = res.body.transaction.id;
  });

  test('POST /api/transactions fails validation with negative amount', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        customerName: 'Test Customer',
        amount: -500,
        merchant: 'Amazon India',
        location: 'Delhi, DL',
        device: 'Chrome',
      });

    expect(res.statusCode).toBe(400);
  });

  test('POST /api/transactions/:id/analyze returns explainable risk breakdown', async () => {
    const res = await request(app)
      .post(`/api/transactions/${createdTransactionId}/analyze`)
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('riskScore');
    expect(res.body).toHaveProperty('riskLevel');
    expect(Array.isArray(res.body.reasons)).toBe(true);
    expect(res.body.reasons.length).toBeGreaterThan(0);
  });

  test('PUT /api/transactions/:id/status updates status and writes an audit log', async () => {
    const res = await request(app)
      .put(`/api/transactions/${createdTransactionId}/status`)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ status: 'Flagged' });

    expect(res.statusCode).toBe(200);
    expect(res.body.transaction.status).toBe('Flagged');

    const auditRes = await request(app)
      .get('/api/audit-logs?limit=5')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(auditRes.statusCode).toBe(200);
    const match = auditRes.body.logs.find(
      (log) => log.transaction_id === createdTransactionId && log.action === 'Transaction status changed'
    );
    expect(match).toBeDefined();
  });

  test('PUT /api/transactions/:id/status rejects an invalid status', async () => {
    const res = await request(app)
      .put(`/api/transactions/${createdTransactionId}/status`)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ status: 'NotARealStatus' });

    expect(res.statusCode).toBe(400);
  });

  test('GET /api/transactions/:id returns 404 for a non-existent transaction', async () => {
    const res = await request(app)
      .get('/api/transactions/999999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });
});

describe('Dashboard', () => {
  test('GET /api/dashboard/stats returns summary counts', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.summary).toHaveProperty('totalTransactions');
    expect(res.body.summary).toHaveProperty('highRisk');
  });
});
