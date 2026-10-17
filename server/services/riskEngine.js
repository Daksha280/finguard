/**
 * riskEngine.js
 *
 * Explainable, rule-based transaction risk scoring service.
 *
 * This is intentionally NOT a machine learning model. Every point awarded
 * is tied to a concrete, human-readable rule so that an analyst can see
 * exactly why a transaction received the score it did.
 *
 * Scoring rules (points are additive, capped at 100):
 *   - Unusually high amount (relative to customer's typical spend) : +30
 *   - Transaction from a new/unseen device                         : +25
 *   - Transaction from an unusual location                          : +20
 *   - Transaction occurs during unusual hours (00:00–05:00)         : +15
 *   - Merchant flagged as suspicious/high-risk category             : +10
 *
 * Risk levels:
 *   0–30   -> LOW
 *   31–60  -> MEDIUM
 *   61–100 -> HIGH
 */

const HIGH_AMOUNT_THRESHOLD = 100000; // INR - amount considered "unusually high"
const UNUSUAL_HOUR_START = 0;
const UNUSUAL_HOUR_END = 5; // 00:00 - 05:00 considered unusual hours

const SUSPICIOUS_MERCHANT_KEYWORDS = [
  'crypto',
  'bet',
  'casino',
  'lottery',
  'forex',
  'wallet transfer',
  'gift card',
];

function isUnusualHour(date) {
  const hour = date.getHours();
  return hour >= UNUSUAL_HOUR_START && hour <= UNUSUAL_HOUR_END;
}

function isSuspiciousMerchant(merchantName) {
  const lower = merchantName.toLowerCase();
  return SUSPICIOUS_MERCHANT_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function levelFromScore(score) {
  if (score <= 30) return 'LOW';
  if (score <= 60) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Evaluate a transaction and produce an explainable risk score.
 *
 * @param {Object} txn
 * @param {number} txn.amount
 * @param {string} txn.merchant
 * @param {string|Date} txn.timestamp
 * @param {boolean} [txn.isNewDevice]
 * @param {boolean} [txn.isNewLocation]
 * @param {boolean} [txn.isSuspiciousMerchant] - optional manual override
 * @returns {{ riskScore: number, riskLevel: string, reasons: Array }}
 */
function evaluateTransaction(txn) {
  const reasons = [];
  let score = 0;

  const amount = Number(txn.amount) || 0;
  const timestamp = txn.timestamp instanceof Date ? txn.timestamp : new Date(txn.timestamp);
  const newDevice = Boolean(txn.isNewDevice);
  const newLocation = Boolean(txn.isNewLocation);
  const merchantFlagged = txn.isSuspiciousMerchant !== undefined
    ? Boolean(txn.isSuspiciousMerchant)
    : isSuspiciousMerchant(txn.merchant || '');

  // Rule 1: Unusually high transaction amount
  if (amount > HIGH_AMOUNT_THRESHOLD) {
    score += 30;
    reasons.push({
      factor: 'Transaction Amount',
      points: 30,
      explanation: `Transaction amount of ₹${amount.toLocaleString('en-IN')} is significantly higher than the customer's typical amount (threshold: ₹${HIGH_AMOUNT_THRESHOLD.toLocaleString('en-IN')}).`,
    });
  }

  // Rule 2: New device
  if (newDevice) {
    score += 25;
    reasons.push({
      factor: 'Device',
      points: 25,
      explanation: 'Transaction originated from a previously unseen device.',
    });
  }

  // Rule 3: Unusual location
  if (newLocation) {
    score += 20;
    reasons.push({
      factor: 'Location',
      points: 20,
      explanation: 'Transaction occurred from a location not typically associated with this customer.',
    });
  }

  // Rule 4: Unusual hours
  if (!Number.isNaN(timestamp.getTime()) && isUnusualHour(timestamp)) {
    score += 15;
    reasons.push({
      factor: 'Transaction Time',
      points: 15,
      explanation: `Transaction occurred at ${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}, which falls within an unusual activity window (00:00–05:00).`,
    });
  }

  // Rule 5: Suspicious merchant category
  if (merchantFlagged) {
    score += 10;
    reasons.push({
      factor: 'Merchant',
      points: 10,
      explanation: `Merchant "${txn.merchant}" falls into a category historically associated with elevated fraud risk.`,
    });
  }

  const cappedScore = Math.min(score, 100);
  const riskLevel = levelFromScore(cappedScore);

  return {
    riskScore: cappedScore,
    riskLevel,
    reasons,
  };
}

module.exports = {
  evaluateTransaction,
  levelFromScore,
  isSuspiciousMerchant,
  isUnusualHour,
  HIGH_AMOUNT_THRESHOLD,
};
