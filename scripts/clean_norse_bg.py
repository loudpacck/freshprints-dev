"""
Removes white/near-white backgrounds from 8 Norse building PNGs.

Two strategies:
  - Corner flood-fill (threshold 220): embassy, shop, fortification t2/t3
  - Full pixel scan (threshold 220): exploration t1/t2/t3, ritual t2
    (catches interior white regions that corner flood-fill misses)

Reports before/after opaque pixel counts per file.
"""

import os
from PIL import Image

ASSET_DIR = os.path.join(
    os.path.dirname(__file__), '..', 'public',
    'pantheon_wars_assets', 'buildings', 'norse'
)

THRESHOLD = 220

# Files where interior holes need full-pixel-scan removal
INTERIOR_FILES = {
    'bldg_exploration_norse_t1.png',
    'bldg_exploration_norse_t2.png',
    'bldg_exploration_norse_t3.png',
    'bldg_ritual_norse_t2.png',
}

# All 8 target files
TARGET_FILES = [
    'bldg_embassy_norse.png',
    'bldg_shop_norse.png',
    'bldg_fortification_norse_t2.png',
    'bldg_fortification_norse_t3.png',
    'bldg_exploration_norse_t1.png',
    'bldg_exploration_norse_t2.png',
    'bldg_exploration_norse_t3.png',
    'bldg_ritual_norse_t2.png',
]


def is_near_white(r, g, b):
    return r >= THRESHOLD and g >= THRESHOLD and b >= THRESHOLD


def flood_fill_from_corners(img):
    """
    BFS flood-fill from all four corners.
    Any near-white pixel reachable from a corner becomes transparent.
    """
    px = img.load()
    w, h = img.size
    visited = [[False] * h for _ in range(w)]
    queue = []

    # Seed from all four corners
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    for cx, cy in corners:
        r, g, b, a = px[cx, cy]
        if a > 0 and is_near_white(r, g, b) and not visited[cx][cy]:
            visited[cx][cy] = True
            queue.append((cx, cy))

    while queue:
        x, y = queue.pop()
        r, g, b, a = px[x, y]
        if a > 0 and is_near_white(r, g, b):
            px[x, y] = (r, g, b, 0)
        for nx, ny in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
            if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
                nr, ng, nb, na = px[nx, ny]
                if na > 0 and is_near_white(nr, ng, nb):
                    visited[nx][ny] = True
                    queue.append((nx, ny))

    return img


def full_pixel_scan(img):
    """
    Removes ALL near-white pixels regardless of position — catches interior holes.
    Applied after corner flood-fill so we get both edge and interior removal.
    """
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0 and is_near_white(r, g, b):
                px[x, y] = (r, g, b, 0)
    return img


def count_opaque(img):
    px = img.load()
    w, h = img.size
    return sum(1 for y in range(h) for x in range(w) if px[x, y][3] > 0)


def process_file(filename):
    path = os.path.join(ASSET_DIR, filename)
    if not os.path.exists(path):
        print(f'  MISSING: {filename}')
        return

    img = Image.open(path).convert('RGBA')
    before = count_opaque(img)

    # Always do corner flood-fill first
    img = flood_fill_from_corners(img)

    # For interior-hole files, also do full pixel scan
    if filename in INTERIOR_FILES:
        img = full_pixel_scan(img)

    after = count_opaque(img)
    img.save(path)

    strategy = 'flood-fill+full-scan' if filename in INTERIOR_FILES else 'flood-fill'
    removed = before - after
    print(f'  {filename}')
    print(f'    strategy : {strategy}')
    print(f'    before   : {before:,} opaque px')
    print(f'    after    : {after:,} opaque px')
    print(f'    removed  : {removed:,} px ({removed / max(before,1) * 100:.1f}%)')


if __name__ == '__main__':
    print(f'Norse PNG cleanup — threshold {THRESHOLD}\n')
    for f in TARGET_FILES:
        process_file(f)
    print('\nDone.')
