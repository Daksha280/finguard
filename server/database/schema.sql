-- FinGuard Database Schema
-- PostgreSQL

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'analyst' CHECK (role IN ('analyst', 'admin')),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- =========================
-- TRANSACTIONS
-- =========================
CREATE TABLE transactions (
    id            SERIAL PRIMARY KEY,
    txn_ref       VARCHAR(20) NOT NULL UNIQUE,           -- human readable e.g. TXN-1001
    customer_id   VARCHAR(30) NOT NULL,
    customer_name VARCHAR(120) NOT NULL,
    amount        NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    merchant      VARCHAR(150) NOT NULL,
    location      VARCHAR(120) NOT NULL,
    device        VARCHAR(120) NOT NULL,
    is_new_device BOOLEAN NOT NULL DEFAULT FALSE,
    is_new_location BOOLEAN NOT NULL DEFAULT FALSE,
    is_suspicious_merchant BOOLEAN NOT NULL DEFAULT FALSE,
    timestamp     TIMESTAMP NOT NULL DEFAULT NOW(),
    risk_score    INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level    VARCHAR(10) NOT NULL DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    risk_reasons  JSONB NOT NULL DEFAULT '[]',
    status        VARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (status IN ('Normal', 'Under Review', 'Flagged', 'Blocked')),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_risk_level ON transactions(risk_level);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX idx_transactions_customer ON transactions(customer_name);
CREATE INDEX idx_transactions_merchant ON transactions(merchant);

-- =========================
-- AUDIT LOGS
-- =========================
CREATE TABLE audit_logs (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
    action         VARCHAR(255) NOT NULL,
    details        VARCHAR(500),
    timestamp      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_transaction ON audit_logs(transaction_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
