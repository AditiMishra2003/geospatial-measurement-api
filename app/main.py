from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_tables
from app.routers import files

app = FastAPI(
    title="Geospatial File Measurement API",
    description="Upload Shapefile or KML files and get geometry measurements.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

create_tables()

app.include_router(files.router)


@app.get("/", tags=["health"])
def root():
    return {"message": "Geospatial File Measurement API", "docs": "/docs"}


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
