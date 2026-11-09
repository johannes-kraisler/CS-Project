"""Count City of Toronto community centres per neighbourhood and join them to
sense of belonging (Q3) by neighbourhood from the weighted Tables 3-6 workbooks.

Downloads (City of Toronto Open Data, Open Government Licence - Toronto):
  - Parks and Recreation Facilities (TYPE == "Community Centre")
  - Neighbourhoods (158-neighbourhood boundaries)

Writes src/lib/data/community-centres.json.

Usage: python scripts/extract_community_centres.py   (needs: pip install openpyxl)
"""
import csv
import io
import json
import re
import urllib.request
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"
OUT = ROOT / "src" / "lib" / "data" / "community-centres.json"

FACILITIES_URL = (
    "https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/cbea3a67-9168-4c6d-8186-16ac1a795b5b/"
    "resource/61691590-4c3f-42d3-94c5-443ad3856f64/download/parks-and-recreation-facilities-4326.csv"
)
NEIGHBOURHOODS_URL = (
    "https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/fc443770-ef0a-4025-9c2c-2cb558bfab00/"
    "resource/0719053b-28b7-48ea-b863-068823a93aaa/download/neighbourhoods-4326.geojson"
)
SURVEY_TABLES = [f"22-083858-01-06_City of Toronto Public Survey_Table{n}_Weighted.xlsx" for n in (3, 4, 5, 6)]
BELONGING_SHEET = "4"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "cs316-prototype"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8-sig")


def norm(name):
    """Normalise neighbourhood names so survey and open-data spellings match."""
    name = re.sub(r"\(\d+\)$", "", name).strip().lower()
    name = name.replace("st.", "st. ").replace("'", " ").replace("’", " ")
    return re.sub(r"[^a-z0-9]+", "", name)


def point_in_ring(x, y, ring):
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def point_in_geom(x, y, geom):
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    for poly in polys:
        if point_in_ring(x, y, poly[0]) and not any(point_in_ring(x, y, h) for h in poly[1:]):
            return True
    return False


def load_belonging():
    """Neighbourhood -> {strong, weak, base, unweighted} from Tables 3-6."""
    result = {}
    for fname in SURVEY_TABLES:
        wb = openpyxl.load_workbook(STATIC / fname, data_only=True, read_only=True)
        rows = list(wb[BELONGING_SHEET].iter_rows(values_only=True))
        names = rows[4]  # neighbourhood names; row 5 holds their numeric codes
        by_label = {}
        for idx, r in enumerate(rows):
            if isinstance(r[0], str) and r[0].strip():
                by_label.setdefault(r[0].strip().lower(), idx)
        for col in range(2, len(names)):  # col 1 is Total
            name = names[col]
            if not name:
                continue
            base = rows[by_label["base: all respondents"]][col]
            result[name.strip()] = {
                "base": base,
                "unweighted": rows[by_label["unweighted base"]][col],
                "strong": rows[by_label["strong (net)"]][col] / base * 100,
                "weak": rows[by_label["weak (net)"]][col] / base * 100,
            }
    return result


def main():
    facilities = list(csv.DictReader(io.StringIO(fetch(FACILITIES_URL))))
    centres = [f for f in facilities if f["TYPE"] == "Community Centre"]
    hoods = json.loads(fetch(NEIGHBOURHOODS_URL))["features"]

    counts = {h["properties"]["AREA_NAME"]: 0 for h in hoods}
    unmatched_centres = []
    for c in centres:
        x, y = json.loads(c["geometry"])["coordinates"][0]
        hood = next((h for h in hoods if point_in_geom(x, y, h["geometry"])), None)
        if hood:
            counts[hood["properties"]["AREA_NAME"]] += 1
        else:
            unmatched_centres.append(c["ASSET_NAME"])

    belonging = load_belonging()
    survey_by_norm = {norm(k): k for k in belonging}
    neighbourhoods = []
    unmatched_names = []
    for area, n in counts.items():
        key = survey_by_norm.get(norm(area))
        if not key:
            unmatched_names.append(area)
            continue
        neighbourhoods.append({"name": key, "centres": n, **belonging[key]})

    neighbourhoods.sort(key=lambda d: d["name"])
    OUT.write_text(json.dumps({
        "sources": {
            "facilities": "City of Toronto Open Data - Parks and Recreation Facilities",
            "neighbourhoods": "City of Toronto Open Data - Neighbourhoods (158)",
            "survey": "Tables 3-6 (weighted), Q3 sense of belonging",
        },
        "totalCentres": len(centres),
        "neighbourhoods": neighbourhoods,
    }, indent=1))
    print(f"wrote {OUT.relative_to(ROOT)}: {len(centres)} centres, {len(neighbourhoods)} neighbourhoods matched")
    if unmatched_centres:
        print("centres outside any neighbourhood:", unmatched_centres)
    if unmatched_names:
        print("open-data neighbourhoods not found in survey:", unmatched_names)
    missing = set(belonging) - {d["name"] for d in neighbourhoods}
    if missing:
        print("survey neighbourhoods not found in open data:", sorted(missing))


if __name__ == "__main__":
    main()
