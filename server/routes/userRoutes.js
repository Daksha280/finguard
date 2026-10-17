const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRoleUpdate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/', userController.list);
router.put('/:id/role', validateRoleUpdate, userController.updateRole);

module.exports = router;
