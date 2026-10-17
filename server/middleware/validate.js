const { ApiError } = require('./errorHandler');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(req, res, next) {
  const { name, email, password, role } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return next(new ApiError(400, 'Name is required.'));
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return next(new ApiError(400, 'A valid email is required.'));
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return next(new ApiError(400, 'Password must be at least 6 characters long.'));
  }
  if (role && !['analyst', 'admin'].includes(role)) {
    return next(new ApiError(400, 'Role must be either "analyst" or "admin".'));
  }
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  if (!email || !EMAIL_REGEX.test(email)) {
    return next(new ApiError(400, 'A valid email is required.'));
  }
  if (!password) {
    return next(new ApiError(400, 'Password is required.'));
  }
  next();
}

function validateTransaction(req, res, next) {
  const { customerName, amount, merchant, location, device } = req.body;

  if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
    return next(new ApiError(400, 'Customer name is required.'));
  }
  if (amount === undefined || amount === null || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    return next(new ApiError(400, 'Amount must be a positive number.'));
  }
  if (!merchant || typeof merchant !== 'string' || !merchant.trim()) {
    return next(new ApiError(400, 'Merchant is required.'));
  }
  if (!location || typeof location !== 'string' || !location.trim()) {
    return next(new ApiError(400, 'Location is required.'));
  }
  if (!device || typeof device !== 'string' || !device.trim()) {
    return next(new ApiError(400, 'Device is required.'));
  }
  next();
}

const VALID_STATUSES = ['Normal', 'Under Review', 'Flagged', 'Blocked'];

function validateStatusUpdate(req, res, next) {
  const { status } = req.body;
  if (!status || !VALID_STATUSES.includes(status)) {
    return next(new ApiError(400, `Status must be one of: ${VALID_STATUSES.join(', ')}`));
  }
  next();
}

function validateRoleUpdate(req, res, next) {
  const { role } = req.body;
  if (!role || !['analyst', 'admin'].includes(role)) {
    return next(new ApiError(400, 'Role must be either "analyst" or "admin".'));
  }
  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateTransaction,
  validateStatusUpdate,
  validateRoleUpdate,
  VALID_STATUSES,
};
