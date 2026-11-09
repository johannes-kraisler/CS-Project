"""Extract sense of belonging (Q3) split by use of community services (Q2) from the
weighted Table1 workbook, and compute the Spearman correlation between the two
from the weighted cross-tab. Writes src/lib/data/belonging-by-services.json.

Usage: python scripts/extract_services_belonging.py   (needs: pip install openpyxl)
"""
import json
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "static" / "22-083858-01-06_City of Toronto Public Survey_Table1_Weighted.xlsx"
OUT = ROOT / "src" / "lib" / "data" / "belonging-by-services.json"

SERVICE_GROUPS = [  # (column header in the "Used service 12m" banner, label, rank)
    ("Never", "Never", 1),
    ("Occassionally", "Occasionally (1–6)", 2),
    ("Frequently", "Frequently (7–12)", 3),
    ("Very Frequently", "Very frequently (13+)", 4),
]
BELONGING = [("Very Strong (4)", 4), ("Somewhat Strong (3)", 3), ("Somewhat Weak (2)", 2), ("Very Weak (1)", 1)]


def spearman(table):
    """Spearman rank correlation from weighted counts: table[(x, y)] = weight."""
    def midranks(totals):
        ranks, start = {}, 0
        for k in sorted(totals):
            ranks[k] = start + (totals[k] + 1) / 2
            start += totals[k]
        return ranks

    xt, yt = {}, {}
    for (x, y), w in table.items():
        xt[x] = xt.get(x, 0) + w
        yt[y] = yt.get(y, 0) + w
    rx, ry = midranks(xt), midranks(yt)
    n = sum(table.values())
    mx = sum(rx[x] * w for x, w in xt.items()) / n
    my = sum(ry[y] * w for y, w in yt.items()) / n
    cov = sum((rx[x] - mx) * (ry[y] - my) * w for (x, y), w in table.items())
    vx = sum((rx[x] - mx) ** 2 * w for x, w in xt.items())
    vy = sum((ry[y] - my) ** 2 * w for y, w in yt.items())
    return cov / (vx * vy) ** 0.5


def main():
    wb = openpyxl.load_workbook(XLSX, data_only=True, read_only=True)
    rows = list(wb["4"].iter_rows(values_only=True))  # Table 4 = Q3 belonging
    groups, subs = rows[4], rows[5]
    start = groups.index("Used service 12m")
    cols = {}
    for i in range(start, len(subs)):
        if i > start and groups[i]:
            break
        cols[subs[i].strip()] = i

    by_label = {}
    for r in rows:
        if isinstance(r[0], str) and r[0].strip():
            by_label.setdefault(r[0].strip().lower(), r)
    val = lambda label, col: by_label[label.lower()][col]

    out_groups, table = [], {}
    for header, label, rank in SERVICE_GROUPS:
        c = cols[header]
        base = val("Base: All respondents", c)
        out_groups.append({
            "label": label,
            "base": base,
            "unweighted": val("Unweighted Base", c),
            "veryStrong": val("Very Strong (4)", c) / base * 100,
            "strong": val("Strong (Net)", c) / base * 100,
            "weak": val("Weak (Net)", c) / base * 100,
        })
        for src, score in BELONGING:
            table[(rank, score)] = val(src, c)

    OUT.write_text(json.dumps({
        "source": XLSX.name,
        "groups": out_groups,
        "spearman": spearman(table),
        "note": "Spearman correlation computed from the weighted cross-tab of Q2 x Q3, excluding Don't know / no answer.",
    }, indent=1))
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
