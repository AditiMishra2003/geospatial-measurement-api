# 🌍 Geospatial File Measurement API

A full-stack application with a **FastAPI backend** and **React frontend** that accepts Shapefile (`.zip`) or KML (`.kml`) uploads, extracts geospatial features, reprojects geometries to UTM for accurate metric measurements, and displays results in a clean interactive UI.

---

## 🔗 Live Demo

| | URL |
|---|---|
| **Frontend (React)** | https://geospatial-measurement-api-sable.vercel.app |
| **API Base URL** | https://geospatial-measurement-api-bzxy.onrender.com |
| **Swagger UI** | https://geospatial-measurement-api-bzxy.onrender.com/docs |
| **Health Check** | https://geospatial-measurement-api-bzxy.onrender.com/health |
| **GitHub — Backend** | https://github.com/AditiMishra2003/geospatial-measurement-api |
| **GitHub — Frontend** | https://github.com/AditiMishra2003/geospatial-frontend |

> **Free tier:** Render spins down after 15 min of inactivity — first request may take ~30–60s to wake up.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Setup — Run Locally](#setup--run-locally)
   - [Backend (FastAPI)](#backend-fastapi)
   - [Frontend (React)](#frontend-react)
5. [Deploy on Render (Backend — Free)](#deploy-on-render-backend--free)
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
9. [Testing with Postman](#testing-with-postman)
10. [Future Scope](#future-scope)

---

## Overview

This service solves the problem of measuring geospatial features without direct lat/lon arithmetic. It:

- Accepts `.zip` (Shapefile) and `.kml` file uploads via REST API or the React UI
- Parses all features and extracts geometry, CRS, and properties
- Reprojects geographic coordinates (e.g. EPSG:4326) to an appropriate UTM zone before calculating measurements
- Returns area (m²) for polygons and length (m) for linestrings
- Stores results in SQLite and exposes them via REST endpoints
- Displays results in a searchable, filterable React table

---

## Tech Stack

### Backend
| Layer | Library | Version |
|---|---|---|
| Web framework | FastAPI | 0.111.0 |
| ASGI server | Uvicorn | 0.29.0 |
| Database ORM | SQLAlchemy (SQLite) | 2.0.30 |
| Geospatial parsing | GeoPandas + Fiona | 1.0.1 + 1.10.1 |
| Geometry operations | Shapely | 2.0.6 |
| CRS reprojection | pyproj | 3.6.1 |
| Data validation | Pydantic v2 | 2.7.1 |
| Fast geo I/O | pyogrio | 0.10.0 |

### Frontend
| Layer | Library | Version |
|---|---|---|
| UI framework | React | 18.3.1 |
| Build tool | Vite | 5.4.1 |
| HTTP client | fetch API | built-in |
| Styling | Inline CSS (no framework) | — |

---

## Project Structure

```
Geospatial files/
│
├── geospatial_api/              ← FastAPI backend
│   ├── app/
│   │   ├── main.py              # App entrypoint, CORS, router registration
│   │   ├── config.py            # Settings (upload dir, DB URL)
│   │   ├── database.py          # SQLAlchemy engine + session factory
│   │   ├── models.py            # ORM models: GeoFile, Feature
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── dependencies.py      # get_db() session injection
│   │   ├── routers/
│   │   │   └── files.py         # 3 HTTP endpoints
│   │   └── services/
│   │       ├── file_processor.py
│   │       ├── measurements.py
│   │       └── parsers/
│   │           ├── shapefile.py
│   │           └── kml.py
│   ├── requirements.txt
│   ├── render.yaml
│   └── README.md
│
├── geospatial-frontend/         ← React frontend
│   ├── src/
│   │   ├── App.jsx              # Root component, view routing
│   │   ├── main.jsx             # React entry point
│   │   ├── index.css            # Global styles
│   │   ├── components/
│   │   │   └── Header.jsx       # Top nav with links
│   │   └── pages/
│   │       ├── UploadPage.jsx   # Drag & drop upload UI
│   │       └── ResultsPage.jsx  # Feature table with search & filter
│   ├── vite.config.js
│   └── package.json
│
└── test_files/
    └── sample_test.kml          ← Sample KML for testing
```

---

## Setup — Run Locally

### Backend (FastAPI)

**Prerequisites:** Python 3.10+

```bash
# Clone the repository
git clone https://github.com/AditiMishra2003/geospatial-measurement-api.git
cd geospatial-measurement-api/geospatial_api

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --port 8000
```

API running at:
- **Base URL:** http://localhost:8000
- **Swagger UI:** http://localhost:8000/docs
- **Health check:** http://localhost:8000/health

> SQLite database and `uploads/` directory are created automatically on first run.

---

### Frontend (React)

**Prerequisites:** Node.js 18+

```bash
cd geospatial-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend running at **http://localhost:5173** — proxies API calls to `http://localhost:8000`.

To build for production:
```bash
npm run build   # outputs to dist/
```

---

## Deploy on Render (Backend — Free)

This project is configured for Render's **completely free tier** — no credit card, no paid disk.

> Uploaded files go to `/tmp` during processing. Since all features and measurements are saved in SQLite immediately, the raw file is not needed after processing.

### Configuration

| Setting | Value |
|---|---|
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free |
| **Environment Variable** | `RENDER=true` |

### Free tier details
| | |
|---|---|
| Cost | **$0/month** |
| RAM | 512 MB |
| Cold start | ~30–60s after 15 min inactivity |
| Auto-deploy | Yes — on every `git push origin main` |

---

## API Documentation

### POST /api/files/

Upload a geospatial file. Returns **202 Accepted** immediately — processing happens in the background.
Poll `GET /api/files/{id}/` until `status` is `COMPLETED` or `FAILED`, then fetch results.

**Request**
| Property | Value |
|---|---|
| Method | `POST` |
| Content-Type | `multipart/form-data` |
| Field name | `file` |
| Accepted types | `.zip` (Shapefile), `.kml` |

```bash
curl -X POST https://geospatial-measurement-api-bzxy.onrender.com/api/files/ \
  -F "file=@survey.kml"
```

**Response — 202 Accepted** *(returned immediately, before processing)*
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "filename": "survey.kml",
  "feature_count": null,
  "crs": null,
  "status": "PENDING",
  "error_message": null,
  "created_at": "2024-06-01T10:30:00.000000"
}
```

**Recommended polling flow**
```
POST /api/files/              → 202  { status: "PENDING",     id: "abc-123" }
GET  /api/files/abc-123/      → 200  { status: "PROCESSING" }   (check again)
GET  /api/files/abc-123/      → 200  { status: "COMPLETED",  feature_count: 42 }
GET  /api/files/abc-123/measurements/  → 200  [ all features ]
```

**Status values**
| Status | Meaning |
|---|---|
| `PENDING` | File saved, queued for processing |
| `PROCESSING` | Parsing and measurement in progress |
| `COMPLETED` | All features processed successfully |
| `FAILED` | Processing error — see `error_message` |

---

### GET /api/files/{id}/

Retrieve file metadata.

```bash
curl https://geospatial-measurement-api-bzxy.onrender.com/api/files/3fa85f64-.../
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

---

### GET /api/files/{id}/measurements/

Retrieve all features and computed measurements.

```bash
curl https://geospatial-measurement-api-bzxy.onrender.com/api/files/3fa85f64-.../measurements/
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
      "geometry": { "type": "Polygon", "coordinates": [[...]] },
      "crs": "EPSG:4326",
      "properties": { "name": "Survey Region A" },
      "measurements": { "area_m2": 123456789.12, "length_m": null, "unsupported": null }
    },
    {
      "feature_id": 1,
      "geometry_type": "LineString",
      "geometry": { "type": "LineString", "coordinates": [[...]] },
      "crs": "EPSG:4326",
      "properties": { "name": "Main Road" },
      "measurements": { "area_m2": null, "length_m": 8732.45, "unsupported": null }
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
app/
├── main.py              # FastAPI app, middleware, router registration
├── config.py            # Settings (paths, DB URL, Render detection)
├── database.py          # SQLAlchemy engine + session factory
├── models.py            # ORM: GeoFile, Feature
├── schemas.py           # Pydantic request/response models
├── dependencies.py      # DB session DI via get_db()
├── routers/
│   └── files.py         # HTTP endpoints (upload, info, measurements)
└── services/
    ├── file_processor.py     # Orchestration layer
    ├── measurements.py       # CRS reprojection + area/length
    └── parsers/
        ├── shapefile.py      # ZIP → GeoPandas
        └── kml.py            # KML → GeoPandas
```

**Layer responsibilities:**
- **Routers** — HTTP only: validate input, call services, return responses
- **Services** — business logic: file I/O, parsing, measurement orchestration
- **Parsers** — format-specific parsing, normalise to a common feature dict
- **Models/Schemas** — ORM models for persistence, Pydantic for API I/O

---

### File Processing Flow

```
POST /api/files/
    │
    ├─► Validate extension (.zip / .kml) → 400 if invalid
    ├─► Save file to uploads/<uuid>.<ext>
    ├─► INSERT GeoFile row (status = PENDING)
    ├─► Queue background task (process_geo_file)
    └─► Return 202 Accepted immediately ← client gets response here

    [Background — after response is sent]
    └─► process_geo_file()
            ├─► status → PROCESSING
            ├─► _parse_file()
            │       ├─► .zip → unzip → GeoPandas.read_file(.shp)
            │       └─► .kml → GeoPandas.read_file(.kml)
            ├─► For each feature: calculate_measurements()
            ├─► Bulk INSERT Feature rows
            └─► status → COMPLETED (or FAILED on exception)

Poll GET /api/files/{id}/ until status = COMPLETED
Then GET /api/files/{id}/measurements/ for results
```

---

### Measurement Calculation Flow

```
calculate_measurements(geom_geojson, crs_str)
    │
    ├─► Point/MultiPoint   → {} (no measurement)
    ├─► Polygon/MultiPolygon
    │       ├─► Normalize to WGS-84
    │       ├─► Centroid → derive UTM zone
    │       ├─► Reproject to UTM via pyproj
    │       └─► return {"area_m2": geom.area}
    ├─► LineString/MultiLineString
    │       └─► same flow → {"length_m": geom.length}
    ├─► GeometryCollection → aggregate sub-geometries
    └─► Others → {"unsupported": True}
```

---

### CRS Handling

**Problem:** EPSG:4326 coordinates are in degrees. Area/length calculated in degrees is meaningless — 1° longitude ≈ 111 km at the equator but shrinks near the poles.

**Strategy: Dynamic UTM projection**

1. **Detect CRS** — read from file metadata (`.prj` for Shapefiles; EPSG:4326 hardcoded for KML)
2. **Normalize to WGS-84** — if source CRS is not EPSG:4326, reproject first
3. **Derive UTM zone** from centroid:
   ```
   zone = floor((longitude + 180) / 6) + 1
   EPSG = 32600 + zone  (Northern hemisphere, lat ≥ 0)
   EPSG = 32700 + zone  (Southern hemisphere, lat < 0)
   ```
4. **Reproject to UTM** via `pyproj.Transformer` + `shapely.ops.transform`
5. **Calculate** — Shapely `.area` (m²) or `.length` (m) on projected geometry

**Why UTM?** Minimises distortion within each 6° zone, results directly in metres, works worldwide without manual CRS selection.

---

## Design Decisions

| Decision | Choice | Rationale | Alternatives Considered |
|---|---|---|---|
| **Framework** | FastAPI | Auto OpenAPI docs, type-safe, minimal boilerplate | Django+DRF — heavier, better for full-stack apps |
| **Database** | SQLite via SQLAlchemy | Zero-config, sufficient for single-instance | PostgreSQL+PostGIS — better for production scale |
| **Geospatial library** | GeoPandas + Shapely | High-level API, ships GDAL wheels on Windows | Fiona directly — more control but more code |
| **Projection strategy** | Dynamic UTM from centroid | Accurate worldwide, results in metres | EPSG:3857 Web Mercator — distorts area significantly |
| **Processing mode** | Async background (BackgroundTasks) | Returns 202 immediately; client polls status; no external dependencies | Celery + Redis — warranted for distributed workers; Synchronous — simpler but blocks request |
| **Geometry storage** | GeoJSON string in SQLite | No PostGIS, directly serialisable to JSON | WKB binary — more compact but harder to debug |
| **Frontend styling** | Inline CSS | Zero dependencies, full control, fast build | Tailwind / MUI — adds bundle weight |

---

## Testing with Postman

A ready-to-import Postman collection is included: `geospatial_api_postman_collection.json`

Contains **7 requests** with test scripts that automatically save `file_id` after upload.

### Import
1. Open Postman Desktop
2. Click **Import** → drag and drop `geospatial_api_postman_collection.json`
3. Collection variable `base_url` is pre-set to `http://localhost:8000`

### Requests
| # | Request | Method | What it tests |
|---|---|---|---|
| 1 | Health Check | GET | Server is running |
| 2 | Upload KML File | POST | Upload `.kml`, auto-saves `file_id`; expect **202** |
| 3 | Upload Shapefile (ZIP) | POST | Upload `.zip` shapefile; expect **202** |
| 4 | Get File Info | GET | File metadata using `{{file_id}}` |
| 5 | Get Measurements | GET | All feature measurements |
| 6 | Upload - Invalid File Type | POST | Expect 400 error |
| 7 | Get File Info - Not Found | GET | Expect 404 error |

### Sample Test File
```
test_files/sample_test.kml
```
7 features: 2 Polygons, 2 LineStrings, 3 Points — covers all measurement types.

---

## Future Scope

These are planned improvements and extensions for future versions of this project:

### 🗄️ Database
- **PostgreSQL + PostGIS** — replace SQLite with PostgreSQL for concurrent writes, proper spatial indexing, and native geometry column types (`ST_Area`, `ST_Length`)
- **Database migrations** — add Alembic for schema versioning and safe production migrations

### ⚡ Performance & Scalability
- **Celery + Redis workers** — replace FastAPI BackgroundTasks with distributed Celery workers for high-concurrency or multi-instance deployments
- **Large file support** — stream-parse large Shapefiles instead of loading into memory; add chunked feature batch inserts
- **Caching** — cache measurement results with Redis so repeated requests for the same file ID are served instantly
- **Pagination** — add `?page=` and `?page_size=` query params to `GET /api/files/{id}/measurements/` for files with thousands of features

### 🌍 Geospatial Features
- **GeoJSON upload support** — accept `.geojson` and `.json` files in addition to Shapefile and KML
- **GPX support** — parse GPS track files (routes, waypoints)
- **Perimeter calculation** — add perimeter (m) alongside area for Polygon features
- **Centroid export** — return the centroid coordinates for each geometry
- **Bounding box** — include the bounding box of each feature in the response
- **Spatial queries** — filter features by bounding box or proximity via PostGIS

### 🔐 Security & Auth
- **JWT authentication** — protect upload and retrieval endpoints with token-based auth
- **Rate limiting** — prevent abuse with per-IP request rate limits (e.g. `slowapi`)
- **File size validation** — enforce max file size server-side before processing begins
- **Virus scanning** — scan uploaded files before processing

### ☁️ Infrastructure
- **S3 / cloud storage** — store uploaded files on AWS S3 or GCS instead of local `/tmp`
- **Docker** — containerise the application for consistent local and production environments
- **CI/CD pipeline** — add GitHub Actions to run tests and auto-deploy on push
- **Environment-based config** — separate dev/staging/production settings

### 🖥️ Frontend
- **Map visualisation** — render features on an interactive map using Leaflet or Mapbox GL JS
- **Download results** — export measurements as CSV or GeoJSON
- **Upload history** — list all previously uploaded files with their status
- **Dark/light theme toggle** — user preference persistence
- **Drag-to-reorder columns** — interactive table customisation
- **Bulk upload** — upload and process multiple files in one request
