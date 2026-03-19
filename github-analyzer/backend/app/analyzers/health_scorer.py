from typing import Dict, Any, Optional
from datetime import datetime, timezone

def compute_health_score(
    repo_data: Dict,
    commits: list,
    contributors: list,
    churn_data: Optional[Dict] = None,
) -> Dict[str, Any]:
    score = 0
    breakdown = {}

    # 1. Commit frequency (max 25 pts)
    total_commits = len(commits)
    commit_score = min(25, total_commits // 10)
    breakdown["commit_frequency"] = {"score": commit_score, "max": 25, "raw": total_commits}
    score += commit_score

    # 2. Contributor diversity (max 20 pts)
    num_contributors = len(contributors)
    contrib_score = min(20, num_contributors * 4)
    breakdown["contributor_diversity"] = {"score": contrib_score, "max": 20, "raw": num_contributors}
    score += contrib_score

    # 3. Recency (max 20 pts)
    recency_score = 0
    if commits:
        last_date_str = commits[0].get("commit", {}).get("author", {}).get("date", "")
        if last_date_str:
            last_dt = datetime.fromisoformat(last_date_str.replace("Z", "+00:00"))
            days_since = (datetime.now(timezone.utc) - last_dt).days
            recency_score = max(0, 20 - days_since // 7)
    breakdown["recency"] = {"score": recency_score, "max": 20}
    score += recency_score

    # 4. Documentation (max 10 pts)
    desc_score = 10 if repo_data.get("description") else 0
    breakdown["documentation"] = {"score": desc_score, "max": 10}
    score += desc_score

    # 5. Issue health (max 15 pts)
    stars = repo_data.get("stargazers_count", 0)
    open_issues = repo_data.get("open_issues_count", 0)
    if stars > 0:
        ratio = open_issues / (stars + 1)
        issue_score = max(0, 15 - int(ratio * 15))
    else:
        issue_score = 8
    breakdown["issue_health"] = {"score": issue_score, "max": 15, "open_issues": open_issues, "stars": stars}
    score += issue_score

    # 6. Churn stability (max 10 pts) — only if churn data provided
    if churn_data and "stability_score" in churn_data:
        churn_score = min(10, int(churn_data["stability_score"] / 2))
        breakdown["churn_stability"] = {
            "score": churn_score,
            "max": 10,
            "raw_stability": churn_data["stability_score"],
        }
        score += churn_score
    else:
        breakdown["churn_stability"] = {"score": 0, "max": 10, "note": "Run churn analysis for this score"}

    label = "Excellent" if score >= 80 else "Good" if score >= 60 else "Fair" if score >= 40 else "Needs Work"
    return {"total": score, "max": 100, "label": label, "breakdown": breakdown}
