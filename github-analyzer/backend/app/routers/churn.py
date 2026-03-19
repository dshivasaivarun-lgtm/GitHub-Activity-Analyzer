from fastapi import APIRouter, HTTPException
from app.services.github_client import get_commits_with_stats, parse_owner_repo
from app.analyzers.churn_analyzer import analyze_churn

router = APIRouter()

@router.get("/")
async def repo_churn(repo_url: str, sample: int = 50):
    """
    Analyze code churn for a repo.
    sample: how many recent commits to fetch stats for (default 50, max 100).
    Each commit = 1 API call, so keep sample reasonable.
    """
    sample = min(sample, 100)
    try:
        owner, repo = parse_owner_repo(repo_url)
        commits = await get_commits_with_stats(owner, repo, sample=sample)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    if not commits:
        raise HTTPException(status_code=404, detail="No commit data found")

    return analyze_churn(commits)
