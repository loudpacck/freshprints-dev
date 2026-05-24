#!/usr/bin/env python3
"""
Targeted background removal for specific files.
Uses threshold=220 to catch lighter gray pixels.
Reports before/after opaque pixel counts.
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

TARGETS = [
    BASE / "buildings" / "greek"   / "bldg_townhall_greek_t1.png",
    BASE / "buildings" / "temples" / "temple_pantheon_citadel.png",
]

THRESHOLD = 220


def remove_bg(img):
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


def count_opaque(img):
    arr = np.array(img.convert("RGBA"))
    return int((arr[:, :, 3] > 0).sum())


def main():
    for path in TARGETS:
        if not path.exists():
            print(f"MISSING: {path.name}")
            continue

        original = Image.open(path)
        before_count = count_opaque(original)

        result = remove_bg(original)
        bbox = result.getbbox()
        if bbox:
            result = result.crop(bbox)

        after_count = count_opaque(result)
        result.save(path, "PNG")

        removed = before_count - after_count
        print(f"{path.name}")
        print(f"  before: {before_count:,} opaque pixels  size={original.size}")
        print(f"  after : {after_count:,} opaque pixels  size={result.size}")
        print(f"  removed: {removed:,} background pixels")
        print()


if __name__ == "__main__":
    main()
