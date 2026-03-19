from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import repos, commits, health, export, compare, user, churn
from app.db.database import init_db
from app.services import github_client

app = FastAPI(
    title="GitHub Activity Analyzer",
    description="Analyze GitHub repos and users",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()
    github_client.get_client()

@app.on_event("shutdown")
async def shutdown():
    if github_client._client and not github_client._client.is_closed:
        await github_client._client.aclose()

app.include_router(repos.router,    prefix="/api/repos",    tags=["repos"])
app.include_router(commits.router,  prefix="/api/commits",  tags=["commits"])
app.include_router(health.router,   prefix="/api/health",   tags=["health"])
app.include_router(export.router,   prefix="/api/export",   tags=["export"])
app.include_router(compare.router,  prefix="/api/compare",  tags=["compare"])
app.include_router(user.router,     prefix="/api/user",     tags=["user"])
app.include_router(churn.router,    prefix="/api/churn",    tags=["churn"])

@app.get("/")
def root():
    return {"message": "GitHub Activity Analyzer API", "docs": "/docs"}

@app.get("/api/rate-limit")
async def rate_limit_status():
    from app.services.github_client import _get
    data = await _get("https://api.github.com/rate_limit")
    core = data["resources"]["core"]
    return {
        "remaining": core["remaining"],
        "limit": core["limit"],
        "reset_unix": core["reset"],
        "used": core["used"],
    }
    
