from pydantic_settings import BaseSettings
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# On Render free tier, use /tmp for uploads (no paid disk needed)
# Files are only needed during processing — parsed data is stored in SQLite
_is_render = os.getenv("RENDER") == "true"

class Settings(BaseSettings):
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/geospatial.db"
    UPLOAD_DIR: Path = Path("/tmp/geospatial_uploads") if _is_render else BASE_DIR / "uploads"
    MAX_FILE_SIZE_MB: int = 100

    class Config:
        env_file = ".env"

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
