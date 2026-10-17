const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/connection');
const { ApiError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

async function register({ name, email, password, role }) {
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new ApiError(400, 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, passwordHash, role || 'analyst']
  );

  const user = result.rows[0];
  const token = signToken(user);
  return { user, token };
}

async function login({ email, password }) {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const userRow = result.rows[0];

  if (!userRow) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const isMatch = await bcrypt.compare(password, userRow.password_hash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const user = {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    role: userRow.role,
    created_at: userRow.created_at,
  };

  const token = signToken(user);
  return { user, token };
}

async function getUserById(id) {
  const result = await db.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [id]
  );
  if (result.rows.length === 0) {
    throw new ApiError(404, 'User not found.');
  }
  return result.rows[0];
}

module.exports = { register, login, getUserById, signToken };
