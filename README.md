# FinGuard — Transaction Risk Monitoring Platform

FinGuard is a full-stack internal fintech tool that helps financial analysts monitor transactions, understand *why* a transaction looks risky, and investigate suspicious activity end to end. It's built as a realistic, portfolio-quality demonstration of production web-application engineering — not a toy CRUD app.

---

## 1. Overview

FinGuard lets an analyst log in, see a live risk-monitoring dashboard, search and filter the full transaction ledger, drill into any transaction to see an **explainable** risk score, change its status, and see every action recorded in an audit trail. Admins additionally manage user accounts and roles.

The core idea the project demonstrates is **explainable risk scoring**: instead of a black-box model, every point on a transaction's risk score is tied to a named, human-readable rule (unusual amount, new device, unusual location, unusual hour, suspicious merchant). An analyst can always see exactly why a score is what it is.

---

## 2. Features

- **Authentication** — JWT-based login, bcrypt password hashing, role-based access control (Analyst / Admin)
- **Dashboard** — live summary cards (total, high/medium risk, flagged), transaction volume chart, risk distribution chart, amount trend chart, recent suspicious transactions table — all backend-driven
- **Transactions** — searchable, filterable (risk level, status, date range, amount range), sortable (amount, risk score, date), paginated table
- **Transaction Details** — full transaction record, a visual risk gauge, and a line-by-line breakdown of every factor that contributed to the score
- **Explainable Risk Engine** — rule-based scoring service, fully reusable, capped at 100 points, returns score + level + reasons
- **Status Workflow** — Normal → Under Review → Flagged → Blocked, with every change written to the audit log
- **Audit Logging** — every login, analysis run, status change, and role change is recorded with actor, action, and timestamp
- **User Management (Admin)** — view all users, promote/demote roles
- **Validation & Error Handling** — input validation on every write endpoint, centralized Express error handler, correct HTTP status codes, no UI crashes on failed requests
- **Automated Tests** — Jest + Supertest suite exercising auth, CRUD, risk analysis, status updates, and authorization

---

## 3. Architecture

```
                     ┌─────────────────────────┐
                     │        Browser           │
                     │   React SPA (Vite)        │
                     └────────────┬──────────────┘
                                  │ REST (JSON) over HTTPS
                                  │ Authorization: Bearer <JWT>
                     ┌────────────▼──────────────┐
                     │      Express.js API        │
                     │ ┌────────────────────────┐ │
                     │ │ routes → controllers    │ │
                     │ │        → services       │ │
                     │ │        → database       │ │
                     │ └────────────────────────┘ │
                     │  middleware: auth, validate,│
                     │  error handler              │
                     └────────────┬──────────────┘
                                  │ parameterized SQL
                     ┌────────────▼──────────────┐
                     │        PostgreSQL           │
                     │  users · transactions ·     │
                     │  audit_logs                 │
                     └─────────────────────────────┘
```

The risk-scoring logic lives entirely in `server/services/riskEngine.js` — a pure, reusable function with no HTTP or DB concerns, called by the transaction service whenever a transaction is created or (re-)analyzed.

---

## 4. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Chart.js (via react-chartjs-2), React Router |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Testing | Jest, Supertest |

---

## 5. Database Schema

**users**
| column | type | notes |
|---|---|---|
| id | serial PK | |
| name | varchar(100) | |
| email | varchar(150) | unique |
| password_hash | varchar(255) | bcrypt hash, never plaintext |
| role | varchar(20) | `analyst` \| `admin` |
| created_at | timestamp | |

**transactions**
| column | type | notes |
|---|---|---|
| id | serial PK | |
| txn_ref | varchar(20) | human-readable ref, e.g. `TXN-1032` |
| customer_id / customer_name | varchar | |
| amount | numeric(14,2) | > 0 |
| merchant, location, device | varchar | |
| is_new_device / is_new_location / is_suspicious_merchant | boolean | risk engine inputs |
| timestamp | timestamp | when the transaction occurred |
| risk_score | integer | 0–100 |
| risk_level | varchar(10) | `LOW` \| `MEDIUM` \| `HIGH` |
| risk_reasons | jsonb | array of `{factor, points, explanation}` |
| status | varchar(20) | `Normal` \| `Under Review` \| `Flagged` \| `Blocked` |
| created_at | timestamp | |

**audit_logs**
| column | type | notes |
|---|---|---|
| id | serial PK | |
| user_id | int FK → users(id) | |
| transaction_id | int FK → transactions(id), nullable | |
| action | varchar(255) | e.g. "Transaction status changed" |
| details | varchar(500) | human-readable description |
| timestamp | timestamp | |

All foreign keys, indexes (on status, risk_level, timestamp, customer, merchant, email), and check constraints are defined in `server/database/schema.sql`.

---

## 6. Explainable Risk Engine

Located at `server/services/riskEngine.js`. Rule-based, additive, capped at 100:

