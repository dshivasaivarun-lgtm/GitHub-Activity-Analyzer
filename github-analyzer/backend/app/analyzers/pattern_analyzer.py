from typing import List, Dict, Any
from datetime import datetime

def analyze_patterns(raw_commits: List[Dict]) -> Dict[str, Any]:
    """Detect work patterns: night owl vs early bird, weekday vs weekend, burst vs steady."""
    if not raw_commits:
        return {}

    hours, weekdays, weekends = [], 0, 0
    for c in raw_commits:
        date_str = c.get("commit", {}).get("author", {}).get("date", "")
        if not date_str:
            continue
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        hours.append(dt.hour)
        if dt.weekday() < 5:
            weekdays += 1
        else:
            weekends += 1

    if not hours:
        return {}

    avg_hour = sum(hours) / len(hours)
    total = weekdays + weekends
    patterns = {
        "avg_commit_hour": round(avg_hour, 1),
        "peak_time": "night owl (after 8pm)" if avg_hour >= 20 else
                     "evening coder (5-8pm)" if avg_hour >= 17 else
                     "afternoon dev (12-5pm)" if avg_hour >= 12 else
                     "morning dev (before noon)",
        "weekday_commits": weekdays,
        "weekend_commits": weekends,
        "weekend_ratio": round(weekends / total * 100, 1) if total else 0,
    }
    return patterns
