from pydantic_settings import BaseSettings
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# On Render, use the mounted disk path for uploads and DB persistence
# Locally, use the project root
RENDER_DISK_PATH = Path("/opt/render/project/src/uploads")
_is_render = os.getenv("RENDER") == "true"

class Settings(BaseSettings):
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/geospatial.db"
    UPLOAD_DIR: Path = RENDER_DISK_PATH if _is_render else BASE_DIR / "uploads"
    MAX_FILE_SIZE_MB: int = 100

    class Config:
        env_file = ".env"

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
