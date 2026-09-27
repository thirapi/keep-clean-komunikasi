#!/usr/bin/env python3
"""
Regenerate every app icon from one source image.

The source is a small antialiased render (not hard pixel art), so it is
upscaled with LANCZOS from a tight crop, then downscaled per size.

Two families are produced, because Android and iOS crop differently and one
file cannot serve both:

  any       logo on a filled tile, small inset. No crop is applied, so the
            full mark is always visible.
  maskable  full-bleed background with the logo inset far enough that its
            corners stay inside the safe circle. Android guarantees only the
            central 80% circle, so for a mark of aspect w/h the safe height is
            (0.80 / sqrt(1 + (w/h)^2)) of the canvas.

Usage: python3 scripts/build-icons.py <source.png>
"""
import sys
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public")
ICONS = os.path.join(PUB, "icons")

# The mark's own near-black, used as the tile colour so the app and the icon
# match. Matches theme_color's dark side.
BG_DARK = (9, 9, 11)
BG_LIGHT = (248, 248, 248)
FG_LIGHT = (248, 248, 248)   # mark as drawn: near-white
FG_DARK = (12, 12, 14)       # inverted, for light surfaces

# Fraction of the canvas the mark may occupy.
ANY_INSET = 0.80        # height of the mark on an "any" tile
MASKABLE_INSET = 0.58   # height of the mark on a maskable icon (safe circle)

LUMA_BG = 0.2126 * BG_DARK[0] + 0.7152 * BG_DARK[1] + 0.0722 * BG_DARK[2]
LUMA_FG = 0.2126 * FG_LIGHT[0] + 0.7152 * FG_LIGHT[1] + 0.0722 * FG_LIGHT[2]


def load_mark(src: str) -> Image.Image:
    """Crop to the ink bounding box and derive a clean alpha mask.

    The source has its background baked in as opaque pixels, so transparency is
    recovered from luminance. The counters inside "8" and "0" are background
    coloured by design, so they correctly become transparent holes.
    """
    im = Image.open(src).convert("RGB")
    w, h = im.size
    px = im.load()

    tol = 26
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            c = px[x, y]
            if max(abs(c[i] - BG_DARK[i]) for i in range(3)) > tol:
                xs.append(x)
                ys.append(y)
    if not xs:
        raise SystemExit("source image has no visible content")
    box = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
    im = im.crop(box)
    w, h = im.size

    # Alpha from luminance so antialiased edges keep their gradient, but the RGB
    # is forced to a single flat colour. Copying the source's own RGB carried
    # ~1100 near-identical shades for what is a two-colour mark, which both muddied
    # the edges and made the PNGs an order of magnitude larger.
    rgba = Image.new("RGBA", (w, h))
    out = rgba.load()
    for y in range(h):
        for x in range(w):
            c = im.getpixel((x, y))
            luma = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
            a = (luma - LUMA_BG) / (LUMA_FG - LUMA_BG)
            a = 0.0 if a < 0.02 else (1.0 if a > 0.98 else a)
            out[x, y] = (FG_LIGHT[0], FG_LIGHT[1], FG_LIGHT[2], int(round(a * 255)))
    return rgba


def upscale(mark: Image.Image, target_h: int) -> Image.Image:
    """One high-quality scale to the largest size we need, then reuse it."""
    if mark.height >= target_h:
        return mark
    w = max(1, round(mark.width * target_h / mark.height))
    return mark.resize((w, target_h), Image.LANCZOS)


