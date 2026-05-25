"""
Slice each 3x3 sprite sheet PNG into 9 cells and save previews.
Then compute per-cell stats to detect animation vs. static frames.
"""
import os
import json
import hashlib
from pathlib import Path
from PIL import Image, ImageChops
import numpy as np

BASE = Path(r"B:\freshprints-dev\public\pantheon_wars_assets\extras")
PREVIEW_DIR = Path(r"B:\freshprints-dev\preview")
PREVIEW_DIR.mkdir(exist_ok=True)

CELL_W = CELL_H = 418  # expected cell size
GRID = 3

PNGS = []
for subdir in ("greek", "norse", "mesopotamian"):
    folder = BASE / subdir
    for f in sorted(folder.glob("*.png")):
        PNGS.append(f)

results = {}

for png_path in PNGS:
    img = Image.open(png_path).convert("RGBA")
    w, h = img.size
    cols = w // CELL_W
    rows = h // CELL_H
    name = png_path.stem

    entry = {
        "file": str(png_path),
        "size": f"{w}x{h}",
        "cols": cols,
        "rows": rows,
        "cells": [],
    }

    cells = []
    for r in range(rows):
        for c in range(cols):
            x0 = c * CELL_W
            y0 = r * CELL_H
            x1 = x0 + CELL_W
            y1 = y0 + CELL_H
            cell = img.crop((x0, y0, x1, y1))
            cells.append(cell)

            # Save preview
            out_name = f"{name}_cell_{r*cols+c}.png"
            cell.save(PREVIEW_DIR / out_name)

    # Analyze cells
    arrays = [np.array(c, dtype=np.int32) for c in cells]

    # Hash each cell to detect duplicates
    hashes = []
    for c in cells:
        h = hashlib.md5(c.tobytes()).hexdigest()
        hashes.append(h)

    # Count non-transparent pixels per cell
    alpha_counts = [int((a[:, :, 3] > 10).sum()) for a in arrays]

    # Measure mean pixel difference between consecutive frames
    diffs = []
    for i in range(1, len(arrays)):
        diff = np.abs(arrays[i] - arrays[i-1]).mean()
        diffs.append(float(diff))

    # Max diff between any two cells
    max_diff = 0.0
    for i in range(len(arrays)):
        for j in range(i+1, len(arrays)):
            d = float(np.abs(arrays[i] - arrays[j]).mean())
            if d > max_diff:
                max_diff = d

    unique_hashes = len(set(hashes))
    blank_cells = [i for i, cnt in enumerate(alpha_counts) if cnt < 100]

    entry["unique_cells"] = unique_hashes
    entry["blank_cells"] = blank_cells
    entry["alpha_counts"] = alpha_counts
    entry["consecutive_diffs"] = [round(d, 2) for d in diffs]
    entry["max_inter_cell_diff"] = round(max_diff, 2)
    entry["mean_consecutive_diff"] = round(sum(diffs)/len(diffs), 2) if diffs else 0

    results[name] = entry

# Print report
print("=" * 70)
print("SPRITE SHEET ANALYSIS REPORT")
print("=" * 70)

for name, e in results.items():
    print(f"\n[{name}]")
    print(f"  Size: {e['size']}  Grid: {e['cols']}x{e['rows']}  Unique cells: {e['unique_cells']}/9")
    print(f"  Blank cells (alpha<100px): {e['blank_cells']}")
    print(f"  Alpha pixel counts per cell: {e['alpha_counts']}")
    print(f"  Consecutive frame diffs: {e['consecutive_diffs']}")
    print(f"  Mean consec diff: {e['mean_consecutive_diff']}  Max inter-cell diff: {e['max_inter_cell_diff']}")

    # Verdict
    if e["unique_cells"] == 1:
        verdict = "STATIC — all 9 cells are identical"
    elif e["unique_cells"] <= 3:
        verdict = "MOSTLY STATIC — very few unique frames, likely duplicates"
    elif e["max_inter_cell_diff"] < 5:
        verdict = "NEARLY IDENTICAL — cells differ only slightly, likely NOT animation frames"
    elif e["mean_consecutive_diff"] > 15:
        verdict = "ANIMATION FRAMES — high frame-to-frame variation, likely motion sequence"
    elif e["mean_consecutive_diff"] > 5:
        verdict = "POSSIBLY ANIMATED — moderate variation between cells"
    else:
        verdict = "STATIC / DECORATIVE — low variation, not an animation sequence"
    print(f"  >>> VERDICT: {verdict}")

print("\n" + "=" * 70)
print(f"Preview cells saved to: {PREVIEW_DIR}")
print("=" * 70)
