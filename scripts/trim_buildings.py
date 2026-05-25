"""
Aggressive alpha-trim for all building and temple PNGs.
Scans rows/cols from edges; a row/col is "meaningful" if it has
at least 5 pixels with alpha > 80. Crops to the tight bounding box.
"""
import sys
from pathlib import Path

try:
    from PIL import Image
    import numpy as np
except ImportError:
    print("ERROR: Pillow or numpy not installed. Run: pip install Pillow numpy")
    sys.exit(1)

ALPHA_THRESHOLD = 80
MIN_PIXELS = 5

SPOT_CHECK = {
    "bldg_townhall_greek_t1.png",
    "bldg_townhall_greek_t3.png",
    "bldg_warfare_greek_t2.png",
    "temple_roadside_shrine.png",
    "temple_pantheon_citadel.png",
}

def find_bounds(alpha: np.ndarray):
    """Return (top, bottom, left, right) meaningful bounding box rows/cols."""
    h, w = alpha.shape

    # rows: count pixels per row exceeding threshold
    row_counts = (alpha > ALPHA_THRESHOLD).sum(axis=1)
    col_counts = (alpha > ALPHA_THRESHOLD).sum(axis=0)

    meaningful_rows = np.where(row_counts >= MIN_PIXELS)[0]
    meaningful_cols = np.where(col_counts >= MIN_PIXELS)[0]

    if len(meaningful_rows) == 0 or len(meaningful_cols) == 0:
        return None  # fully transparent, skip

    top    = int(meaningful_rows[0])
    bottom = int(meaningful_rows[-1]) + 1  # +1 for exclusive slice
    left   = int(meaningful_cols[0])
    right  = int(meaningful_cols[-1]) + 1

    return (top, bottom, left, right)


def trim_png(path: Path) -> tuple[tuple, tuple] | None:
    """Trim a PNG in place. Returns (original_size, new_size) or None if skipped."""
    img = Image.open(path).convert("RGBA")
    orig_size = img.size  # (w, h)

    alpha = np.array(img)[:, :, 3]
    bounds = find_bounds(alpha)

    if bounds is None:
        return None

    top, bottom, left, right = bounds

    # Skip if no crop needed
    if top == 0 and bottom == orig_size[1] and left == 0 and right == orig_size[0]:
        return orig_size, orig_size

    cropped = img.crop((left, top, right, bottom))
    cropped.save(path, "PNG")
    return orig_size, cropped.size


def process_dir(d: Path):
    if not d.exists():
        print(f"  SKIP (not found): {d}")
        return

    pngs = list(d.glob("*.png"))
    print(f"\n{d} — {len(pngs)} files")

    for p in sorted(pngs):
        result = trim_png(p)
        tag = p.name
        if result is None:
            print(f"  [SKIP-transparent] {tag}")
        else:
            orig, new = result
            if orig != new:
                delta_h = orig[1] - new[1]
                delta_w = orig[0] - new[0]
                line = f"  [TRIMMED] {tag}  {orig[0]}x{orig[1]} -> {new[0]}x{new[1]}  (-{delta_w}w, -{delta_h}h)"
            else:
                line = f"  [no-op]   {tag}  {orig[0]}x{orig[1]}"

            if tag in SPOT_CHECK:
                print(f"  *** SPOT-CHECK *** {line.strip()}")
            else:
                print(line)


def main():
    base = Path(__file__).parent.parent / "public" / "pantheon_wars_assets" / "buildings"

    dirs = [
        base / "greek",
        base / "norse",
        base / "mesopotamian",
        base / "temples",
    ]

    print("=== Aggressive Alpha Trim Pass ===")
    print(f"Alpha threshold: >{ALPHA_THRESHOLD}, min pixels per row/col: {MIN_PIXELS}")

    for d in dirs:
        process_dir(d)

    print("\nDone.")


if __name__ == "__main__":
    main()
