from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GITHUB_TOKEN: str = ""
    DATABASE_URL: str = "sqlite:///./analyzer.db"
    CACHE_TTL_SECONDS: int = 3600  # 1 hour

    class Config:
        env_file = ".env"

settings = Settings()
