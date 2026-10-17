require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./connection');
const riskEngine = require('../services/riskEngine');

const INDIAN_CITIES = [
  'Mumbai, MH', 'Delhi, DL', 'Bengaluru, KA', 'Hyderabad, TG', 'Chennai, TN',
  'Kolkata, WB', 'Pune, MH', 'Ahmedabad, GJ', 'Jaipur, RJ', 'Lucknow, UP',
  'Patiala, PB', 'Chandigarh, CH', 'Surat, GJ', 'Indore, MP', 'Kochi, KL',
];

const MERCHANTS = [
  'Amazon India', 'Flipkart', 'Swiggy', 'Zomato', 'BigBasket',
  'Reliance Digital', 'Croma Electronics', 'IRCTC', 'MakeMyTrip',
  'Tata Cliq', 'Myntra', 'Apollo Pharmacy', 'BookMyShow', 'Uber India',
  'Ola Cabs', 'CryptoXchange India', 'LuckyBet Casino Online',
  'QuickForex Traders', 'GiftCard Bazaar', 'PVR Cinemas',
];

const DEVICES = [
  'iPhone 14 - Safari', 'Samsung Galaxy S23 - Chrome', 'Windows PC - Edge',
  'MacBook Pro - Chrome', 'OnePlus 11 - Chrome', 'iPad Air - Safari',
  'Redmi Note 12 - Chrome', 'Windows PC - Firefox', 'Unknown Device - Chrome',
  'Linux PC - Firefox',
];

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Ishaan', 'Kabir', 'Ananya', 'Diya', 'Saanvi',
  'Meera', 'Priya', 'Rohan', 'Karan', 'Neha', 'Simran', 'Arjun', 'Rahul',
  'Pooja', 'Sneha', 'Manish', 'Divya',
];
const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Singh',
  'Kaur', 'Malhotra', 'Chopra', 'Mehta', 'Kapoor', 'Bose', 'Rao',
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomCustomerName() {
  return `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`;
}

function randomTimestampWithinDays(days) {
  const now = Date.now();
  const past = now - randomInt(0, days) * 24 * 60 * 60 * 1000;
  const date = new Date(past);
  date.setHours(randomInt(0, 23), randomInt(0, 59), 0, 0);
  return date;
}

/**
 * Build a set of transaction "profiles" so we get a realistic mix of
 * low / medium / high risk and various statuses.
 */
function buildTransactionProfiles(count) {
  const profiles = [];

  for (let i = 0; i < count; i += 1) {
    const bucket = i % 5; // cycle through profile types for a good mix
    let amount;
    let isNewDevice = false;
    let isNewLocation = false;
    let merchant = randomFrom(MERCHANTS.slice(0, 15)); // normal merchants
    let timestamp = randomTimestampWithinDays(30);

    if (bucket === 0) {
      // Clearly LOW risk - normal small purchase, daytime, known device
      amount = randomInt(200, 8000);
    } else if (bucket === 1) {
      // MEDIUM risk - moderately high amount OR one unusual signal
      amount = randomInt(20000, 90000);
      isNewDevice = Math.random() > 0.5;
    } else if (bucket === 2) {
      // MEDIUM/HIGH - new device + new location combo
      amount = randomInt(5000, 60000);
      isNewDevice = true;
      isNewLocation = true;
    } else if (bucket === 3) {
      // HIGH risk - high amount, new device, unusual hour
      amount = randomInt(110000, 500000);
      isNewDevice = true;
      isNewLocation = Math.random() > 0.3;
      timestamp.setHours(randomInt(0, 4));
    } else {
      // HIGH risk - suspicious merchant category + high amount
      amount = randomInt(50000, 300000);
      merchant = randomFrom(MERCHANTS.slice(15));
      isNewDevice = Math.random() > 0.4;
    }

    profiles.push({
      customerName: randomCustomerName(),
      amount,
      merchant,
      location: randomFrom(INDIAN_CITIES),
      device: isNewDevice ? 'Unknown Device - Chrome' : randomFrom(DEVICES.slice(0, 8)),
      isNewDevice,
      isNewLocation,
      timestamp,
    });
  }

  return profiles;
}