| Rule | Points |
|---|---|
| Amount > ₹1,00,000 (unusually high) | +30 |
| Transaction from a new/unseen device | +25 |
| Transaction from an unusual location | +20 |
| Transaction during unusual hours (00:00–05:00) | +15 |
| Merchant in a high-risk category (crypto, betting, forex, gift cards, etc.) | +10 |

Risk levels: `0–30 → LOW`, `31–60 → MEDIUM`, `61–100 → HIGH`.

Example response from `POST /api/transactions/:id/analyze`:

```json
{
  "riskScore": 70,
  "riskLevel": "HIGH",
  "reasons": [
    { "factor": "Transaction Amount", "points": 30, "explanation": "Transaction amount of ₹1,92,483 is significantly higher than the customer's typical amount (threshold: ₹1,00,000)." },
    { "factor": "Device", "points": 25, "explanation": "Transaction originated from a previously unseen device." },
    { "factor": "Merchant", "points": 15, "explanation": "..." }
  ]
}
```

---

## 7. API Overview

All routes except `/api/auth/login` and `/api/auth/register` require `Authorization: Bearer <token>`.

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | public | Create a user |
| POST | `/api/auth/login` | public | Log in, returns JWT |
| GET | `/api/auth/me` | authenticated | Current user profile |
| GET | `/api/transactions` | authenticated | List, with search/filter/sort/pagination |
| GET | `/api/transactions/:id` | authenticated | Transaction details |
| POST | `/api/transactions` | authenticated | Create transaction (risk-scored on insert) |
| PUT | `/api/transactions/:id` | authenticated | Update transaction fields |
| DELETE | `/api/transactions/:id` | admin | Delete a transaction |
| POST | `/api/transactions/:id/analyze` | authenticated | Re-run the risk engine |
| PUT | `/api/transactions/:id/status` | authenticated | Change status (writes audit log) |
| GET | `/api/dashboard/stats` | authenticated | Summary cards + volume + recent suspicious |
| GET | `/api/dashboard/risk-distribution` | authenticated | Low/medium/high counts |
| GET | `/api/audit-logs` | authenticated | Paginated audit trail |
| GET | `/api/users` | admin | List users |
| PUT | `/api/users/:id/role` | admin | Change a user's role |

---

## 8. Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally (or reachable)

### 8.1 Database

```bash
createdb finguard
# or: psql -c "CREATE DATABASE finguard;"
```

### 8.2 Backend

```bash
cd server
cp .env.example .env
# edit .env with your PostgreSQL credentials and a real JWT_SECRET
npm install
npm run seed     # creates schema + demo data
npm run dev       # starts the API on http://localhost:5000
```

Demo accounts created by the seed script:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@finguard.com` | `Admin@123` |
| Analyst | `analyst@finguard.com` | `Analyst@123` |

### 8.3 Frontend

```bash
cd client
npm install
npm run dev       # starts Vite on http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:5000`, so no CORS configuration is needed in development.

### 8.4 Running Tests

```bash
cd server
npm test
```

---

## 9. Environment Variables

See `server/.env.example`:

```
PORT=5000
NODE_ENV=development

PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=finguard

JWT_SECRET=change_this_to_a_long_random_secret_in_production
JWT_EXPIRES_IN=8h

CLIENT_ORIGIN=http://localhost:5173
```

Never commit a real `.env` file — only `.env.example` is checked in.

---

## 10. Project Structure

```
finguard/
├── server/
│   ├── controllers/     # request/response handling
│   ├── routes/          # Express routers
│   ├── services/        # business logic (riskEngine, transactions, auth, audit, dashboard)
│   ├── middleware/       # auth, validation, error handling
│   ├── database/         # connection, schema.sql, seed.js
│   ├── tests/             # Jest + Supertest
│   ├── app.js / server.js
│   └── .env.example
│
└── client/
    └── src/
        ├── components/     # Sidebar, Navbar, RiskBadge, TransactionTable, RiskChart, ...
        ├── pages/           # Login, Dashboard, Transactions, TransactionDetails, AuditLogs, Users, Profile
        ├── services/api.js  # axios client
        ├── hooks/useAuth.jsx
        └── utils/format.js
```

---

## 11. Design Notes

The UI intentionally avoids "AI dashboard" clichés — no neon, no glowing borders, no dark cyberpunk theme. It uses a light, high-density, professional palette (white cards, subtle borders, blue accent, red/amber/green for risk states) similar to what you'd find in an internal enterprise ops tool, with IBM Plex Mono used for transaction IDs, amounts, and timestamps to give tabular data a clear, scannable, "systems of record" feel.

---

## 12. Future Improvements

- WebSocket-based live updates for new high-risk transactions
- Configurable risk-rule thresholds via an admin settings page
- CSV/PDF export of filtered transaction lists and audit logs
- Per-customer historical baselines (rather than fixed thresholds) for amount/location/device anomaly detection
- Multi-factor authentication for admin accounts
- Rate limiting and request logging middleware
