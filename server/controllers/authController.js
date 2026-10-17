const authService = require('../services/authService');
const auditService = require('../services/auditService');

async function register(req, res, next) {
  try {
    const { user, token } = await authService.register(req.body);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { user, token } = await authService.login(req.body);
    await auditService.logAction({
      userId: user.id,
      action: 'User login',
      details: `${user.name} (${user.role}) logged in.`,
    });
    res.status(200).json({ user, token });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getUserById(req.user.id);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