def on_tile(mark: Image.Image, size: int, bg, fg_scale: float = 1.0) -> Image.Image:
    """Mark centred on a filled square tile, letterboxed to keep it undistorted."""
    tile = Image.new("RGBA", (size, size), bg + (255,))
    h = int(round(size * ANY_INSET))
    w = max(1, round(mark.width * h / mark.height))
    if w > size * 0.94:
        w = int(size * 0.94)
        h = max(1, round(mark.height * w / mark.width))
    glyph = mark.resize((w, h), Image.LANCZOS)
    tile.alpha_composite(glyph, ((size - w) // 2, (size - h) // 2))
    return tile


def maskable(mark: Image.Image, size: int, bg, invert: bool = False) -> Image.Image:
    """Full-bleed background, mark inset inside the guaranteed-visible circle.

    The mark is portrait (w/h ~0.857), so its half-diagonal is what must fit
    the safe circle's radius, not its height:
        h * sqrt(1 + (w/h)^2) / 2 <= 0.40 * size
    which is what MASKABLE_INSET is sized against.

    `invert` is required for a light background: the mark is near-white by
    construction, so on a light tile it would be invisible.
    """
    if invert:
        m = Image.new("RGBA", mark.size)
        m.paste(FG_DARK + (255,), (0, 0, mark.width, mark.height), mark.getchannel("A"))
        mark = m
    tile = Image.new("RGBA", (size, size), bg + (255,))
    h = int(round(size * MASKABLE_INSET))
    w = max(1, round(mark.width * h / mark.height))
    glyph = mark.resize((w, h), Image.LANCZOS)
    tile.alpha_composite(glyph, ((size - w) // 2, (size - h) // 2))
    return tile


def save(img: Image.Image, rel: str, flatten: bool = False, bg=None):
    path = os.path.join(PUB, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    out = img
    if flatten and bg is not None:
        flat = Image.new("RGB", img.size, bg)
        flat.paste(img, mask=img.getchannel("A"))
        out = flat
    out.save(path, "PNG", optimize=True)
    print(f"  {rel:<44} {img.size[0]}x{img.size[1]}")


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(PUB, "logo-source.png")
    mark = load_mark(src)
    aspect = mark.width / mark.height
    big = upscale(mark, 2048)
    print(f"source: {src}")
    print(f"mark after tight crop: {mark.width}x{mark.height}  aspect {aspect:.3f}")
    safe_h = 0.80 / (2 ** 0.5) if aspect == 1 else 0.80 / ((1 + aspect ** 2) ** 0.5)
    print(f"maskable max height without cropping: {safe_h * 100:.1f}% of canvas "
          f"(using {MASKABLE_INSET * 100:.0f}%)")

    print("\nany icons (logo on a filled tile):")
    for size, rel in [
        (16, "favicon-16x16.png"),
        (32, "favicon-32x32.png"),
        (180, "apple-touch-icon.png"),
        (192, "android-chrome-192x192.png"),
        (512, "android-chrome-512x512.png"),
    ]:
        save(on_tile(big, size, BG_DARK), rel, flatten=True, bg=BG_DARK)

    print("\nmaskable icons (full bleed + safe-circle inset):")
    for size in [48, 72, 96, 128, 192, 384, 512, 1024]:
        name = "maskable_icon.png" if size == 1024 else f"maskable_icon_x{size}.png"
        save(maskable(big, size, BG_DARK), f"icons/{name}", flatten=True, bg=BG_DARK)

    print("\nvariants the brief asked for:")

    # Transparent, mark only. Both variants share one height so they are
    # interchangeable at the same CSS size.
    TRANSPARENT_H = 1024
    tw = max(1, round(mark.width * TRANSPARENT_H / mark.height))
    transparent = mark.resize((tw, TRANSPARENT_H), Image.LANCZOS)
    save(transparent, "icons/logo-on-transparent-light.png")

    # Transparent, inverted glyph for light surfaces.
    inv = Image.new("RGBA", transparent.size)
    inv.paste(FG_DARK + (255,), (0, 0, tw, TRANSPARENT_H), transparent.getchannel("A"))
    save(inv, "icons/logo-on-transparent-dark.png")
    # Maskable on a light background, for light-mode launchers. The mark is
    # near-white, so it must be inverted or it would be invisible.
    for size in [192, 512, 1024]:
        name = "maskable_icon_light" + (".png" if size == 1024 else f"_x{size}.png")
        save(maskable(big, size, BG_LIGHT, invert=True), f"icons/{name}",
             flatten=True, bg=BG_LIGHT)

    # favicon.ico, multi-resolution.
    ico_sizes = [16, 32, 48, 64, 128, 256]
    frames = [on_tile(big, s, BG_DARK).convert("RGBA") for s in ico_sizes]
    ico_path = os.path.join(PUB, "favicon.ico")
    frames[-1].save(ico_path, format="ICO",
                    sizes=[(s, s) for s in ico_sizes])
    print(f"  favicon.ico                                 {ico_sizes}")

    # OG image: 1200x630, filled, mark centred.
    W, H = 1200, 630
    og = Image.new("RGB", (W, H), BG_DARK)
    h = int(H * 0.52)
    w = max(1, round(mark.width * h / mark.height))
    g = mark.resize((w, h), Image.LANCZOS)
    og.paste(g, ((W - w) // 2, (H - h) // 2), g)
    og.save(os.path.join(PUB, "og-image.png"), "PNG", optimize=True)
    print(f"  og-image.png                                {W}x{H}")

    # Copy the source in, so the build is reproducible.
    mark_src = os.path.join(PUB, "logo-source.png")
    if os.path.abspath(src) != os.path.abspath(mark_src):
        Image.open(src).convert("RGBA").save(mark_src)
        print(f"\nsource copied to public/logo-source.png")

    print("\ndone")


if __name__ == "__main__":
    main()
