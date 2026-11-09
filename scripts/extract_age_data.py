"""Extract Q1 (mental health), Q2 (community services) and Q3 (belonging)
by age group from the weighted Table2 workbook into src/lib/data/survey-by-age.json.

Usage: python scripts/extract_age_data.py   (needs: pip install openpyxl)
"""
import json
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "static" / "22-083858-01-06_City of Toronto Public Survey_Table2_Weighted.xlsx"
OUT = ROOT / "src" / "lib" / "data" / "survey-by-age.json"

# Column letters from the table header row -> our age group ids
AGE_COLUMNS = {"all": "A", "18-24": "O", "25-34": "P", "35-44": "Q", "45-54": "R", "55+": "S"}
AGE_LABELS = {"all": "All ages", "18-24": "18–24", "25-34": "25–34", "35-44": "35–44",
              "45-54": "45–54", "55+": "55+"}

QUESTIONS = [
    {"id": "mental_health", "sheet": "1", "title": "Mental health",
     "rows": [("Excellent (5)", "Excellent"), ("Very good (4)", "Very good"), ("Good (3)", "Good"),
              ("Fair (2)", "Fair"), ("Poor (1)", "Poor")]},
    {"id": "belonging", "sheet": "4", "title": "Sense of belonging",
     "rows": [("Very Strong (4)", "Very strong"), ("Somewhat Strong (3)", "Somewhat strong"),
              ("Somewhat Weak (2)", "Somewhat weak"), ("Very Weak (1)", "Very weak")]},
    {"id": "services", "sheet": "2", "title": "Use of community services",
     "rows": [("Never (0 times in past 12 months)", "Never"),
              ("Occasionally (1-6 times in past 12 months)", "Occasionally (1–6)"),
              ("Frequently (7-12 times in past 12 months)", "Frequently (7–12)"),
              ("Very Frequently (13+ times in past 12 months)", "Very frequently (13+)")]},
]
NON_ANSWERS = ["Don't know", "Prefer not to say", "Prefer not to answer"]


def main():
    wb = openpyxl.load_workbook(XLSX, data_only=True, read_only=True)
    out = {"source": XLSX.name, "ageGroups": [{"id": k, "label": v} for k, v in AGE_LABELS.items()],
           "questions": []}
    for q in QUESTIONS:
        rows = list(wb[q["sheet"]].iter_rows(values_only=True))
        q_text = rows[3][0].strip()
        letters = rows[6]
        col = {age: letters.index(letter) for age, letter in AGE_COLUMNS.items()}
        by_label = {}
        for r in rows:
            if isinstance(r[0], str) and r[0].strip():
                by_label.setdefault(r[0].strip().lower(), r)
        unweighted = by_label["unweighted base"]
        base = by_label["base: all respondents"]

        def counts(source_label):
            r = by_label[source_label.lower()]
            return {age: r[i] for age, i in col.items()}

        nonans = {age: 0 for age in col}
        for na in NON_ANSWERS:
            if na.lower() in by_label:
                for age, v in counts(na).items():
                    nonans[age] += v
        out["questions"].append({
            "id": q["id"], "title": q["title"], "question": q_text,
            "base": {age: base[i] for age, i in col.items()},
            "unweightedBase": {age: unweighted[i] for age, i in col.items()},
            "noAnswer": nonans,
            "answers": [{"label": short, "counts": counts(src)} for src, short in q["rows"]],
        })
    OUT.write_text(json.dumps(out, indent=2))
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
