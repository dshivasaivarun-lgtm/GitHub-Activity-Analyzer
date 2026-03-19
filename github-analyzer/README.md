# GitHub Activity Analyzer

Analyze any public GitHub repo: commit trends, health scores, contributor leaderboards, language breakdown, and activity patterns.

## Tech Stack
- **Backend**: Python · FastAPI · Pandas · SQLAlchemy
- **Frontend**: React · Tailwind CSS · Chart.js

## Quick Start

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # Add your GITHUB_TOKEN
uvicorn app.main:app --reload
```
API docs: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
App: http://localhost:5173

### Docker (optional)
```bash
docker-compose up --build
```

## Features
- Live GitHub repo analysis via REST API
- Repo health score (0-100) with breakdown
- Commit activity chart (weekly trends)
- Top contributors leaderboard
- Language breakdown donut chart
- Commit pattern analysis (peak hours, weekday vs weekend)
- Compare two repos side by side: GET /api/repos/compare
- Export commits as CSV

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/repos/analyze?repo_url= | Full analysis |
| GET | /api/repos/compare?repo1=&repo2= | Compare two repos |
| GET | /api/health/score?repo_url= | Health score only |
| GET | /api/export/csv?repo_url= | Download CSV |
