from typing import List, Dict, Any

def analyze_contributors(contributors: List[Dict]) -> Dict[str, Any]:
    if not contributors:
        return {}
    total_contributions = sum(c.get("contributions", 0) for c in contributors)
    ranked = sorted(contributors, key=lambda x: x.get("contributions", 0), reverse=True)
    leaderboard = [
        {
            "rank": i + 1,
            "login": c.get("login"),
            "avatar_url": c.get("avatar_url"),
            "contributions": c.get("contributions", 0),
            "percentage": round(c.get("contributions", 0) / total_contributions * 100, 1) if total_contributions else 0,
        }
        for i, c in enumerate(ranked[:20])
    ]
    return {"total_contributors": len(contributors), "total_contributions": total_contributions, "leaderboard": leaderboard}
