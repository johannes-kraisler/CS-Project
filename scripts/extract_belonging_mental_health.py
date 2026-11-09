"""Extract Q1 (mental health) split by sense of belonging (Strong vs Weak)
from the weighted Table1 workbook into src/lib/data/mental-health-by-belonging.json.

Usage: python scripts/extract_belonging_mental_health.py   (needs: pip install openpyxl)
"""
import json
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "static" / "22-083858-01-06_City of Toronto Public Survey_Table1_Weighted.xlsx"
OUT = ROOT / "src" / "lib" / "data" / "mental-health-by-belonging.json"

ANSWERS = [("Excellent (5)", "Excellent"), ("Very good (4)", "Very good"), ("Good (3)", "Good"),
           ("Fair (2)", "Fair"), ("Poor (1)", "Poor")]
NETS = [("Top 2 Box (Net)", "Excellent or very good"), ("Bottom 2 Box (Net)", "Fair or poor")]


def main():
    wb = openpyxl.load_workbook(XLSX, data_only=True, read_only=True)
    rows = list(wb["1"].iter_rows(values_only=True))
    groups, subs = rows[4], rows[5]

    # Find the "Belonging" banner block and its Strong / Weak columns.
    start = groups.index("Belonging")
    cols = {"all": 1}
    for i in range(start, len(subs)):
        if i > start and groups[i]:
            break
        cols[subs[i].strip().lower()] = i  # "strong", "weak"

    by_label = {}
    for r in rows:
        if isinstance(r[0], str) and r[0].strip():
            by_label.setdefault(r[0].strip().lower(), r)

    def counts(label):
        r = by_label[label.lower()]
        return {k: r[i] for k, i in cols.items()}

    out = {
        "source": XLSX.name,
        "question": rows[3][0].strip(),
        "groups": [{"id": "strong", "label": "Strong sense of belonging"},
                   {"id": "weak", "label": "Weak sense of belonging"},
                   {"id": "all", "label": "All Torontonians"}],
        "base": counts("Base: All respondents"),
        "unweightedBase": counts("Unweighted Base"),
        "answers": [{"label": short, "counts": counts(src)} for src, short in ANSWERS],
        "nets": [{"label": short, "counts": counts(src)} for src, short in NETS],
    }
    OUT.write_text(json.dumps(out, indent=2))
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
