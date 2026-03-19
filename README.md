<div align="center">

# 🔍 GitHub Activity Analyzer

**A full-stack web app to analyze any public GitHub repository in real time.**  
Commit trends · Health scores · Contributor leaderboards · Activity heatmaps · Pattern detection

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Commit Activity Chart** | Weekly commit trends visualized with Chart.js |
| 💚 **Repo Health Score** | 0–100 score based on commit frequency, recency, contributors, issues & docs |
| 🗓️ **Activity Heatmap** | GitHub-style calendar heatmap for the last 365 days |
| 🏆 **Contributor Leaderboard** | Top contributors ranked by commits with percentage share |
| 🌐 **Language Breakdown** | Donut chart of languages used across the repo |
| 🕐 **Pattern Analysis** | Detects peak coding hours, night owl vs morning dev, weekday vs weekend ratio |
| ⇌ **Compare Repos** | Side-by-side comparison of two repos with head-to-head stats |
| 👤 **Compare Developers** | Compare two contributors within the same repo |
| 📄 **Export PDF Report** | Download a full A4 PDF report with charts and tables |
| 📥 **Export CSV** | Download weekly commit data as CSV |

---

## 🖥️ Demo

> Enter any public GitHub repo like `facebook/react`, `torvalds/linux`, or `microsoft/vscode`

```
http://localhost:5173
```

---

## 🏗️ Tech Stack

### Backend
- **FastAPI** — modern async Python API framework
- **Pandas** — commit data analysis and aggregation
- **SQLAlchemy + SQLite** — result caching
- **ReportLab** — PDF report generation
- **httpx** — async GitHub REST API client with proper pagination

### Frontend
- **React 18** — component-based UI
- **Tailwind CSS** — utility-first styling
- **Chart.js + react-chartjs-2** — commit and language charts
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

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
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

API is now running at `http://localhost:8000`  
Interactive docs at `http://localhost:8000/docs`

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

App is now running at `http://localhost:5173`

---

## 🔑 Getting a GitHub Token

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token → Generate new token (classic)**
3. Give it a name (e.g. `github-analyzer`)
4. Set expiration (90 days recommended)
5. Check **`public_repo`** scope — that's all you need
6. Click **Generate token** and copy it immediately
7. Paste it into your `backend/.env` file

> **Why do you need a token?**  
> Without one, GitHub limits you to 60 API requests/hour. With a token, you get 5,000/hour.

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/repos/analyze?repo_url=` | Full repo analysis |
| `GET` | `/api/health/score?repo_url=` | Health score only |
| `GET` | `/api/commits/heatmap?repo_url=` | Daily commit counts (last 365 days) |
| `GET` | `/api/compare/repos?repo1=&repo2=` | Compare two repos |
| `GET` | `/api/compare/developers?repo_url=&dev1=&dev2=` | Compare two contributors |
| `GET` | `/api/export/csv?repo_url=` | Download commits as CSV |
| `GET` | `/api/export/pdf?repo_url=` | Download full PDF report |
| `GET` | `/api/rate-limit` | Check remaining GitHub API quota |

Full interactive docs: `http://localhost:8000/docs`

---

## 💡 Health Score Breakdown

The health score (0–100) is calculated from 5 factors:

| Factor | Max Points | What it measures |
|--------|-----------|-----------------|
| Commit Frequency | 30 | How often commits are made |
| Contributor Diversity | 20 | Number of unique contributors |
| Recency | 20 | Days since last commit |
| Documentation | 10 | Whether repo has a description |
| Issue Health | 20 | Open issues vs stars ratio |

**Labels:** `Excellent (80+)` · `Good (60+)` · `Fair (40+)` · `Needs Work (<40)`

---

## 📁 Project Structure

```
github-activity-analyzer/
├── backend/
│   ├── app/
│   │   ├── analyzers/
│   │   │   ├── commit_analyzer.py       # Pandas-powered commit stats
│   │   │   ├── contributor_analyzer.py  # Leaderboard + percentages
│   │   │   ├── health_scorer.py         # 5-factor health score
│   │   │   └── pattern_analyzer.py      # Peak hours, weekday ratios
│   │   ├── routers/
│   │   │   ├── repos.py                 # /api/repos endpoints
│   │   │   ├── commits.py               # /api/commits + heatmap
│   │   │   ├── compare.py               # /api/compare endpoints
│   │   │   ├── health.py                # /api/health endpoints
│   │   │   └── export.py                # CSV + PDF export
│   │   ├── services/
│   │   │   └── github_client.py         # GitHub REST API client
│   │   ├── db/
│   │   │   └── database.py              # SQLite + SQLAlchemy
│   │   ├── config.py                    # Environment settings
│   │   └── main.py                      # FastAPI app + routing
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   │   ├── CommitChart.jsx      # Weekly line chart
│   │   │   │   ├── LanguageChart.jsx    # Language donut chart
│   │   │   │   └── ActivityHeatmap.jsx  # Calendar heatmap
│   │   │   └── dashboard/
│   │   │       ├── HealthGauge.jsx      # Circular health meter
│   │   │       ├── ContributorLeaderboard.jsx
│   │   │       └── PatternCard.jsx      # Coding pattern insights
│   │   ├── pages/
│   │   │   └── ComparePage.jsx          # Repo + dev comparison
│   │   └── App.jsx                      # Main app + routing
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🐳 Docker (Optional)

Run the entire stack with one command:

```bash
# Add your token to backend/.env first, then:
docker-compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

---

## ⚠️ Common Mistakes to Avoid

| ❌ Mistake | ✅ Fix |
|-----------|--------|
| No GitHub token | Always set `GITHUB_TOKEN` in `.env` — without it you hit rate limits in minutes |
| Fetching unlimited commits | Client defaults to 3 pages (~300 commits) — enough for meaningful analysis |
| Ignoring pagination | Uses GitHub's `Link` header for proper cursor-based pagination |
| Blocking UI on slow requests | All sections load independently — UI renders progressively as data arrives |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
Built with ❤️ using FastAPI + React
</div>
