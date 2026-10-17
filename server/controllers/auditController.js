const auditService = require('../services/auditService');

async function list(req, res, next) {
  try {
    const { limit, offset } = req.query;
    const result = await auditService.getLogs({
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
