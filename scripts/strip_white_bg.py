#!/usr/bin/env python3
"""
Remove white backgrounds from Pantheon Wars building + NPC animal sprites.
  1. Convert RGB → RGBA
  2. BFS flood-fill from all 4 corners, removing near-white pixels (threshold=240)
  3. Crop to content bounding box
  4. Save in-place (overwrite originals)
"""

import sys
from pathlib import Path
from collections import deque

try:
    import numpy as np
except ImportError:
    print("ERROR: numpy required. pip install numpy")
    sys.exit(1)

from PIL import Image

BASE = Path(__file__).parent.parent / "public" / "pantheon_wars_assets"

BUILDING_DIRS = [
    BASE / "buildings" / "greek",
    BASE / "buildings" / "norse",
    BASE / "buildings" / "mesopotamian",
    BASE / "buildings" / "temples",
]

NPC_DIRS = [
    BASE / "sprites" / "npc" / "greek",
    BASE / "sprites" / "npc" / "norse",
    BASE / "sprites" / "npc" / "mesopotamian",
]

BG_DELETE = BASE / "backgrounds" / "greek" / "bg_greek_sky_front.png"

THRESHOLD = 240


def remove_white_bg(img):
    img = img.convert("RGBA")
    data = np.array(img, dtype=np.uint8)
    h, w = data.shape[:2]

    near_white = (
        (data[:, :, 0] >= THRESHOLD) &
        (data[:, :, 1] >= THRESHOLD) &
        (data[:, :, 2] >= THRESHOLD)
    )

    visited = np.zeros((h, w), dtype=bool)
    queue = deque()

    for r, c in [(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)]:
        if near_white[r, c] and not visited[r, c]:
            visited[r, c] = True
            queue.append((r, c))

    while queue:
        r, c = queue.popleft()
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < h and 0 <= nc < w and not visited[nr, nc] and near_white[nr, nc]:
                visited[nr, nc] = True
                queue.append((nr, nc))

    data[visited, 3] = 0
    return Image.fromarray(data, "RGBA")


def process(path):
    img = Image.open(path)
    orig = img.size
    result = remove_white_bg(img)
    bbox = result.getbbox()
    if bbox:
        result = result.crop(bbox)
    result.save(path, "PNG")
    return orig, result.size


def main():
    targets = []

    for d in BUILDING_DIRS:
        targets.extend(sorted(d.glob("*.png")))

    for d in NPC_DIRS:
        targets.extend(f for f in sorted(d.glob("*.png")) if "animal" in f.name)

    print(f"Processing {len(targets)} files...\n")

    results = []
    errors = []

    for path in targets:
        try:
            orig, new = process(path)
            results.append((path.name, orig, new))
        except Exception as e:
            errors.append((path.name, str(e)))
            print(f"  ERROR {path.name}: {e}")

    # Delete blank background file
    deleted = False
    if BG_DELETE.exists():
        BG_DELETE.unlink()
        deleted = True

    # Print a sample of dimension changes (first 15, spread across building types)
    print("Sample before/after dimensions:")
    sample_indices = list(range(0, min(len(results), 6))) + list(range(30, min(len(results), 36))) + list(range(90, min(len(results), 101)))
    seen = set()
    count = 0
    for i in sample_indices:
        if i >= len(results) or i in seen:
            continue
        seen.add(i)
        name, orig, new = results[i]
        tw = orig[0] - new[0]
        th = orig[1] - new[1]
        print(f"  {name:<45s}  {orig[0]:>4}x{orig[1]:<4} -> {new[0]:>4}x{new[1]:<4}  (-{tw}px w, -{th}px h)")
        count += 1
        if count >= 12:
            break

    print(f"\n--- Summary ---")
    print(f"Converted : {len(results)}/{len(targets)} files")
    print(f"Errors    : {len(errors)}")
    print(f"Deleted   : {'bg_greek_sky_front.png' if deleted else 'not found'}")

    if errors:
        print("\nFailed files:")
        for name, err in errors:
            print(f"  {name}: {err}")


if __name__ == "__main__":
    main()
