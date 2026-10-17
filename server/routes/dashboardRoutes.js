const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/stats', dashboardController.stats);
router.get('/risk-distribution', dashboardController.riskDistribution);

module.exports = router;