function statusForRisk(riskLevel, index) {
  if (riskLevel === 'HIGH') {
    // Mix of flagged, under review, blocked
    const options = ['Flagged', 'Under Review', 'Blocked', 'Flagged'];
    return options[index % options.length];
  }
  if (riskLevel === 'MEDIUM') {
    const options = ['Normal', 'Under Review', 'Normal'];
    return options[index % options.length];
  }
  return 'Normal';
}

async function seed() {
  console.log('Seeding FinGuard database...');

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await db.query(schemaSql);
  console.log('Schema created.');

  // --- Users ---
  const users = [
    { name: 'Ritika Anand', email: 'admin@finguard.com', password: 'Admin@123', role: 'admin' },
    { name: 'Devendra Singh', email: 'analyst@finguard.com', password: 'Analyst@123', role: 'analyst' },
    { name: 'Simran Kaur', email: 'simran.kaur@finguard.com', password: 'Analyst@123', role: 'analyst' },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await db.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
      [u.name, u.email, hash, u.role]
    );
  }
  console.log(`Inserted ${users.length} users.`);

  // --- Transactions ---
  const TOTAL_TRANSACTIONS = 45;
  const profiles = buildTransactionProfiles(TOTAL_TRANSACTIONS);

  let txnCounter = 1001;
  let insertedCount = 0;

  for (const profile of profiles) {
    const { riskScore, riskLevel, reasons } = riskEngine.evaluateTransaction({
      amount: profile.amount,
      merchant: profile.merchant,
      timestamp: profile.timestamp,
      isNewDevice: profile.isNewDevice,
      isNewLocation: profile.isNewLocation,
    });

    const suspiciousMerchant = riskEngine.isSuspiciousMerchant(profile.merchant);
    const status = statusForRisk(riskLevel, insertedCount);
    const txnRef = `TXN-${txnCounter}`;
    txnCounter += 1;

    await db.query(
      `INSERT INTO transactions
        (txn_ref, customer_id, customer_name, amount, merchant, location, device,
         is_new_device, is_new_location, is_suspicious_merchant, timestamp,
         risk_score, risk_level, risk_reasons, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        txnRef,
        `CUST-${randomInt(10000, 99999)}`,
        profile.customerName,
        profile.amount,
        profile.merchant,
        profile.location,
        profile.device,
        profile.isNewDevice,
        profile.isNewLocation,
        suspiciousMerchant,
        profile.timestamp,
        riskScore,
        riskLevel,
        JSON.stringify(reasons),
        status,
      ]
    );
    insertedCount += 1;
  }

  console.log(`Inserted ${insertedCount} transactions.`);

  // --- Audit logs for flagged/reviewed transactions ---
  const flaggedResult = await db.query(
    `SELECT id, txn_ref, status FROM transactions WHERE status != 'Normal' ORDER BY id ASC`
  );
  const adminUser = await db.query(`SELECT id, name FROM users WHERE role = 'admin' LIMIT 1`);
  const analystUser = await db.query(`SELECT id, name FROM users WHERE role = 'analyst' LIMIT 1`);
  const actingUser = analystUser.rows[0] || adminUser.rows[0];

  let auditCount = 0;
  for (const row of flaggedResult.rows) {
    await db.query(
      `INSERT INTO audit_logs (user_id, transaction_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [
        actingUser.id,
        row.id,
        'Risk analysis performed',
        `${actingUser.name} ran risk analysis for ${row.txn_ref}.`,
      ]
    );
    await db.query(
      `INSERT INTO audit_logs (user_id, transaction_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [
        actingUser.id,
        row.id,
        'Transaction status changed',
        `${actingUser.name} marked ${row.txn_ref} as "${row.status}".`,
      ]
    );
    auditCount += 2;
  }

  console.log(`Inserted ${auditCount} audit log entries.`);
  console.log('Seeding complete.');
  console.log('');
  console.log('Demo login credentials:');
  console.log('  Admin:   admin@finguard.com / Admin@123');
  console.log('  Analyst: analyst@finguard.com / Analyst@123');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
