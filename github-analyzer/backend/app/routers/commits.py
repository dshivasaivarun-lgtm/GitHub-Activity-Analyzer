from fastapi import APIRouter, HTTPException
from app.services.github_client import get_commits, parse_owner_repo
from app.analyzers.commit_analyzer import analyze_commits

router = APIRouter()

@router.get("/")
async def commits(repo_url: str):
    try:
        owner, repo = parse_owner_repo(repo_url)
        raw = await get_commits(owner, repo)
        return analyze_commits(raw)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/heatmap")
async def commit_heatmap(repo_url: str):
    """Return daily commit counts (last 365 days) for calendar heatmap."""
    try:
        owner, repo = parse_owner_repo(repo_url)
        raw = await get_commits(owner, repo, max_pages=10)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    from datetime import datetime, timezone, timedelta
    counts: dict = {}
    cutoff = datetime.now(timezone.utc) - timedelta(days=365)
    for c in raw:
        date_str = c.get("commit", {}).get("author", {}).get("date", "")
        if not date_str:
            continue
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        if dt < cutoff:
            continue
        day = dt.strftime("%Y-%m-%d")
        counts[day] = counts.get(day, 0) + 1

    return [{"date": k, "count": v} for k, v in sorted(counts.items())]
