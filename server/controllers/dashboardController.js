const dashboardService = require('../services/dashboardService');
const transactionService = require('../services/transactionService');

async function stats(req, res, next) {
  try {
    const [summary, volume, recent] = await Promise.all([
      dashboardService.getStats(),
      dashboardService.getVolumeOverTime(),
      dashboardService.getRecentSuspicious(8),
    ]);

    res.status(200).json({
      summary,
      volumeOverTime: volume,
      recentSuspicious: recent.map(transactionService.mapRow),
    });
  } catch (err) {
    next(err);
  }
}

async function riskDistribution(req, res, next) {
  try {
    const distribution = await dashboardService.getRiskDistribution();
    res.status(200).json({ distribution });
  } catch (err) {
    next(err);
  }
}

module.exports = { stats, riskDistribution };
