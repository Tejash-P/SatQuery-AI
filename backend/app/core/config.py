from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "SatQuery AI"
    API_V1_STR: str = "/api/v1"
    CORS_ORIGINS: str = "http://localhost:3000"
    
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
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        extra = 'ignore'

settings = Settings()
