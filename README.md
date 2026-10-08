# Geospatial File Measurement API

A FastAPI backend service that accepts Shapefile (`.zip`) or KML (`.kml`) uploads, extracts geospatial features, reprojects geometries to UTM for accurate metric measurements, and exposes a clean REST API.

---

## Live Demo

The API is deployed on Render:

| | |
|---|---|
| **Base URL** | https://geospatial-measurement-api-bzxy.onrender.com |
| **Swagger UI** | https://geospatial-measurement-api-bzxy.onrender.com/docs |
| **Health Check** | https://geospatial-measurement-api-bzxy.onrender.com/health |

> **Free tier:** No credit card required. Spins down after 15 min of inactivity — first request after that takes ~30–60s to wake up.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Live Demo](#live-demo)
4. [Setup — Run Locally](#setup--run-locally)
5. [Deploy on Render](#deploy-on-render)
6. [API Documentation](#api-documentation)
   - [POST /api/files/](#post-apifiles)
   - [GET /api/files/{id}/](#get-apifilesid)
   - [GET /api/files/{id}/measurements/](#get-apifilesidmeasurements)
7. [Architecture](#architecture)
   - [Application Structure](#application-structure)
   - [File Processing Flow](#file-processing-flow)
   - [Measurement Calculation Flow](#measurement-calculation-flow)
   - [CRS Handling](#crs-handling)
8. [Design Decisions](#design-decisions)
7. [Testing with Postman](#testing-with-postman)

---

## Overview

This service solves the problem of measuring geospatial features without direct lat/lon arithmetic. It:

- Accepts `.zip` (Shapefile) and `.kml` file uploads
- Parses all features and extracts geometry, CRS, and properties
- Reprojects geographic coordinates (e.g. EPSG:4326) to an appropriate UTM zone before calculating measurements
- Returns area (m²) for polygons and length (m) for linestrings
- Stores results in SQLite and exposes them via REST endpoints

---

## Tech Stack

| Layer | Library |
|---|---|
| Web framework | FastAPI 0.111 |
| ASGI server | Uvicorn |
| Database ORM | SQLAlchemy 2.0 (SQLite) |
| Geospatial parsing | GeoPandas 1.1 + Fiona 1.10 |
| Geometry operations | Shapely 2.0 |
| CRS reprojection | pyproj 3.6 |
| Data validation | Pydantic v2 |

---

## Setup — Run Locally

### Prerequisites

- Python 3.10 or higher
- pip
- Windows users: no manual GDAL install needed — GeoPandas ships its own GDAL wheels

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/geospatial-measurement-api.git
cd geospatial-measurement-api/geospatial_api

# 2. Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the server
uvicorn app.main:app --reload --port 8000
```

The API is now running at:
- **Base URL:** http://localhost:8000
- **Swagger UI (interactive docs):** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Health check:** http://localhost:8000/health

> The SQLite database (`geospatial.db`) and `uploads/` directory are created automatically on first run.

---

## Deploy on Render (100% Free)

This project is configured for Render's **completely free tier** — no credit card, no paid disk.

> Uploaded files are stored in `/tmp` during processing. Since all parsed features and measurements are saved in SQLite immediately after upload, the raw file is no longer needed after processing.

### Step 1 — Sign up on Render
- Go to **https://render.com**
- Click **Get Started for Free**
- Sign up with your **GitHub account** (easiest — no manual linking needed)

### Step 2 — Create a New Web Service
1. Click **New +** → **Web Service**
2. Find and select the repo: **`AditiMishra2003/geospatial-measurement-api`**
3. Click **Connect**

### Step 3 — Configure the Service
Fill in exactly these settings:

| Setting | Value |
|---|---|
| **Name** | `geospatial-measurement-api` |
| **Region** | Singapore or Oregon (closest to you) |
| **Branch** | `main` |
| **Root Directory** | `geospatial_api` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | **Free** ✅ |

### Step 4 — Add Environment Variable
Scroll down to **Environment Variables** and add:

| Key | Value |
|---|---|
| `RENDER` | `true` |

### Step 5 — Deploy
- Click **Create Web Service**
- First build takes ~5–8 minutes (installing GeoPandas/GDAL)
- Watch the build logs — you'll see `Uvicorn running on...` when it's ready
- Your live URL will be: `https://geospatial-measurement-api.onrender.com`

### Step 6 — Test the live API
Once deployed, open in your browser:
```
https://geospatial-measurement-api.onrender.com/docs
```
Full Swagger UI — test all endpoints directly from the browser.

Or hit the health check:
```
https://geospatial-measurement-api.onrender.com/health
```

### Subsequent deploys
Every `git push origin main` triggers an **automatic redeploy** — no manual steps needed.

### Free tier notes
| | |
|---|---|
| Cost | **$0 — completely free** |
| RAM | 512 MB (sufficient for this workload) |
| Cold start | ~30–60s after 15 min of inactivity |
| Uploaded files | Stored in `/tmp` — cleared on restart (data already in DB) |
| Auto-deploy | Yes, on every push to `main` |

---

## API Documentation

### Base URL
```
http://localhost:8000
```

---

### POST /api/files/

Upload a geospatial file for processing.

**Request**

| Property | Value |
|---|---|
| Method | `POST` |
| Content-Type | `multipart/form-data` |
| Field name | `file` |
| Accepted types | `.zip` (Shapefile), `.kml` |

**curl example**
```bash
curl -X POST http://localhost:8000/api/files/ \
  -F "file=@/path/to/survey.kml"
```

**Shapefile example**
```bash
curl -X POST http://localhost:8000/api/files/ \
  -F "file=@/path/to/shapefile.zip"
```

**Response — 201 Created**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "filename": "survey.kml",
  "feature_count": 42,
  "crs": "EPSG:4326",
  "status": "COMPLETED",
  "error_message": null,
  "created_at": "2024-06-01T10:30:00.000000"
}
```

**Response — 400 Bad Request** (unsupported file type)
```json
{
  "detail": "Unsupported file type '.geojson'. Accepted: .zip, .kml"
}
```

**Status values**

| Status | Meaning |
|---|---|
| `PENDING` | File saved, processing not yet started |
| `PROCESSING` | Parsing and measurement in progress |
| `COMPLETED` | All features processed successfully |
| `FAILED` | Processing error — see `error_message` field |

---

### GET /api/files/{id}/

Retrieve metadata about a previously uploaded file.

**Request**

| Property | Value |
|---|---|
| Method | `GET` |
| URL param | `id` — UUID returned from POST |

**curl example**
```bash
curl http://localhost:8000/api/files/3fa85f64-5717-4562-b3fc-2c963f66afa6/
```

**Response — 200 OK**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "filename": "survey.kml",
  "feature_count": 42,
  "crs": "EPSG:4326",
  "status": "COMPLETED",
  "error_message": null,
  "created_at": "2024-06-01T10:30:00.000000"
}
```

**Response — 404 Not Found**
```json
{
  "detail": "File not found"
}
```

---

### GET /api/files/{id}/measurements/

Retrieve all features and their computed measurements.

**Request**

| Property | Value |
|---|---|
| Method | `GET` |
| URL param | `id` — UUID returned from POST |

**curl example**
```bash
curl http://localhost:8000/api/files/3fa85f64-5717-4562-b3fc-2c963f66afa6/measurements/
```

**Response — 200 OK**
```json
{
  "file_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "filename": "survey.kml",
  "total_features": 3,
  "features": [
    {
      "feature_id": 0,
      "geometry_type": "Polygon",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[77.5, 12.9], [77.6, 12.9], [77.6, 13.0], [77.5, 13.0], [77.5, 12.9]]]
      },
      "crs": "EPSG:4326",
      "properties": {
        "name": "Survey Region A",
        "category": "agricultural"
      },
      "measurements": {
        "area_m2": 123456789.12,
        "length_m": null,
        "unsupported": null
      }
    },
    {
      "feature_id": 1,
      "geometry_type": "LineString",
      "geometry": {
        "type": "LineString",
        "coordinates": [[77.5, 12.9], [77.55, 12.95], [77.6, 13.0]]
      },
      "crs": "EPSG:4326",
      "properties": {
        "name": "Main Road",
        "highway": "primary"
      },
      "measurements": {
        "area_m2": null,
        "length_m": 8732.45,
        "unsupported": null
      }
    },
    {
      "feature_id": 2,
      "geometry_type": "Point",
      "geometry": {
        "type": "Point",
        "coordinates": [77.59, 12.97]
      },
      "crs": "EPSG:4326",
      "properties": {
        "name": "Survey Marker 1"
      },
      "measurements": {
        "area_m2": null,
        "length_m": null,
        "unsupported": null
      }
    }
  ]
}
```

**Measurement rules**

| Geometry Type | Measurement |
|---|---|
| `Polygon`, `MultiPolygon` | `area_m2` — area in square metres |
| `LineString`, `MultiLineString` | `length_m` — length in metres |
| `Point`, `MultiPoint` | No measurement — all fields `null` |
| `GeometryCollection` | Aggregated area/length of sub-geometries |
| All others | `unsupported: true` |

---

## Architecture

### Application Structure

```
geospatial_api/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entrypoint, CORS, router registration
│   ├── config.py            # Settings via pydantic-settings (upload dir, DB URL)
│   ├── database.py          # SQLAlchemy engine, SessionLocal, Base, create_tables()
│   ├── models.py            # ORM models: GeoFile, Feature
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── dependencies.py      # get_db() dependency for DB session injection
│   ├── routers/
│   │   ├── __init__.py
│   │   └── files.py         # All three HTTP endpoints
│   └── services/
│       ├── __init__.py
│       ├── file_processor.py     # Orchestration: parse → measure → persist
│       ├── measurements.py       # CRS reprojection + area/length calculation
│       └── parsers/
│           ├── __init__.py
│           ├── shapefile.py      # Unzip + GeoPandas.read_file() for .shp
│           └── kml.py            # GeoPandas.read_file() for .kml
├── uploads/                 # Uploaded files stored here (git-ignored)
├── geospatial.db            # SQLite database (auto-created)
├── requirements.txt
├── .gitignore
└── README.md
```

**Layer responsibilities:**
- **Routers** — HTTP only: validate input, call services, return responses
- **Services** — business logic: file I/O, parsing, measurement orchestration
- **Parsers** — format-specific parsing, normalise to a common feature dict structure
- **Models/Schemas** — data shape: ORM models for persistence, Pydantic schemas for API I/O

---

### File Processing Flow

```
Client
  │
  │  POST /api/files/  (multipart file)
  ▼
routers/files.py
  ├─► Validate file extension (.zip or .kml) → 400 if invalid
  ├─► Save file to uploads/<uuid>.<ext>
  ├─► INSERT GeoFile row  (status = PENDING)
  └─► Call process_geo_file(db, file_id, filepath, filename)
          │
          ├─► UPDATE status = PROCESSING
          │
          ├─► _parse_file(filepath, filename)
          │       ├─► .zip  → parsers/shapefile.py
          │       │         unzip to temp dir
          │       │         locate .shp file
          │       │         gdf = GeoPandas.read_file(.shp)
          │       │         extract CRS → normalise to "EPSG:XXXX"
          │       │         iterate rows → feature dicts
          │       │
          │       └─► .kml  → parsers/kml.py
          │                 gdf = GeoPandas.read_file(.kml)
          │                 CRS always EPSG:4326
          │                 iterate rows → feature dicts
          │
          │   Each feature dict:
          │   { feature_index, geometry_type, geometry (GeoJSON), crs, properties }
          │
          ├─► For each feature dict:
          │       calculate_measurements(geometry, crs) → { area_m2 | length_m | {} }
          │
          ├─► Bulk INSERT Feature rows
          ├─► UPDATE GeoFile: feature_count, crs, status = COMPLETED
          │
          └─► On any exception:
                UPDATE status = FAILED, error_message = str(exc)

  ◄── Return GeoFileResponse (201)
```

---

### Measurement Calculation Flow

```
calculate_measurements(geom_geojson: dict, crs_str: str)
  │
  ├─► geom = shapely.shape(geom_geojson)
  │
  ├─► geom_type == "Point" or "MultiPoint"
  │       └─► return {}   (no measurement required)
  │
  ├─► geom_type == "Polygon" or "MultiPolygon"
  │       └─► _reproject_geometry(geom, crs_str)
  │               ├─► if src_crs ≠ EPSG:4326:
  │               │       transform to WGS-84 via pyproj.Transformer
  │               ├─► centroid.x, centroid.y → UTM zone number
  │               │       zone = floor((lon + 180) / 6) + 1
  │               │       lat ≥ 0 → EPSG:326XX  (Northern hemisphere)
  │               │       lat < 0 → EPSG:327XX  (Southern hemisphere)
  │               └─► transform to UTM via pyproj.Transformer
  │                       return projected_geom, target_epsg
  │           └─► return {"area_m2": round(projected.area, 4)}
  │
  ├─► geom_type == "LineString" or "MultiLineString"
  │       └─► same reprojection flow
  │           └─► return {"length_m": round(projected.length, 4)}
  │
  ├─► geom_type == "GeometryCollection"
  │       └─► recurse over sub-geometries, aggregate area + length
  │           return combined result
  │
  └─► anything else
        └─► return {"unsupported": True}
```

---

### CRS Handling

**Problem:** Shapefile and KML files often use geographic coordinate systems (EPSG:4326) where coordinates are in degrees. Calculating area or length directly in degrees produces meaningless results.

**Strategy: Dynamic UTM projection**

1. **Detect CRS** — GeoPandas reads the CRS from the file's metadata (`.prj` for Shapefiles, hardcoded EPSG:4326 for KML). If absent, EPSG:4326 is assumed.

2. **Normalize to WGS-84** — If the source CRS is not EPSG:4326, the geometry is first reprojected to WGS-84 so the centroid can be computed in longitude/latitude degrees.

3. **Derive UTM zone** — The UTM zone is computed from the centroid:
   ```
   zone_number = floor((longitude + 180) / 6) + 1
   epsg = 32600 + zone  if latitude >= 0   (Northern hemisphere)
   epsg = 32700 + zone  if latitude <  0   (Southern hemisphere)
   ```

4. **Reproject to UTM** — The geometry is reprojected to the computed UTM CRS using `pyproj.Transformer` + `shapely.ops.transform`.

5. **Calculate** — Shapely computes `.area` (m²) or `.length` (m) on the projected geometry. Results are in SI metric units.

**Why UTM?** UTM projections minimise distortion within each 6° zone and produce results in metres, making them ideal for local/regional measurements. The dynamic zone selection ensures accuracy regardless of where on Earth the data is located.

---

## Design Decisions

| Decision | Choice | Rationale | Alternatives Considered |
|---|---|---|---|
| **Framework** | FastAPI | Async-capable, auto-generates OpenAPI docs, minimal boilerplate | Django+DRF — heavier, better for full-stack apps |
| **Database** | SQLite via SQLAlchemy | Zero-config, file-based, sufficient for single-instance use | PostgreSQL+PostGIS — better for production scale |
| **Geospatial library** | GeoPandas + Shapely | High-level API, handles most formats, ships GDAL wheels on Windows | Fiona directly — more control but more code |
| **Projection strategy** | Dynamic UTM from centroid | Accurate for any location worldwide, results in metres | EPSG:3857 Web Mercator — distorts area significantly |
| **Processing mode** | Synchronous (in-request) | Simple, no external dependencies | Celery + Redis — warranted for large files or async jobs |
| **Geometry storage** | GeoJSON string in SQLite | No PostGIS required, easily serialisable to API response | WKB binary — more compact but harder to debug |
| **File storage** | Local `uploads/` directory | Simple for local/dev | S3/cloud storage — needed for production deployment |

---

## Testing with Postman

A ready-to-import Postman collection is included: `geospatial_api_postman_collection.json`

It contains **7 requests** with pre-written test scripts that automatically save the `file_id` variable after upload — no manual copy-pasting needed.

### Prerequisites
- Server running at `http://localhost:8000`
- [Postman Desktop App](https://www.postman.com/downloads/) (browser version requires the Desktop Agent for localhost)

### Import the Collection

1. Open Postman Desktop
2. Click **Import** (top left)
3. Drag and drop `geospatial_api_postman_collection.json` into the import window
4. Click **Import** — the collection **"Geospatial File Measurement API"** appears in your sidebar

The collection variable `base_url` is pre-set to `http://localhost:8000`. No environment setup needed.

### Requests in the Collection

| # | Request | Method | URL | What it tests |
|---|---|---|---|---|
| 1 | Health Check | GET | `/health` | Server is running |
| 2 | Upload KML File | POST | `/api/files/` | Upload a `.kml` file |
| 3 | Upload Shapefile (ZIP) | POST | `/api/files/` | Upload a `.zip` shapefile |
| 4 | Get File Info | GET | `/api/files/{{file_id}}/` | File metadata |
| 5 | Get Measurements | GET | `/api/files/{{file_id}}/measurements/` | Feature measurements |
| 6 | Upload - Invalid File Type | POST | `/api/files/` | Expect 400 error |
| 7 | Get File Info - Not Found | GET | `/api/files/nonexistent-id/` | Expect 404 error |

### Step-by-Step Test Flow

**Step 1 — Health Check**
- Click **Health Check** → Send
- Expected: `200 OK` → `{"status": "ok"}`

**Step 2 — Upload a KML file**
- Click **Upload KML File**
- Go to **Body** tab → **form-data**
- Click the type dropdown on the `file` key → change from `Text` to **`File`**
- Click **Select Files** → pick your `.kml` file
- Click **Send**
- Expected: `201 Created`
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "filename": "sample_test.kml",
  "feature_count": 7,
  "crs": "EPSG:4326",
  "status": "COMPLETED",
  "error_message": null,
  "created_at": "2026-10-07T10:45:34.633251"
}
```
> The test script automatically saves `id` as `{{file_id}}` for the next requests.

**Step 3 — Get File Info**
- Click **Get File Info** → Send
- `{{file_id}}` is filled automatically
- Expected: `200 OK` with the same file metadata

**Step 4 — Get Measurements**
- Click **Get Measurements** → Send
- Expected: `200 OK` with all features and measurements
```json
{
  "file_id": "3fa85f64-...",
  "filename": "sample_test.kml",
  "total_features": 7,
  "features": [
    {
      "feature_id": 0,
      "geometry_type": "Polygon",
      "crs": "EPSG:4326",
      "properties": {"name": "Survey Region A"},
      "measurements": { "area_m2": 123456789.12 }
    },
    {
      "feature_id": 2,
      "geometry_type": "LineString",
      "crs": "EPSG:4326",
      "properties": {"name": "Main Road"},
      "measurements": { "length_m": 21083.45 }
    },
    {
      "feature_id": 4,
      "geometry_type": "Point",
      "crs": "EPSG:4326",
      "properties": {"name": "Survey Marker 1"},
      "measurements": {}
    }
  ]
}
```

**Step 5 — Error handling tests**
- **Upload - Invalid File Type**: upload any non-.zip, non-.kml file → expect `400 Bad Request`
- **Get File Info - Not Found**: uses a fake ID → expect `404 Not Found`

### Sample Test File

A sample KML file with 7 features (2 Polygons, 2 LineStrings, 3 Points) is included for testing:

```
test_files/sample_test.kml
```

This file covers all geometry types and measurement scenarios:
- Polygons → returns `area_m2` after UTM reprojection
- LineStrings → returns `length_m` after UTM reprojection  
- Points → returns empty measurements `{}`
