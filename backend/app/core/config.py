import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "GeoVision AI"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    
    # Storage Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    PROCESSED_DIR: str = os.path.join(BASE_DIR, "data", "processed")
    SAMPLE_DATA_DIR: str = os.path.join(BASE_DIR, "data", "sample_datasets")
    KNOWLEDGE_BASE_DIR: str = os.path.join(BASE_DIR, "data", "knowledge_base")
    VECTOR_STORE_PATH: str = os.path.join(BASE_DIR, "data", "vector_store")
    
    # Gemini / AI Config
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    EMBEDDING_MODEL: str = "models/text-embedding-004"
    
    # Database Config
    POSTGRES_USER: str = "geovision_user"
    POSTGRES_PASSWORD: str = "geovision_password"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "geovision_db"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.PROCESSED_DIR, exist_ok=True)
os.makedirs(settings.SAMPLE_DATA_DIR, exist_ok=True)
os.makedirs(settings.KNOWLEDGE_BASE_DIR, exist_ok=True)
os.makedirs(settings.VECTOR_STORE_PATH, exist_ok=True)
