"""Parse a .zip file containing a Shapefile."""
import json
import tempfile
import zipfile
from pathlib import Path
from typing import List, Dict, Any


def parse_shapefile(zip_path: str) -> List[Dict[str, Any]]:
    """
    Extract the ZIP and read features from the .shp inside.
    Returns a list of feature dicts.
    """
    import geopandas as gpd

    with tempfile.TemporaryDirectory() as tmpdir:
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(tmpdir)

        shp_files = list(Path(tmpdir).rglob("*.shp"))
        if not shp_files:
            raise ValueError("No .shp file found inside the ZIP archive.")

        gdf = gpd.read_file(shp_files[0])

        if gdf.crs is not None:
            crs_str = gdf.crs.to_string()
            try:
                epsg = gdf.crs.to_epsg()
                if epsg:
                    crs_str = f"EPSG:{epsg}"
            except Exception:
                pass
        else:
            crs_str = "EPSG:4326"

        features = []
        for idx, row in gdf.iterrows():
            geom = row.geometry
            if geom is not None and not geom.is_empty:
                geom_geojson = json.loads(json.dumps(geom.__geo_interface__))
                geom_type = geom.geom_type
            else:
                geom_geojson = None
                geom_type = "Unknown"

            props = {k: v for k, v in row.items() if k != "geometry"}
            props = _serialise_props(props)

            features.append({
                "feature_index": int(idx),
                "geometry_type": geom_type,
                "geometry": geom_geojson,
                "crs": crs_str,
                "properties": props,
            })

    return features


def _serialise_props(props: dict) -> dict:
    out = {}
    for k, v in props.items():
        if hasattr(v, "item"):
            v = v.item()
        elif hasattr(v, "isoformat"):
            v = v.isoformat()
        try:
            if v != v:
                v = None
        except TypeError:
            pass
        out[k] = v
    return out
