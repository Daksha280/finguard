const db = require('../database/connection');

/**
 * Record an entry in the audit log.
 * @param {Object} params
 * @param {number} params.userId
 * @param {number|null} params.transactionId
 * @param {string} params.action
 * @param {string} [params.details]
 */
async function logAction({ userId, transactionId = null, action, details = null }) {
  await db.query(
    `INSERT INTO audit_logs (user_id, transaction_id, action, details)
     VALUES ($1, $2, $3, $4)`,
    [userId, transactionId, action, details]
  );
}

async function getLogs({ limit = 100, offset = 0 } = {}) {
  const result = await db.query(
    `SELECT
        al.id,
        al.action,
        al.details,
        al.timestamp,
        u.id   AS user_id,
        u.name AS user_name,
        u.role AS user_role,
        t.id      AS transaction_id,
        t.txn_ref AS transaction_ref
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     LEFT JOIN transactions t ON al.transaction_id = t.id
     ORDER BY al.timestamp DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const countResult = await db.query('SELECT COUNT(*)::int AS total FROM audit_logs');

  return {
    logs: result.rows,
    total: countResult.rows[0].total,
  };
}

module.exports = { logAction, getLogs };
