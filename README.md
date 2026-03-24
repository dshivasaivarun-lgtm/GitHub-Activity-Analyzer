<div align="center">

# 🔍 GitHub Activity Analyzer

**A full-stack web app to analyze any public GitHub repository or user in real time.**  
Commit trends · Health scores · Code churn · Contributor leaderboards · Activity heatmaps · Pattern detection

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Pandas](https://img.shields.io/badge/Pandas-3.0+-150458?style=flat-square&logo=pandas&logoColor=white)](https://pandas.pydata.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Commit Activity Chart** | Weekly commit trends visualized with Chart.js |
| 💚 **Repo Health Score** | 0–100 score across 6 factors: commits, contributors, recency, docs, issues, churn stability |
| 🔥 **Code Churn Analysis** | Lines added vs deleted per week, most churned files, spike detection, stability score |
| 🗓️ **Activity Heatmap** | GitHub-style calendar heatmap for the last 365 days |
| 🏆 **Contributor Leaderboard** | Top contributors ranked by commits with percentage share |
| 🌐 **Language Breakdown** | Donut chart of languages used across the repo |
| 🕐 **Pattern Analysis** | Peak coding hours, night owl vs morning dev, weekday vs weekend ratio |
| 👤 **User Analysis** | Enter a username to analyze ALL their public repos at once |
| ⇌ **Compare Repos** | Side-by-side comparison of two repos with head-to-head stats |
| 👥 **Compare Developers** | Compare two contributors within the same repo |
| 📄 **Export PDF Report** | Full A4 PDF with charts, tables, and health breakdown |
| 📥 **Export CSV** | Download weekly commit data as CSV |

---

## 🏗️ Tech Stack

### Backend
- **FastAPI** — async Python API framework
- **Pandas** — commit and churn data analysis
- **SQLAlchemy + SQLite** — result caching
- **ReportLab** — PDF generation
- **httpx** — async GitHub REST API client with Link-header pagination

### Frontend
- **React 18** — component-based UI with progressive loading
- **Chart.js + react-chartjs-2** — commit, churn, and language charts
- **Inline styles** — no Tailwind dependency, works on all setups
- **Vite** — fast dev server and bundler

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+ (3.13 recommended)
- Node.js 18+
- A GitHub Personal Access Token

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/github-activity-analyzer.git
cd github-activity-analyzer
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate — Windows CMD
venv\Scripts\activate
# Activate — Mac/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt --only-binary=:all:

# Set up environment variables
copy .env.example .env        # Windows
cp .env.example .env          # Mac/Linux
```

Open `.env` and add your GitHub token:
```env
GITHUB_TOKEN=ghp_your_token_here
DATABASE_URL=sqlite:///./analyzer.db
CACHE_TTL_SECONDS=3600
```

Start the backend:
```bash
uvicorn app.main:app --reload
```

API → `http://localhost:8000`  
Docs → `http://localhost:8000/docs`

### 3. Frontend setup

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

App → `http://localhost:5173`

---

## 🔑 Getting a GitHub Token

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token → Generate new token (classic)**
3. Give it a name (e.g. `github-analyzer`)
4. Set expiration (90 days recommended)
5. Check **`public_repo`** — that's all you need
6. Click **Generate token**, copy it immediately
7. Paste into `backend/.env` as `GITHUB_TOKEN=ghp_...`

> Without a token you get 60 API requests/hour. With one you get 5,000/hour.

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/repos/analyze?repo_url=` | Full repo analysis |
| `GET` | `/api/health/score?repo_url=` | Health score only |
| `GET` | `/api/commits/heatmap?repo_url=` | Daily commit counts (last 365 days) |
| `GET` | `/api/churn/?repo_url=&sample=50` | Code churn — additions, deletions, churned files, spikes |
| `GET` | `/api/user/profile?username=` | GitHub user profile |
| `GET` | `/api/user/repos?username=` | List all public repos (fast) |
| `GET` | `/api/user/analyze-all?username=&limit=10` | Deep analyze all repos for a user |
| `GET` | `/api/compare/repos?repo1=&repo2=` | Compare two repos |
| `GET` | `/api/compare/developers?repo_url=&dev1=&dev2=` | Compare two contributors |
| `GET` | `/api/export/csv?repo_url=` | Download commits as CSV |
| `GET` | `/api/export/pdf?repo_url=` | Download full PDF report |
| `GET` | `/api/rate-limit` | Check remaining GitHub API quota |

Full interactive docs → `http://localhost:8000/docs`

---

## 💡 Health Score Breakdown

The health score (0–100) is calculated across **6 factors**:

| Factor | Max | Formula |
|--------|-----|---------|
| Commit Frequency | 30 | `min(30, total_commits // 10)` — every 10 commits = 1 pt |
| Contributor Diversity | 20 | `min(20, contributors × 4)` — needs 5+ people for full score |
| Recency | 20 | `max(0, 20 − days_since_last_commit // 7)` — loses 1pt/week of inactivity |
| Documentation | 10 | `10 if repo has description else 0` — binary |
| Issue Health | 20 | `max(0, 20 − int(open_issues / (stars+1) × 20))` |
| Churn Stability | 20 | Based on churn ratio and spike count — only when churn data is fetched |

**Labels:** `Excellent (80+)` · `Good (60+)` · `Fair (40+)` · `Needs Work (<40)`

---

## 🔥 Code Churn Explained

Code churn measures lines added and deleted per commit. High churn on the same files signals instability, rewrites, or bugs. Low steady churn = healthy incremental development.

| Metric | What it means |
|--------|--------------|
| **Total additions** | Lines of code added across sampled commits |
| **Total deletions** | Lines of code removed across sampled commits |
| **Churn ratio** | `deletions / additions` — ratio near 1.0 = balanced rewrites |
| **Churn spikes** | Weeks where churn was 2× the weekly average — likely refactors or incidents |
| **Most churned files** | Top 10 files by total line changes — unstable areas of the codebase |
| **Stability score** | 0–20 pts added to health score — penalizes spike count and extreme churn ratios |

> Churn is sampled from the 50 most recent commits (configurable up to 100) to stay within GitHub API rate limits.

---

## 📁 Project Structure

```
github-activity-analyzer/
├── backend/
│   ├── app/
│   │   ├── analyzers/
│   │   │   ├── commit_analyzer.py       # Pandas commit stats
│   │   │   ├── contributor_analyzer.py  # Leaderboard + percentages
│   │   │   ├── health_scorer.py         # 6-factor health score
│   │   │   ├── pattern_analyzer.py      # Peak hours, weekday ratios
│   │   │   └── churn_analyzer.py        # Code churn, spikes, stability
│   │   ├── routers/
│   │   │   ├── repos.py                 # /api/repos
│   │   │   ├── commits.py               # /api/commits + heatmap
│   │   │   ├── churn.py                 # /api/churn
│   │   │   ├── compare.py               # /api/compare
│   │   │   ├── health.py                # /api/health
│   │   │   ├── export.py                # CSV + PDF export
│   │   │   └── user.py                  # /api/user
│   │   ├── services/
│   │   │   └── github_client.py         # GitHub REST API + pagination
│   │   ├── db/
│   │   │   └── database.py              # SQLite + SQLAlchemy
│   │   ├── config.py
│   │   └── main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   │   ├── CommitChart.jsx       # Weekly commit line chart
│   │   │   │   ├── ChurnChart.jsx        # Additions vs deletions bar chart
│   │   │   │   ├── LanguageChart.jsx     # Language donut chart
│   │   │   │   └── ActivityHeatmap.jsx   # Calendar heatmap
│   │   │   └── dashboard/
│   │   │       ├── HealthGauge.jsx       # Circular health meter
│   │   │       ├── ChurnPanel.jsx        # Full churn breakdown panel
│   │   │       ├── ContributorLeaderboard.jsx
│   │   │       └── PatternCard.jsx
│   │   ├── pages/
│   │   │   ├── ComparePage.jsx
│   │   │   └── UserPage.jsx
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── postcss.config.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## ⚠️ Common Mistakes to Avoid

| ❌ Mistake | ✅ Fix |
|-----------|--------|
| No GitHub token | Set `GITHUB_TOKEN` in `.env` — without it you hit rate limits instantly |
| Blind commit fetching | Defaults to 3 pages (~300 commits) — enough for analysis |
| No pagination | Uses GitHub's `Link` header for proper cursor-based pagination |
| Blocking UI | All sections load independently with skeleton loaders |
| Using `source` on Windows | Use `venv\Scripts\activate` instead |
| Old pandas on Python 3.13 | Use `pandas>=3.0.0` — older versions have no wheel for 3.13 |
| Fetching all commits for churn | Churn samples 50 commits — getting per-file stats requires 1 API call per commit |

---

## 🐳 Docker (Optional)

```bash
# Add token to backend/.env first, then:
docker-compose up --build
```

- Frontend → `http://localhost:5173`
- Backend → `http://localhost:8000`
- API Docs → `http://localhost:8000/docs`

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---


<div align="center">
Built with ❤️ using FastAPI + React · Python 3.13 compatible
</div>
