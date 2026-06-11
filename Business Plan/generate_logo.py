from PIL import Image, ImageDraw, ImageFont
import os, math

OUTPUT_DIR = r"Z:\GIT\Cursor\youtube-transcriber\static"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Sizes to export ───────────────────────────────────────────────────────────
SIZES = {
    "logo_full":    (600, 120),   # wide banner (docs, PDF header)
    "logo_square":  (256, 256),   # square icon (favicon, app icon)
    "logo_2x":      (1200, 240),  # retina banner
}

# ── Brand colours ─────────────────────────────────────────────────────────────
BG      = (15,  15,  15)       # #0f0f0f
RED     = (229, 57,  53)       # #E53935
WHITE   = (232, 232, 232)      # #e8e8e8
GREY    = (136, 136, 136)      # #888

def find_font(size, bold=False):
    """Try common system font paths, fall back to default."""
    candidates = []
    if bold:
        candidates = [
            r"C:\Windows\Fonts\arialbd.ttf",
            r"C:\Windows\Fonts\segoeuib.ttf",
            r"C:\Windows\Fonts\calibrib.ttf",
        ]
    else:
        candidates = [
            r"C:\Windows\Fonts\arial.ttf",
            r"C:\Windows\Fonts\segoeui.ttf",
            r"C:\Windows\Fonts\calibri.ttf",
        ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_play_triangle(draw, cx, cy, r, color):
    """Draw a filled play triangle centred at cx,cy with radius r."""
    # Equilateral-ish triangle pointing right
    pts = [
        (cx - r * 0.45, cy - r * 0.58),
        (cx - r * 0.45, cy + r * 0.58),
        (cx + r * 0.65, cy),
    ]
    draw.polygon(pts, fill=color)


def make_banner(w, h):
    img  = Image.new("RGB", (w, h), BG)
    draw = ImageDraw.Draw(img)

    pad   = int(h * 0.12)
    icon_r = int(h * 0.36)
    icon_cx = pad + icon_r + int(h * 0.04)
    icon_cy = h // 2

    # Red rounded-rect background for icon
    rect_x0 = icon_cx - icon_r - 4
    rect_y0 = icon_cy - icon_r - 2
    rect_x1 = icon_cx + icon_r + 4
    rect_y1 = icon_cy + icon_r + 2
    corner   = icon_r // 3
    draw.rounded_rectangle([rect_x0, rect_y0, rect_x1, rect_y1], radius=corner, fill=RED)

    # White play triangle
    draw_play_triangle(draw, icon_cx, icon_cy, icon_r, WHITE)

    # "YT Transcriber" text
    text_x = rect_x1 + int(h * 0.18)
    font_main = find_font(int(h * 0.48), bold=True)
    font_sub  = find_font(int(h * 0.22), bold=False)

    draw.text((text_x, int(h * 0.10)), "YT Transcriber", font=font_main, fill=WHITE)

    # Tagline
    draw.text((text_x + 3, int(h * 0.66)), "YouTube Transcript Tool", font=font_sub, fill=GREY)

    return img


def make_square(size):
    img  = Image.new("RGB", (size, size), BG)
    draw = ImageDraw.Draw(img)

    cx, cy = size // 2, size // 2
    r = int(size * 0.34)

    # Red rounded square
    pad = int(size * 0.08)
    draw.rounded_rectangle([pad, pad, size - pad, size - pad],
                            radius=int(size * 0.18), fill=RED)

    # White play triangle
    draw_play_triangle(draw, cx, cy, r, WHITE)

    # "YT" below in small text
    font = find_font(int(size * 0.14), bold=True)
    bbox = draw.textbbox((0, 0), "YT", font=font)
    tw = bbox[2] - bbox[0]
    draw.text(((size - tw) // 2, int(size * 0.78)), "YT", font=font, fill=GREY)

    return img


# ── Generate & save ───────────────────────────────────────────────────────────
banner     = make_banner(*SIZES["logo_full"])
banner_2x  = make_banner(*SIZES["logo_2x"])
square     = make_square(SIZES["logo_square"][0])

for name, img in [("logo_full.jpg", banner), ("logo_full@2x.jpg", banner_2x), ("logo_square.jpg", square)]:
    path = os.path.join(OUTPUT_DIR, name)
    img.save(path, "JPEG", quality=95)
    print(f"Saved: {path}  ({img.size[0]}x{img.size[1]})")

# Also save a copy at the root of youtube-transcriber for easy access
banner.save(r"Z:\GIT\Cursor\youtube-transcriber\logo_full.jpg", "JPEG", quality=95)
banner_2x.save(r"Z:\GIT\Cursor\youtube-transcriber\logo_full@2x.jpg", "JPEG", quality=95)
square.save(r"Z:\GIT\Cursor\youtube-transcriber\logo_square.jpg", "JPEG", quality=95)
print("\nAlso saved copies to root of youtube-transcriber/")
