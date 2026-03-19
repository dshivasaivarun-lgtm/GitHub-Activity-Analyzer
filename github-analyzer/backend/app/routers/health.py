from fastapi import APIRouter, HTTPException
from app.services.github_client import get_repo, get_commits, get_contributors, parse_owner_repo
from app.analyzers.health_scorer import compute_health_score

router = APIRouter()

@router.get("/score")
async def health_score(repo_url: str):
    try:
        owner, repo = parse_owner_repo(repo_url)
        repo_data = await get_repo(owner, repo)
        commits = await get_commits(owner, repo, max_pages=3)
        contributors = await get_contributors(owner, repo)
        return compute_health_score(repo_data, commits, contributors)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
