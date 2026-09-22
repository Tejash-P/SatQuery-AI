import re
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "SatQuery AI"
    API_V1_STR: str = "/api/v1"
    CORS_ORIGINS: str = "http://localhost:3000"
    CORS_ORIGIN_REGEX: str | None = r"https://.*\.vercel\.app"

    DATABASE_URL: str = "sqlite:///./satquery.db"
    REDIS_URL: str = "redis://localhost:6379/0"

    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadminpassword"
    MINIO_BUCKET_NAME: str = "satquery-storage"
    STORAGE_MODE: str = "local"
    STORAGE_PATH: str = "./storage"

    JWT_SECRET: str = "thisismysecretkeyforjwt"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    def cors_origins_list(self) -> List[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip() and "*" not in origin
        ]


settings = Settings()
