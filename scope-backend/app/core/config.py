from pydantic_settings import BaseSettings
from typing import Optional, Dict, Any, List
from pydantic import SecretStr


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "SCOPE"
    
    # CORS Settings
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Database settings
    DATABASE_URL: str = "sqlite:///./scope.db"
    
    # JWT Settings
    SECRET_KEY: str = "CHANGE_THIS_TO_A_PROPER_SECRET_IN_PRODUCTION"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Google Gemini API
    GOOGLE_API_KEY: Optional[SecretStr] = None
    
    # ML Model Settings
    MODEL_PATH: str = "model/model.pt"
    MODEL: str = 'roberta-base'
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
