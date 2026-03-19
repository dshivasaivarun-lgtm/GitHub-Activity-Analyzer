from fastapi import APIRouter, HTTPException
import asyncio
from app.services.github_client import get_user, get_user_repos, get_commits, get_contributors, get_languages
from app.analyzers.health_scorer import compute_health_score
from app.analyzers.commit_analyzer import analyze_commits
from app.analyzers.contributor_analyzer import analyze_contributors

router = APIRouter()

@router.get("/profile")
async def user_profile(username: str):
    """Fetch GitHub user profile info."""
    try:
        return await get_user(username)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/repos")
async def user_repos(username: str):
    """List all public repos for a user with basic stats (fast, no deep analysis)."""
    try:
        user, repos = await asyncio.gather(
            get_user(username),
            get_user_repos(username),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    repo_list = [
        {
            "name": r.get("name"),
            "full_name": r.get("full_name"),
            "description": r.get("description"),
            "stars": r.get("stargazers_count", 0),
            "forks": r.get("forks_count", 0),
            "language": r.get("language"),
            "open_issues": r.get("open_issues_count", 0),
            "pushed_at": r.get("pushed_at"),
            "created_at": r.get("created_at"),
            "html_url": r.get("html_url"),
            "is_fork": r.get("fork", False),
            "size": r.get("size", 0),
        }
        for r in repos
    ]

    return {
        "user": {
            "login": user.get("login"),
            "name": user.get("name"),
            "avatar_url": user.get("avatar_url"),
            "bio": user.get("bio"),
            "public_repos": user.get("public_repos", 0),
            "followers": user.get("followers", 0),
            "following": user.get("following", 0),
            "html_url": user.get("html_url"),
            "created_at": user.get("created_at"),
        },
        "repos": repo_list,
        "total": len(repo_list),
    }

async def _analyze_single_repo(owner: str, repo_name: str) -> dict:
    """Analyze one repo — used for concurrent bulk analysis."""
    try:
        repo_data, commits, contributors, languages = await asyncio.gather(
            __import__('app.services.github_client', fromlist=['get_repo']).get_repo(owner, repo_name),
            get_commits(owner, repo_name, max_pages=2),
            get_contributors(owner, repo_name),
            get_languages(owner, repo_name),
        )
        health = compute_health_score(repo_data, commits, contributors)
        commit_stats = analyze_commits(commits)
        total_bytes = sum(languages.values())
        top_lang = max(languages, key=languages.get) if languages else None

        return {
            "name": repo_name,
            "full_name": f"{owner}/{repo_name}",
            "description": repo_data.get("description"),
            "stars": repo_data.get("stargazers_count", 0),
            "forks": repo_data.get("forks_count", 0),
            "language": repo_data.get("language"),
            "health": health,
            "total_commits": commit_stats.get("total_commits", 0),
            "top_author": commit_stats.get("top_author"),
            "pushed_at": repo_data.get("pushed_at"),
            "html_url": repo_data.get("html_url"),
            "error": None,
        }
    except Exception as e:
        return {"name": repo_name, "full_name": f"{owner}/{repo_name}", "error": str(e)}

@router.get("/analyze-all")
async def analyze_all_repos(username: str, limit: int = 10, skip_forks: bool = True):
    """
    Analyze all repos for a username.
    - limit: max repos to deeply analyze (default 10, max 20)
    - skip_forks: skip forked repos (default True)
    """
    limit = min(limit, 20)  # hard cap — protect API rate limit

    try:
        user, all_repos = await asyncio.gather(
            get_user(username),
            get_user_repos(username),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Filter and sort
    repos = [r for r in all_repos if not (skip_forks and r.get("fork", False))]
    repos = sorted(repos, key=lambda r: r.get("stargazers_count", 0), reverse=True)[:limit]

    if not repos:
        raise HTTPException(status_code=404, detail=f"No public repos found for '{username}'")

    # Analyze repos concurrently — but in batches of 5 to avoid hammering API
    results = []
    batch_size = 5
    for i in range(0, len(repos), batch_size):
        batch = repos[i:i + batch_size]
        batch_results = await asyncio.gather(
            *[_analyze_single_repo(username, r["name"]) for r in batch]
        )
        results.extend(batch_results)

    # Aggregate stats across all repos
    successful = [r for r in results if not r.get("error")]
    all_languages = {}
    for r in successful:
        lang = r.get("language")
        if lang:
            all_languages[lang] = all_languages.get(lang, 0) + 1

    top_language = max(all_languages, key=all_languages.get) if all_languages else None
    avg_health = round(
        sum(r["health"]["total"] for r in successful) / len(successful), 1
    ) if successful else 0
    total_stars = sum(r.get("stars", 0) for r in successful)
    total_commits = sum(r.get("total_commits", 0) for r in successful)

    return {
        "user": {
            "login": user.get("login"),
            "name": user.get("name"),
            "avatar_url": user.get("avatar_url"),
            "bio": user.get("bio"),
            "public_repos": user.get("public_repos", 0),
            "followers": user.get("followers", 0),
            "html_url": user.get("html_url"),
        },
        "summary": {
            "repos_analyzed": len(successful),
            "avg_health_score": avg_health,
            "total_stars": total_stars,
            "total_commits": total_commits,
            "top_language": top_language,
            "language_distribution": sorted(
                [{"language": k, "count": v} for k, v in all_languages.items()],
                key=lambda x: -x["count"]
            ),
        },
        "repos": sorted(results, key=lambda r: r.get("health", {}).get("total", 0), reverse=True),
    }
