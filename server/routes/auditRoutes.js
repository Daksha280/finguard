const express = require('express');
const auditController = require('../controllers/auditController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', auditController.list);

module.exports = router;
