from fastapi import APIRouter, HTTPException
from app.services.github_client import get_repo, get_commits, get_contributors, get_languages, parse_owner_repo
from app.analyzers.commit_analyzer import analyze_commits
from app.analyzers.health_scorer import compute_health_score
from app.analyzers.contributor_analyzer import analyze_contributors
from app.analyzers.pattern_analyzer import analyze_patterns

router = APIRouter()

@router.get("/analyze")
async def analyze_repo(repo_url: str):
    try:
        owner, repo = parse_owner_repo(repo_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        repo_data, commits, contributors, languages = (
            await get_repo(owner, repo),
            await get_commits(owner, repo),
            await get_contributors(owner, repo),
            await get_languages(owner, repo),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"GitHub API error: {e}")

    commit_stats   = analyze_commits(commits)
    health_score   = compute_health_score(repo_data, commits, contributors)
    contrib_stats  = analyze_contributors(contributors)
    patterns       = analyze_patterns(commits)
    total_bytes    = sum(languages.values())
    lang_breakdown = [{"language": k, "bytes": v, "percentage": round(v/total_bytes*100,1)}
                      for k, v in sorted(languages.items(), key=lambda x: -x[1])] if total_bytes else []

    return {
        "repo": {
            "full_name": repo_data.get("full_name"),
            "description": repo_data.get("description"),
            "stars": repo_data.get("stargazers_count"),
            "forks": repo_data.get("forks_count"),
            "open_issues": repo_data.get("open_issues_count"),
            "created_at": repo_data.get("created_at"),
            "updated_at": repo_data.get("updated_at"),
        },
        "commit_stats": commit_stats,
        "health_score": health_score,
        "contributors": contrib_stats,
        "patterns": patterns,
        "languages": lang_breakdown,
    }

@router.get("/compare")
async def compare_repos(repo1: str, repo2: str):
    """Compare two repos side by side."""
    from fastapi import Request
    results = []
    for url in [repo1, repo2]:
        try:
            owner, repo = parse_owner_repo(url)
            repo_data = await get_repo(owner, repo)
            commits = await get_commits(owner, repo, max_pages=2)
            contributors = await get_contributors(owner, repo)
            health = compute_health_score(repo_data, commits, contributors)
            results.append({"repo": repo_data.get("full_name"), "health": health, "stars": repo_data.get("stargazers_count"), "commits": len(commits)})
        except Exception as e:
            results.append({"repo": url, "error": str(e)})
    return {"comparison": results}
