from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import io, csv
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics import renderPDF
from app.services.github_client import get_repo, get_commits, get_contributors, get_languages, parse_owner_repo
from app.analyzers.commit_analyzer import analyze_commits
from app.analyzers.health_scorer import compute_health_score
from app.analyzers.contributor_analyzer import analyze_contributors
from app.analyzers.pattern_analyzer import analyze_patterns
from datetime import datetime

router = APIRouter()

@router.get("/csv")
async def export_csv(repo_url: str):
    try:
        owner, repo = parse_owner_repo(repo_url)
        raw = await get_commits(owner, repo)
        stats = analyze_commits(raw)
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=["week", "commits"])
        writer.writeheader()
        for row in stats.get("weekly_commits", []):
            writer.writerow(row)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={owner}_{repo}_commits.csv"},
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/pdf")
async def export_pdf(repo_url: str):
    try:
        owner, repo = parse_owner_repo(repo_url)
        repo_data  = await get_repo(owner, repo)
        commits    = await get_commits(owner, repo)
        contribs   = await get_contributors(owner, repo)
        languages  = await get_languages(owner, repo)
        commit_stats  = analyze_commits(commits)
        health        = compute_health_score(repo_data, commits, contribs)
        contrib_stats = analyze_contributors(contribs)
        patterns      = analyze_patterns(commits)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    BLUE  = colors.HexColor("#3b82f6")
    DARK  = colors.HexColor("#0f172a")
    MUTED = colors.HexColor("#64748b")
    GREEN = colors.HexColor("#10b981")
    AMBER = colors.HexColor("#f59e0b")
    RED   = colors.HexColor("#ef4444")

    h1 = ParagraphStyle("h1", fontSize=22, textColor=DARK, spaceAfter=4, fontName="Helvetica-Bold")
    h2 = ParagraphStyle("h2", fontSize=14, textColor=BLUE, spaceBefore=14, spaceAfter=6, fontName="Helvetica-Bold")
    body = ParagraphStyle("body", fontSize=10, textColor=MUTED, spaceAfter=4)
    label_s = ParagraphStyle("label", fontSize=9, textColor=MUTED)

    story = []

    # ── Header ─────────────────────────────────────────────────────────────
    story.append(Paragraph(f"GitHub Activity Report", h1))
    story.append(Paragraph(f"<b>{repo_data.get('full_name')}</b>", ParagraphStyle("sub", fontSize=13, textColor=MUTED, spaceAfter=2)))
    story.append(Paragraph(f"Generated {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC", label_s))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceAfter=10))

    # ── Summary cards (table of 4) ──────────────────────────────────────────
    story.append(Paragraph("Summary", h2))
    score_color = GREEN if health['total'] >= 80 else AMBER if health['total'] >= 60 else RED
    summary_data = [
        ["Stars", "Forks", "Open Issues", "Health Score"],
        [
            str(repo_data.get("stargazers_count", 0)),
            str(repo_data.get("forks_count", 0)),
            str(repo_data.get("open_issues_count", 0)),
            f"{health['total']}/100  {health['label']}",
        ],
    ]
    t = Table(summary_data, colWidths=[4*cm]*4)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#f8fafc")),
        ("TEXTCOLOR",  (0,0), (-1,0), MUTED),
        ("FONTNAME",   (0,0), (-1,0), "Helvetica"),
        ("FONTSIZE",   (0,0), (-1,0), 9),
        ("FONTNAME",   (0,1), (-1,1), "Helvetica-Bold"),
        ("FONTSIZE",   (0,1), (-1,1), 14),
        ("TEXTCOLOR",  (3,1), (3,1), score_color),
        ("ALIGN",      (0,0), (-1,-1), "CENTER"),
        ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0,1), (-1,1), [colors.white]),
        ("BOX",        (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ("INNERGRID",  (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING",  (0,0), (-1,-1), 10),
        ("BOTTOMPADDING",(0,0), (-1,-1), 10),
    ]))
    story.append(t)

    # ── Health Breakdown ────────────────────────────────────────────────────
    story.append(Paragraph("Health Score Breakdown", h2))
    hrows = [["Factor", "Score", "Max"]]
    for k, v in health["breakdown"].items():
        hrows.append([k.replace("_", " ").title(), str(v["score"]), str(v["max"])])
    ht = Table(hrows, colWidths=[9*cm, 3*cm, 3*cm])
    ht.setStyle(TableStyle([
        ("BACKGROUND",  (0,0),(-1,0), colors.HexColor("#f8fafc")),
        ("FONTNAME",    (0,0),(-1,0), "Helvetica-Bold"),
        ("FONTSIZE",    (0,0),(-1,-1), 9),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ("BOX",         (0,0),(-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ("INNERGRID",   (0,0),(-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING",  (0,0),(-1,-1), 6),
        ("BOTTOMPADDING",(0,0),(-1,-1), 6),
    ]))
    story.append(ht)

    # ── Commit Stats ─────────────────────────────────────────────────────
    story.append(Paragraph("Commit Statistics", h2))
    cs = commit_stats
    story.append(Paragraph(
        f"Total commits: <b>{cs.get('total_commits',0)}</b>  |  "
        f"Top author: <b>{cs.get('top_author','N/A')}</b>  |  "
        f"Most active day: <b>{cs.get('most_active_day','N/A')}</b>  |  "
        f"Peak hour: <b>{cs.get('most_active_hour','N/A')}:00</b>",
        ParagraphStyle("cs", fontSize=10, textColor=DARK, spaceAfter=8)
    ))

    # Bar chart of weekly commits (last 20 weeks)
    weekly = cs.get("weekly_commits", [])[-20:]
    if weekly:
        d = Drawing(460, 140)
        bc = VerticalBarChart()
        bc.x, bc.y, bc.height, bc.width = 40, 10, 110, 400
        bc.data = [[w["commits"] for w in weekly]]
        bc.bars[0].fillColor = BLUE
        bc.categoryAxis.categoryNames = [w["week"][-5:] for w in weekly]
        bc.categoryAxis.labels.angle = 45
        bc.categoryAxis.labels.fontSize = 6
        bc.categoryAxis.labels.dy = -10
        bc.valueAxis.labels.fontSize = 7
        bc.groupSpacing = 2
        d.add(bc)
        story.append(d)
        story.append(Spacer(1, 6))

    # ── Contributors ───────────────────────────────────────────────────────
    story.append(Paragraph("Top Contributors", h2))
    lb = contrib_stats.get("leaderboard", [])[:10]
    if lb:
        crow = [["Rank", "Username", "Commits", "Share %"]]
        for c in lb:
            crow.append([f"#{c['rank']}", c["login"], str(c["contributions"]), f"{c['percentage']}%"])
        ct = Table(crow, colWidths=[2*cm, 6*cm, 4*cm, 4*cm])
        ct.setStyle(TableStyle([
            ("BACKGROUND",  (0,0),(-1,0), colors.HexColor("#f8fafc")),
            ("FONTNAME",    (0,0),(-1,0), "Helvetica-Bold"),
            ("FONTSIZE",    (0,0),(-1,-1), 9),
            ("ROWBACKGROUNDS",(0,1),(-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
            ("BOX",         (0,0),(-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ("INNERGRID",   (0,0),(-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING",  (0,0),(-1,-1), 6),
            ("BOTTOMPADDING",(0,0),(-1,-1), 6),
        ]))
        story.append(ct)

    # ── Patterns ────────────────────────────────────────────────────────────
    if patterns:
        story.append(Paragraph("Activity Patterns", h2))
        story.append(Paragraph(
            f"Peak time: <b>{patterns.get('peak_time','N/A')}</b>  |  "
            f"Avg commit hour: <b>{patterns.get('avg_commit_hour','N/A')}:00</b>  |  "
            f"Weekend ratio: <b>{patterns.get('weekend_ratio','N/A')}%</b>",
            ParagraphStyle("pat", fontSize=10, textColor=DARK, spaceAfter=4)
        ))

    # ── Languages ───────────────────────────────────────────────────────────
    if languages:
        story.append(Paragraph("Language Breakdown", h2))
        total_b = sum(languages.values())
        lang_rows = [["Language", "Percentage"]]
        for lang, b in sorted(languages.items(), key=lambda x: -x[1])[:8]:
            lang_rows.append([lang, f"{round(b/total_b*100,1)}%"])
        lt = Table(lang_rows, colWidths=[9*cm, 7*cm])
        lt.setStyle(TableStyle([
            ("BACKGROUND",  (0,0),(-1,0), colors.HexColor("#f8fafc")),
            ("FONTNAME",    (0,0),(-1,0), "Helvetica-Bold"),
            ("FONTSIZE",    (0,0),(-1,-1), 9),
            ("ROWBACKGROUNDS",(0,1),(-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
            ("BOX",         (0,0),(-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ("INNERGRID",   (0,0),(-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING",  (0,0),(-1,-1), 6),
            ("BOTTOMPADDING",(0,0),(-1,-1), 6),
        ]))
        story.append(lt)

    doc.build(story)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={owner}_{repo}_report.pdf"},
    )
