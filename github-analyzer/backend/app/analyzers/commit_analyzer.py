import pandas as pd
from typing import List, Dict, Any
from datetime import datetime, timezone

def analyze_commits(raw_commits: List[Dict]) -> Dict[str, Any]:
    if not raw_commits:
        return {}

    rows = []
    for c in raw_commits:
        author = c.get("commit", {}).get("author", {})
        login = (c.get("author") or {}).get("login", author.get("name", "unknown"))
        date_str = author.get("date")
        if not date_str:
            continue
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        rows.append({"sha": c.get("sha", "")[:7], "author": login, "date": dt, "message": author.get("name", "")})

    if not rows:
        return {}

    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"], utc=True)
    df["week"] = df["date"].dt.to_period("W").astype(str)
    df["day_of_week"] = df["date"].dt.day_name()
    df["hour"] = df["date"].dt.hour

    weekly = df.groupby("week").size().reset_index(name="commits")
    by_author = df.groupby("author").size().reset_index(name="commits").sort_values("commits", ascending=False)
    by_day = df.groupby("day_of_week").size().reset_index(name="commits")
    by_hour = df.groupby("hour").size().reset_index(name="commits")

    total = len(df)
    top_author = by_author.iloc[0]["author"] if len(by_author) else "N/A"
    most_active_day = by_day.sort_values("commits", ascending=False).iloc[0]["day_of_week"] if len(by_day) else "N/A"
    most_active_hour = int(by_hour.sort_values("commits", ascending=False).iloc[0]["hour"]) if len(by_hour) else 0

    return {
        "total_commits": total,
        "top_author": top_author,
        "most_active_day": most_active_day,
        "most_active_hour": most_active_hour,
        "weekly_commits": weekly.to_dict(orient="records"),
        "commits_by_author": by_author.head(10).to_dict(orient="records"),
        "commits_by_day": by_day.to_dict(orient="records"),
        "commits_by_hour": by_hour.to_dict(orient="records"),
    }
