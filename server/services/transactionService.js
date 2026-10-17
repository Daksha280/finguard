const db = require('../database/connection');
const { ApiError } = require('../middleware/errorHandler');
const riskEngine = require('./riskEngine');

const SORTABLE_COLUMNS = {
  amount: 'amount',
  riskScore: 'risk_score',
  date: 'timestamp',
};

function mapRow(row) {
  return {
    id: row.id,
    txnRef: row.txn_ref,
    customerId: row.customer_id,
    customerName: row.customer_name,
    amount: Number(row.amount),
    merchant: row.merchant,
    location: row.location,
    device: row.device,
    isNewDevice: row.is_new_device,
    isNewLocation: row.is_new_location,
    isSuspiciousMerchant: row.is_suspicious_merchant,
    timestamp: row.timestamp,
    riskScore: row.risk_score,
    riskLevel: row.risk_level,
    reasons: row.risk_reasons || [],
    status: row.status,
    createdAt: row.created_at,
  };
}

async function generateNextTxnRef() {
  const result = await db.query(
    `SELECT txn_ref FROM transactions ORDER BY id DESC LIMIT 1`
  );
  if (result.rows.length === 0) {
    return 'TXN-1001';
  }
  const lastRef = result.rows[0].txn_ref;
  const lastNum = parseInt(lastRef.replace('TXN-', ''), 10) || 1000;
  return `TXN-${lastNum + 1}`;
}

