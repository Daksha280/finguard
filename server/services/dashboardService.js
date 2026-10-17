const db = require('../database/connection');

async function getStats() {
  const totalsResult = await db.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE risk_level = 'HIGH')::int AS high_risk,
      COUNT(*) FILTER (WHERE risk_level = 'MEDIUM')::int AS medium_risk,
      COUNT(*) FILTER (WHERE risk_level = 'LOW')::int AS low_risk,
      COUNT(*) FILTER (WHERE status = 'Flagged')::int AS flagged,
      COUNT(*) FILTER (WHERE status = 'Blocked')::int AS blocked,
      COUNT(*) FILTER (WHERE status = 'Under Review')::int AS under_review,
      COALESCE(SUM(amount), 0)::float AS total_amount
    FROM transactions
  `);

  const row = totalsResult.rows[0];

  return {
    totalTransactions: row.total,
    highRisk: row.high_risk,
    mediumRisk: row.medium_risk,
    lowRisk: row.low_risk,
    flagged: row.flagged,
    blocked: row.blocked,
    underReview: row.under_review,
    totalAmount: row.total_amount,
  };
}

async function getRiskDistribution() {
  const result = await db.query(`
    SELECT risk_level, COUNT(*)::int AS count
    FROM transactions
    GROUP BY risk_level
  `);

  const distribution = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  result.rows.forEach((r) => {
    distribution[r.risk_level] = r.count;
  });

  return distribution;
}

async function getVolumeOverTime() {
  const result = await db.query(`
    SELECT
      TO_CHAR(DATE_TRUNC('day', timestamp), 'YYYY-MM-DD') AS day,
      COUNT(*)::int AS count,
      COALESCE(SUM(amount), 0)::float AS total_amount
    FROM transactions
    GROUP BY DATE_TRUNC('day', timestamp)
    ORDER BY DATE_TRUNC('day', timestamp) ASC
  `);

  return result.rows.map((r) => ({
    date: r.day,
    count: r.count,
    totalAmount: r.total_amount,
  }));
}

async function getRecentSuspicious(limit = 8) {
  const result = await db.query(
    `SELECT * FROM transactions
     WHERE risk_level IN ('MEDIUM', 'HIGH') OR status IN ('Flagged', 'Blocked', 'Under Review')
     ORDER BY timestamp DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

module.exports = { getStats, getRiskDistribution, getVolumeOverTime, getRecentSuspicious };
