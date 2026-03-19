import pandas as pd
from typing import List, Dict, Any

def analyze_churn(commit_details: List[Dict]) -> Dict[str, Any]:
    """
    Analyze code churn from detailed commit data (each commit includes stats.additions/deletions).
    commit_details: list of GitHub commit objects with stats included.
    """
    if not commit_details:
        return {}

    rows = []
    for c in commit_details:
        stats = c.get("stats", {})
        additions = stats.get("additions", 0)
        deletions = stats.get("deletions", 0)
        date_str = c.get("commit", {}).get("author", {}).get("date", "")
        if not date_str:
            continue
        from datetime import datetime
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        rows.append({
            "sha": c.get("sha", "")[:7],
            "date": dt,
            "additions": additions,
            "deletions": deletions,
            "churn": additions + deletions,
            "files_changed": len(c.get("files", [])),
        })

    if not rows:
        return {}

    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"], utc=True)
    df["week"] = df["date"].dt.to_period("W").astype(str)

    weekly = (
        df.groupby("week")
        .agg(additions=("additions", "sum"), deletions=("deletions", "sum"), commits=("sha", "count"))
        .reset_index()
    )

    # Most churned files across all commits
    file_churn: Dict[str, int] = {}
    for c in commit_details:
        for f in c.get("files", []):
            fname = f.get("filename", "")
            changes = f.get("additions", 0) + f.get("deletions", 0)
            file_churn[fname] = file_churn.get(fname, 0) + changes

    top_files = sorted(
        [{"file": k, "churn": v} for k, v in file_churn.items()],
        key=lambda x: -x["churn"]
    )[:10]

    total_additions = int(df["additions"].sum())
    total_deletions = int(df["deletions"].sum())
    total_churn     = total_additions + total_deletions
    churn_ratio     = round(total_deletions / total_additions, 2) if total_additions > 0 else 0

    # Detect spike weeks — weeks where churn > 2x the median
    median_churn = float(weekly["additions"].add(weekly["deletions"]).median())
    weekly["total_churn"] = weekly["additions"] + weekly["deletions"]
    spikes = weekly[weekly["total_churn"] > median_churn * 2][["week", "total_churn"]].to_dict(orient="records")

    # Churn stability score (0-20) for health scoring
    # Low variance in weekly churn = stable = higher score
    if len(weekly) > 1:
        cv = float(weekly["total_churn"].std() / (weekly["total_churn"].mean() + 1))
        stability_score = max(0, min(20, int(20 - cv * 10)))
    else:
        stability_score = 10

    avg_churn_per_commit = round(total_churn / len(rows), 1) if rows else 0

    return {
        "total_additions":       total_additions,
        "total_deletions":       total_deletions,
        "total_churn":           total_churn,
        "churn_ratio":           churn_ratio,
        "avg_churn_per_commit":  avg_churn_per_commit,
        "stability_score":       stability_score,
        "commits_sampled":       len(rows),
        "weekly_churn":          weekly[["week", "additions", "deletions", "total_churn"]].to_dict(orient="records"),
        "top_churned_files":     top_files,
        "churn_spikes":          spikes,
    }
