# ShadowTrace Nexus

An OSINT intelligence platform for investigating usernames, domains, and IP addresses — with a correlation engine that maps relationships between all discovered entities.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + Tailwind + Framer Motion + React Flow |
| Backend | Node.js + Express + JWT + Mongoose |
| Intelligence Engine | Python + FastAPI |
| Database | MongoDB |

---

## Prerequisites

- Node.js v18+
- Python 3.10+ (3.9 minimum)
- MongoDB (running locally on port 27017)
- npm and pip

---

## Setup — 3 Steps

### Step 1 — Intelligence Engine (Python)

```bash
cd intelligence

cp .env.example .env
# Edit .env — add ABUSEIPDB_API_KEY, GITHUB_TOKEN, and INTERNAL_SECRET

pip install -r requirements.txt

python main.py
# Runs on http://localhost:8000
```

### Step 2 — Backend (Node.js)

```bash
cd backend

cp .env.example .env
# Edit .env — set JWT_SECRET (min 32 chars), INTERNAL_SECRET (must match intelligence/.env)

# Generate secrets:
# openssl rand -hex 32

npm install

npm run dev
# Runs on http://localhost:5000
```

### Step 3 — Frontend (React)

```bash
cd frontend

npm install

npm run dev
# Runs on http://localhost:3000
```

---

## Environment Variables

### `backend/.env`

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shadowtrace
JWT_SECRET=<openssl rand -hex 32>        # REQUIRED — min 32 chars, server exits if missing
INTELLIGENCE_ENGINE_URL=http://localhost:8000
INTERNAL_SECRET=<openssl rand -hex 32>   # Shared secret with Python engine
FRONTEND_URL=http://localhost:3000       # Used for CORS in production
NODE_ENV=development
```

### `intelligence/.env`

```
ABUSEIPDB_API_KEY=your_key_from_abuseipdb.com
GITHUB_TOKEN=your_token_from_github.com/settings/tokens
INTERNAL_SECRET=<same value as backend INTERNAL_SECRET>
```

---

## API Keys (All Free)

| Service | Purpose | Register at |
|---------|---------|-------------|
| AbuseIPDB | IP threat reputation | https://www.abuseipdb.com/register |
| GitHub PAT | Higher rate limits for username checks | https://github.com/settings/tokens |

The platform works without these keys — GitHub uses unauthenticated limits (60 req/hr) and AbuseIPDB data is skipped with a note.

---

## Project Structure

```
shadowtrace-nexus/
├── frontend/               # React app
│   └── src/
│       ├── pages/          # Landing, Login, Register, Dashboard, Intel pages
│       ├── components/     # Layout, RiskBadge, IntelCard, LoadingPulse
│       ├── context/        # AuthContext
│       └── api/            # Axios client
│
├── backend/                # Express API
│   ├── models/             # User, Investigation, Node, Edge
│   ├── routes/             # auth, intelligence, graph, history
│   ├── middleware/         # JWT auth
│   └── config/             # MongoDB connection
│
└── intelligence/           # Python FastAPI engine
    ├── modules/            # username.py, domain.py, ip.py
    └── utils/              # rate_limiter.py, risk_scorer.py
```

---

## Features

- **Username Intelligence** — Checks GitHub (full API data), Reddit, Dev.to, Stack Overflow, Medium
- **Domain Intelligence** — WHOIS, DNS records (A/MX/NS/TXT), SSL certificate info, subdomain discovery via crt.sh
- **IP Intelligence** — Geolocation via ip-api.com, threat reputation via AbuseIPDB
- **Correlation Engine** — Automatically links entities across investigations (domain → IP, username → email, IP → domain)
- **Relationship Graph** — Interactive React Flow visualization of all discovered connections
- **Investigation History** — Full history with expandable raw data and delete

---

## Changelog (v1.0 → v1.1)

- **Fixed** `asyncio.get_event_loop()` deprecation warning in Python 3.10+ (`domain.py`)
- **Fixed** Dashboard activity chart now shows real investigation counts per day (was always zero)
- **Fixed** Medium platform check — now verifies final URL to avoid false positives on non-existent profiles
- **Fixed** `AuthContext` localStorage parse errors no longer freeze the loading state
- **Fixed** 401 interceptor now clears in-memory `Authorization` header (not just localStorage)
- **Fixed** IP validation added in both Node backend and Python engine before any external calls
- **Fixed** Domain risk scoring: privacy-protected WHOIS now correctly scores as higher risk (was inverted)
- **Fixed** History `?limit` parameter is now capped at 200 to prevent full DB dumps
- **Fixed** `rawData` stored per investigation is now size-bounded (no unbounded Mixed blobs)
- **Fixed** IP cross-linking in `correlateAndGraph` is now implemented (was dead code)
- **Fixed** Catch-all `*` route added — unknown URLs redirect to home instead of blank screen
- **Security** Python intelligence engine now requires `X-Internal-Secret` header — rejects unauthenticated callers
- **Security** `JWT_SECRET` length enforced at startup — server exits if missing or under 32 chars
- **Security** Registration response uses explicit safe user fields (no password hash leakage risk)
- **Security** All Node → Python engine calls now include the `X-Internal-Secret` header
- **Removed** Unused `requests` package from `requirements.txt`
- **Removed** Unused `dns_limiter` reference cleaned up in `rate_limiter.py`

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
```

Set in Vercel: `VITE_API_URL` = your Railway backend URL.
Update `frontend/src/api/client.js` baseURL to `import.meta.env.VITE_API_URL || '/api'`.

### Backend + Intelligence → Railway

1. Push to GitHub
2. Create two services — one for `backend/`, one for `intelligence/`
3. Set all environment variables in Railway dashboard
4. Use MongoDB Atlas URI for `MONGODB_URI`