async function listTransactions(filters = {}) {
  const {
    search,
    riskLevel,
    status,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    sortBy = 'date',
    sortDir = 'desc',
    page = 1,
    pageSize = 20,
  } = filters;

  const conditions = [];
  const params = [];
  let idx = 1;

  if (search) {
    conditions.push(
      `(txn_ref ILIKE $${idx} OR customer_name ILIKE $${idx} OR merchant ILIKE $${idx} OR location ILIKE $${idx})`
    );
    params.push(`%${search}%`);
    idx += 1;
  }

  if (riskLevel) {
    conditions.push(`risk_level = $${idx}`);
    params.push(riskLevel.toUpperCase());
    idx += 1;
  }

  if (status) {
    conditions.push(`status = $${idx}`);
    params.push(status);
    idx += 1;
  }

  if (dateFrom) {
    conditions.push(`timestamp >= $${idx}`);
    params.push(dateFrom);
    idx += 1;
  }

  if (dateTo) {
    conditions.push(`timestamp <= $${idx}`);
    params.push(dateTo);
    idx += 1;
  }

  if (amountMin !== undefined && amountMin !== '') {
    conditions.push(`amount >= $${idx}`);
    params.push(amountMin);
    idx += 1;
  }

  if (amountMax !== undefined && amountMax !== '') {
    conditions.push(`amount <= $${idx}`);
    params.push(amountMax);
    idx += 1;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortColumn = SORTABLE_COLUMNS[sortBy] || 'timestamp';
  const direction = sortDir && sortDir.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safePageSize = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const offset = (safePage - 1) * safePageSize;

  const countQuery = `SELECT COUNT(*)::int AS total FROM transactions ${whereClause}`;
  const countResult = await db.query(countQuery, params);
  const total = countResult.rows[0].total;

  const dataQuery = `
    SELECT * FROM transactions
    ${whereClause}
    ORDER BY ${sortColumn} ${direction}
    LIMIT $${idx} OFFSET $${idx + 1}
  `;
  const dataParams = [...params, safePageSize, offset];
  const dataResult = await db.query(dataQuery, dataParams);

  return {
    transactions: dataResult.rows.map(mapRow),
    pagination: {
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    },
  };
}

async function getTransactionById(id) {
  const result = await db.query('SELECT * FROM transactions WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw new ApiError(404, 'Transaction not found.');
  }
  return mapRow(result.rows[0]);
}

async function createTransaction(payload) {
  const {
    customerId,
    customerName,
    amount,
    merchant,
    location,
    device,
    isNewDevice = false,
    isNewLocation = false,
    isSuspiciousMerchant,
    timestamp,
  } = payload;

  const txnRef = await generateNextTxnRef();
  const txnTimestamp = timestamp ? new Date(timestamp) : new Date();

  const { riskScore, riskLevel, reasons } = riskEngine.evaluateTransaction({
    amount,
    merchant,
    timestamp: txnTimestamp,
    isNewDevice,
    isNewLocation,
    isSuspiciousMerchant,
  });

  const suspiciousMerchantFlag =
    isSuspiciousMerchant !== undefined
      ? Boolean(isSuspiciousMerchant)
      : riskEngine.isSuspiciousMerchant(merchant);

  const result = await db.query(
    `INSERT INTO transactions
      (txn_ref, customer_id, customer_name, amount, merchant, location, device,
       is_new_device, is_new_location, is_suspicious_merchant, timestamp,
       risk_score, risk_level, risk_reasons, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [
      txnRef,
      customerId || `CUST-${Math.floor(Math.random() * 90000) + 10000}`,
      customerName,
      amount,
      merchant,
      location,
      device,
      isNewDevice,
      isNewLocation,
      suspiciousMerchantFlag,
      txnTimestamp,
      riskScore,
      riskLevel,
      JSON.stringify(reasons),
      'Normal',
    ]
  );

  return mapRow(result.rows[0]);
}

async function updateTransaction(id, payload) {
  const existing = await getTransactionById(id);

  const merged = {
    customerName: payload.customerName ?? existing.customerName,
    amount: payload.amount ?? existing.amount,
    merchant: payload.merchant ?? existing.merchant,
    location: payload.location ?? existing.location,
    device: payload.device ?? existing.device,
    isNewDevice: payload.isNewDevice ?? existing.isNewDevice,
    isNewLocation: payload.isNewLocation ?? existing.isNewLocation,
    isSuspiciousMerchant: payload.isSuspiciousMerchant ?? existing.isSuspiciousMerchant,
  };

  const result = await db.query(
    `UPDATE transactions
     SET customer_name = $1, amount = $2, merchant = $3, location = $4, device = $5,
         is_new_device = $6, is_new_location = $7, is_suspicious_merchant = $8
     WHERE id = $9
     RETURNING *`,
    [
      merged.customerName,
      merged.amount,
      merged.merchant,
      merged.location,
      merged.device,
      merged.isNewDevice,
      merged.isNewLocation,
      merged.isSuspiciousMerchant,
      id,
    ]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Transaction not found.');
  }

  return mapRow(result.rows[0]);
}

async function deleteTransaction(id) {
  const result = await db.query('DELETE FROM transactions WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) {
    throw new ApiError(404, 'Transaction not found.');
  }
  return true;
}

async function analyzeTransaction(id) {
  const txn = await getTransactionById(id);

  const { riskScore, riskLevel, reasons } = riskEngine.evaluateTransaction({
    amount: txn.amount,
    merchant: txn.merchant,
    timestamp: txn.timestamp,
    isNewDevice: txn.isNewDevice,
    isNewLocation: txn.isNewLocation,
    isSuspiciousMerchant: txn.isSuspiciousMerchant,
  });

  const result = await db.query(
    `UPDATE transactions
     SET risk_score = $1, risk_level = $2, risk_reasons = $3
     WHERE id = $4
     RETURNING *`,
    [riskScore, riskLevel, JSON.stringify(reasons), id]
  );

  return mapRow(result.rows[0]);
}

async function updateStatus(id, status) {
  const result = await db.query(
    `UPDATE transactions SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );
  if (result.rows.length === 0) {
    throw new ApiError(404, 'Transaction not found.');
  }
  return mapRow(result.rows[0]);
}

module.exports = {
  listTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  analyzeTransaction,
  updateStatus,
  mapRow,
};
