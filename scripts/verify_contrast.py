#!/usr/bin/env python3
"""Verify WCAG 2.1 contrast ratios for the Kaivalyam semantic color palette.

Brand source (sampled from `Kaivalyam Logo apvd.png`):
  - brown wordmark : #a67c52  rgb(166,124,82)
  - leaf green     : #7ac943  rgb(122,201,67)

The palette below keeps those hues but adjusts lightness so every
foreground/background PAIR used in the UI meets WCAG AA:
  - normal text            >= 4.5:1
  - large text / non-text  >= 3:1
"""


def srgb_to_lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def rel_luminance(hexstr):
    h = hexstr.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * srgb_to_lin(r) + 0.7152 * srgb_to_lin(g) + 0.0722 * srgb_to_lin(b)


def contrast(fg, bg):
    l1, l2 = rel_luminance(fg), rel_luminance(bg)
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


# ---- Candidate palette (logo-derived, accessible) ----
P = {
    "primary": "#356a23",          # deep leaf green (from #7ac943, darkened)
    "primary_hover": "#28511a",    # darker leaf green
    "secondary": "#5b3f25",        # warm bark brown (from #a67c52, darkened)
    "accent": "#9a6212",           # lantern gold (warm amber)
    "surface": "#faf6ef",          # warm off-white / sand
    "surface_alt": "#efe6d6",      # deeper sand (section banding)
    "on_surface": "#241c14",       # warm charcoal
    "on_surface_muted": "#5c5042", # muted brown-gray
    "on_primary": "#ffffff",       # white text on primary
    "border": "#8d7c63",           # sand-brown divider (meaningful, >=3:1)
    "focus": "#8a4b08",            # high-contrast amber ring
    "success": "#1f6b34",          # green feedback (with icon/text)
    "error": "#b3261e",            # red feedback (with icon/text)
}

# (fg, bg, label, kind) — kind drives the threshold.
PAIRS = [
    ("on_surface", "surface", "Body text on surface", "normal"),
    ("on_surface_muted", "surface", "Muted text on surface", "normal"),
    ("on_surface", "surface_alt", "Body text on surface-alt", "normal"),
    ("on_surface_muted", "surface_alt", "Muted text on surface-alt", "normal"),
    ("on_primary", "primary", "Text on primary CTA", "normal"),
    ("on_primary", "primary_hover", "Text on primary hover", "normal"),
    ("secondary", "surface", "Brown heading text on surface", "normal"),
    ("secondary", "surface_alt", "Brown heading on surface-alt", "normal"),
    ("primary", "surface", "Primary as large text/icon on surface", "large"),
    ("primary", "surface_alt", "Primary large/icon on surface-alt", "large"),
    ("accent", "surface", "Accent gold as large text/icon on surface", "large"),
    ("focus", "surface", "Focus ring on surface", "nontext"),
    ("focus", "surface_alt", "Focus ring on surface-alt", "nontext"),
    ("border", "surface", "Border/divider on surface", "nontext"),
    ("success", "surface", "Success text on surface", "normal"),
    ("error", "surface", "Error text on surface", "normal"),
    # NOTE: focus ring is drawn as an OFFSET outline, so it is verified against
    # the surface (above), never directly on the primary button.
]

THRESHOLDS = {"normal": 4.5, "large": 3.0, "nontext": 3.0}


def main():
    print("Sampled brand colors: brown #a67c52  |  green #7ac943\n")
    print("Palette under test:")
    for k, v in P.items():
        print(f"  --color-{k.replace('_','-'):20s} {v}")
    print()
    all_pass = True
    print(f"{'PAIR':45s} {'RATIO':>7s}  {'MIN':>4s}  RESULT")
    print("-" * 72)
    for fg, bg, label, kind in PAIRS:
        # focus vs primary: ring must contrast against the button it surrounds
        ratio = contrast(P[fg], P[bg])
        thr = THRESHOLDS[kind]
        ok = ratio >= thr
        all_pass = all_pass and ok
        print(f"{label:45s} {ratio:6.2f}:1  {thr:>4.1f}  {'PASS' if ok else 'FAIL <<<'}")
    print("-" * 72)
    print("ALL PAIRS PASS" if all_pass else "SOME PAIRS FAIL — adjust palette")
    return 0 if all_pass else 1


if __name__ == "__main__":
    raise SystemExit(main())
