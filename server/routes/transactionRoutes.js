const express = require('express');
const transactionController = require('../controllers/transactionController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateTransaction, validateStatusUpdate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/', transactionController.list);
router.get('/:id', transactionController.getById);
router.post('/', validateTransaction, transactionController.create);
router.put('/:id', transactionController.update);
router.delete('/:id', authorize('admin'), transactionController.remove);
router.post('/:id/analyze', transactionController.analyze);
router.put('/:id/status', validateStatusUpdate, transactionController.updateStatus);

module.exports = router;
