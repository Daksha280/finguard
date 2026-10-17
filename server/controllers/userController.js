const db = require('../database/connection');
const { ApiError } = require('../middleware/errorHandler');
const auditService = require('../services/auditService');

async function list(req, res, next) {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at ASC'
    );
    res.status(200).json({ users: result.rows });
  } catch (err) {
    next(err);
  }
}

async function updateRole(req, res, next) {
  try {
    const { role } = req.body;
    const { id } = req.params;

    const result = await db.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role, created_at',
      [role, id]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'User not found.');
    }

    const updatedUser = result.rows[0];

    await auditService.logAction({
      userId: req.user.id,
      action: 'User role changed',
      details: `${req.user.name} changed ${updatedUser.name}'s role to "${role}".`,
    });

    res.status(200).json({ user: updatedUser });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, updateRole };
