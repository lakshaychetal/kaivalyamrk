#!/usr/bin/env python3
"""Sample dominant brand colors from the Kaivalyam logo.

Reads `Kaivalyam Logo apvd.png`, ignores near-white background and
near-black/transparent pixels, and clusters the remaining pixels into a small
palette so we can read the brown (wordmark) and green (leaf) brand hues.
"""
import sys
from collections import Counter
from PIL import Image

LOGO = "Kaivalyam Logo apvd.png"


def luminance(r, g, b):
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def main():
    img = Image.open(LOGO).convert("RGBA")
    w, h = img.size
    print(f"image size: {w}x{h}")
    px = img.load()

    # Quantize colors into buckets of 16 to group similar shades.
    buckets = Counter()
    raw = Counter()
    total = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 128:
                continue
            total += 1
            lum = luminance(r, g, b)
            # skip near-white background
            if lum > 235:
                continue
            # skip near-black
            if lum < 18:
                continue
            key = (r // 16 * 16, g // 16 * 16, b // 16 * 16)
            buckets[key] += 1
            raw[(r, g, b)] += 1

    print(f"total opaque pixels: {total}")
    print("\nTop 25 quantized buckets (non-bg, non-black):")
    for (r, g, b), n in buckets.most_common(25):
        print(f"  #{r:02x}{g:02x}{b:02x}  rgb({r:3d},{g:3d},{b:3d})  count={n}")

    # Separate into warm (brown/gold) vs green-dominant clusters.
    greens = Counter()
    browns = Counter()
    for (r, g, b), n in raw.items():
        lum = luminance(r, g, b)
        if lum > 235 or lum < 18:
            continue
        if g > r and g > b and (g - max(r, b)) > 12:
            greens[(r, g, b)] += n
        elif r >= g and r > b:
            browns[(r, g, b)] += n

    def avg(counter):
        tr = tg = tb = tot = 0
        for (r, g, b), n in counter.items():
            tr += r * n
            tg += g * n
            tb += b * n
            tot += n
        if tot == 0:
            return None
        return (round(tr / tot), round(tg / tot), round(tb / tot), tot)

    print("\nGreen cluster representative shades (top 12):")
    for (r, g, b), n in greens.most_common(12):
        print(f"  #{r:02x}{g:02x}{b:02x}  rgb({r:3d},{g:3d},{b:3d})  count={n}")
    ga = avg(greens)
    if ga:
        print(f"  GREEN weighted avg: #{ga[0]:02x}{ga[1]:02x}{ga[2]:02x}  rgb{ga[:3]}  (n={ga[3]})")

    print("\nBrown/warm cluster representative shades (top 12):")
    for (r, g, b), n in browns.most_common(12):
        print(f"  #{r:02x}{g:02x}{b:02x}  rgb({r:3d},{g:3d},{b:3d})  count={n}")
    ba = avg(browns)
    if ba:
        print(f"  BROWN weighted avg: #{ba[0]:02x}{ba[1]:02x}{ba[2]:02x}  rgb{ba[:3]}  (n={ba[3]})")


if __name__ == "__main__":
    sys.exit(main())
