import httpx
import re
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from app.config import settings

BASE_URL = "https://api.github.com"

# ── Shared persistent client (connection pooling, not recreated per call) ────
_client: Optional[httpx.AsyncClient] = None

def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=15.0)
    return _client

# ── Headers with token check ─────────────────────────────────────────────────
def _headers() -> Dict[str, str]:
    if not settings.GITHUB_TOKEN:
        raise HTTPException(
            status_code=401,
            detail=(
                "No GITHUB_TOKEN set. Unauthenticated requests are limited to "
                "60/hour and will fail quickly on any real repo. "
                "Add your token to backend/.env — see README for instructions."
            ),
        )
    return {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {settings.GITHUB_TOKEN}",
        "X-GitHub-Api-Version": "2022-11-28",
    }

# ── Rate-limit-aware request wrapper ─────────────────────────────────────────
async def _get(url: str, params: dict = None) -> Any:
    client = get_client()
    r = await client.get(url, headers=_headers(), params=params)

    # Expose remaining quota in logs — helpful during dev
    remaining = r.headers.get("x-ratelimit-remaining", "?")
    limit      = r.headers.get("x-ratelimit-limit", "?")

    if r.status_code == 403 and "rate limit" in r.text.lower():
        reset_ts = r.headers.get("x-ratelimit-reset", "soon")
        raise HTTPException(
            status_code=429,
            detail=f"GitHub rate limit hit (0/{limit} remaining). Resets at unix timestamp {reset_ts}.",
        )
    if r.status_code == 404:
        raise HTTPException(status_code=404, detail=f"Repository not found: {url}")

    r.raise_for_status()
    return r.json()

# ── Pagination helper — follows Link: <next> headers ─────────────────────────
async def _get_paginated(url: str, params: dict = None, max_pages: int = 5) -> List[Dict]:
    """
    Proper cursor-based pagination using GitHub's Link header.
    Stops at max_pages to avoid hammering the API on huge repos.
    """
    results = []
    params = {**(params or {}), "per_page": 100}
    next_url: Optional[str] = url
    page = 0

    client = get_client()
    while next_url and page < max_pages:
        r = await client.get(next_url, headers=_headers(), params=params if page == 0 else None)

        remaining = r.headers.get("x-ratelimit-remaining", "?")
        if r.status_code == 403 and "rate limit" in r.text.lower():
            reset_ts = r.headers.get("x-ratelimit-reset", "")
            raise HTTPException(status_code=429, detail=f"GitHub rate limit hit. Resets at {reset_ts}.")

        r.raise_for_status()
        data = r.json()
        if not data:
            break
        results.extend(data)
        page += 1

        # Parse Link header for next page URL
        link_header = r.headers.get("link", "")
        next_url = _parse_next_link(link_header)

    return results

def _parse_next_link(link_header: str) -> Optional[str]:
    """Extract the 'next' URL from GitHub's Link header."""
    if not link_header:
        return None
    # e.g. <https://api.github.com/...?page=2>; rel="next"
    match = re.search(r'<([^>]+)>;\s*rel="next"', link_header)
    return match.group(1) if match else None

# ── Public API functions ──────────────────────────────────────────────────────
async def get_repo(owner: str, repo: str) -> Dict[str, Any]:
    return await _get(f"{BASE_URL}/repos/{owner}/{repo}")

async def get_commits(
    owner: str,
    repo: str,
    max_pages: int = 3,          # ~300 commits default — enough for analysis
    since: Optional[str] = None, # ISO 8601 date string — limit by date range
) -> List[Dict]:
    params = {}
    if since:
        params["since"] = since
    return await _get_paginated(
        f"{BASE_URL}/repos/{owner}/{repo}/commits",
        params=params,
        max_pages=max_pages,
    )

async def get_contributors(owner: str, repo: str) -> List[Dict]:
    # Single page of top 100 contributors is plenty for analysis
    return await _get(
        f"{BASE_URL}/repos/{owner}/{repo}/contributors",
        params={"per_page": 100, "anon": "false"},
    )

async def get_languages(owner: str, repo: str) -> Dict[str, int]:
    return await _get(f"{BASE_URL}/repos/{owner}/{repo}/languages")

async def get_pull_requests(owner: str, repo: str, state: str = "all") -> List[Dict]:
    return await _get_paginated(
        f"{BASE_URL}/repos/{owner}/{repo}/pulls",
        params={"state": state},
        max_pages=2,
    )

async def get_issues(owner: str, repo: str, state: str = "all") -> List[Dict]:
    return await _get_paginated(
        f"{BASE_URL}/repos/{owner}/{repo}/issues",
        params={"state": state},
        max_pages=2,
    )

def parse_owner_repo(repo_url: str):
    """Parse 'owner/repo' or full GitHub URL into (owner, repo)."""
    repo_url = repo_url.rstrip("/").removesuffix(".git")
    if "github.com" in repo_url:
        parts = repo_url.split("github.com/")[-1].split("/")
    else:
        parts = repo_url.split("/")
    if len(parts) < 2 or not parts[0] or not parts[1]:
        raise ValueError("Invalid repo format. Use 'owner/repo' or a full GitHub URL.")
    return parts[0], parts[1]
