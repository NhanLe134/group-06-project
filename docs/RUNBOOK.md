# Runbook

## Local Development

### Prerequisites

- Docker (for `compose.yaml`)
- Python >= 3.12 with [uv](https://github.com/astral-sh/uv)
- Node.js (see `frontend/package.json`)

### Setup

```bash
cp .env.example .env
docker compose up -d db
cd backend && uv sync
cd frontend && npm install
```

## Common Issues

> Status: pending — to be filled in as issues are encountered.
