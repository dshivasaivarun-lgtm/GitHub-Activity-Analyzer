from fastapi import APIRouter, HTTPException
from app.services.github_client import get_repo, get_commits, get_contributors, parse_owner_repo
from app.analyzers.commit_analyzer import analyze_commits
from app.analyzers.health_scorer import compute_health_score
from app.analyzers.contributor_analyzer import analyze_contributors
from app.analyzers.pattern_analyzer import analyze_patterns
import asyncio

router = APIRouter()

async def _analyze_one(repo_url: str) -> dict:
    owner, repo = parse_owner_repo(repo_url)
    repo_data, commits, contributors = await asyncio.gather(
        get_repo(owner, repo),
        get_commits(owner, repo, max_pages=3),
        get_contributors(owner, repo),
    )
    return {
        "repo": repo_data.get("full_name"),
        "description": repo_data.get("description"),
        "stars": repo_data.get("stargazers_count", 0),
        "forks": repo_data.get("forks_count", 0),
        "open_issues": repo_data.get("open_issues_count", 0),
        "health": compute_health_score(repo_data, commits, contributors),
        "commit_stats": analyze_commits(commits),
        "contributors": analyze_contributors(contributors),
        "patterns": analyze_patterns(commits),
    }

@router.get("/repos")
async def compare_repos(repo1: str, repo2: str):
    try:
        r1, r2 = await asyncio.gather(
            _analyze_one(repo1),
            _analyze_one(repo2),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    winner = {}
    for key, label in [("stars","Stars"),("health","Health Score"),("commit_stats","Commit Count")]:
        v1 = r1[key]["total"] if key == "health" else (r1[key].get("total_commits") if key == "commit_stats" else r1[key])
        v2 = r2[key]["total"] if key == "health" else (r2[key].get("total_commits") if key == "commit_stats" else r2[key])
        winner[label] = r1["repo"] if (v1 or 0) >= (v2 or 0) else r2["repo"]

    return {"left": r1, "right": r2, "winners": winner}

@router.get("/developers")
async def compare_developers(repo_url: str, dev1: str, dev2: str):
    """Compare two contributors within the same repo."""
    try:
        owner, repo = parse_owner_repo(repo_url)
        commits = await get_commits(owner, repo, max_pages=5)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    def stats_for(login: str):
        user_commits = [
            c for c in commits
            if (c.get("author") or {}).get("login", "").lower() == login.lower()
        ]
        if not user_commits:
            return {"login": login, "found": False}
        s = analyze_commits(user_commits)
        return {
            "login": login,
            "found": True,
            "total_commits": s.get("total_commits", 0),
            "most_active_day": s.get("most_active_day"),
            "most_active_hour": s.get("most_active_hour"),
            "patterns": analyze_patterns(user_commits),
            "weekly_commits": s.get("weekly_commits", []),
        }

    d1, d2 = stats_for(dev1), stats_for(dev2)
    winner_commits = dev1 if d1.get("total_commits", 0) >= d2.get("total_commits", 0) else dev2
    return {"left": d1, "right": d2, "winner_by_commits": winner_commits}
