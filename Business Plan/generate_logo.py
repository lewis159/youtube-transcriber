from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT_DIR = r"Z:\GIT\Cursor\new project\youtube-transcriber\static"
os.makedirs(OUTPUT_DIR, exist_ok=True)

SIZES = {
    "logo_full":   (600,  120),
    "logo_square": (256,  256),
    "logo_2x":     (1200, 240),
}

BG    = (15,  15,  15)
RED   = (229, 57,  53)
WHITE = (232, 232, 232)
GREY  = (136, 136, 136)
TRANS = (0, 0, 0, 0)        # fully transparent


def find_font(size, bold=False):
    candidates = (
        [r"C:\Windows\Fonts\arialbd.ttf",  r"C:\Windows\Fonts\segoeuib.ttf",  r"C:\Windows\Fonts\calibrib.ttf"]
        if bold else
        [r"C:\Windows\Fonts\arial.ttf",    r"C:\Windows\Fonts\segoeui.ttf",   r"C:\Windows\Fonts\calibri.ttf"]
    )
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_play_triangle(draw, cx, cy, r, color):
    pts = [
        (cx - r * 0.45, cy - r * 0.58),
        (cx - r * 0.45, cy + r * 0.58),
        (cx + r * 0.65, cy),
    ]
    draw.polygon(pts, fill=color)


def make_banner(w, h, transparent=False):
    mode = "RGBA" if transparent else "RGB"
    bg   = TRANS if transparent else BG
    img  = Image.new(mode, (w, h), bg)
    draw = ImageDraw.Draw(img)

    pad     = int(h * 0.12)
    icon_r  = int(h * 0.36)
    icon_cx = pad + icon_r + int(h * 0.04)
    icon_cy = h // 2

    rect_x0 = icon_cx - icon_r - 4
    rect_y0 = icon_cy - icon_r - 2
    rect_x1 = icon_cx + icon_r + 4
    rect_y1 = icon_cy + icon_r + 2
    draw.rounded_rectangle([rect_x0, rect_y0, rect_x1, rect_y1],
                            radius=icon_r // 3, fill=RED)
    draw_play_triangle(draw, icon_cx, icon_cy, icon_r, WHITE)

    text_x    = rect_x1 + int(h * 0.18)
    font_main = find_font(int(h * 0.48), bold=True)
    font_sub  = find_font(int(h * 0.22), bold=False)

    text_color = WHITE if not transparent else (232, 232, 232, 255)
    grey_color = GREY  if not transparent else (136, 136, 136, 255)

    draw.text((text_x, int(h * 0.10)), "YT Transcriber",      font=font_main, fill=text_color)
    draw.text((text_x + 3, int(h * 0.66)), "YouTube Transcript Tool", font=font_sub,  fill=grey_color)

    return img


def make_square(size, transparent=False):
    mode = "RGBA" if transparent else "RGB"
    bg   = TRANS if transparent else BG
    img  = Image.new(mode, (size, size), bg)
    draw = ImageDraw.Draw(img)

    cx, cy = size // 2, size // 2
    r       = int(size * 0.34)
    pad     = int(size * 0.08)

    draw.rounded_rectangle([pad, pad, size - pad, size - pad],
                            radius=int(size * 0.18), fill=RED)
    draw_play_triangle(draw, cx, cy, r, WHITE)

    font = find_font(int(size * 0.14), bold=True)
    bbox = draw.textbbox((0, 0), "YT", font=font)
    tw   = bbox[2] - bbox[0]
    grey_color = GREY if not transparent else (136, 136, 136, 255)
    draw.text(((size - tw) // 2, int(size * 0.78)), "YT", font=font, fill=grey_color)

    return img


# ── Build all variants ────────────────────────────────────────────────────────
variants = [
    # (filename,             image,                                    format,  kwargs)
    ("logo_full.jpg",        make_banner(*SIZES["logo_full"]),         "JPEG",  {"quality": 95}),
    ("logo_full@2x.jpg",     make_banner(*SIZES["logo_2x"]),           "JPEG",  {"quality": 95}),
    ("logo_square.jpg",      make_square(SIZES["logo_square"][0]),     "JPEG",  {"quality": 95}),
    ("logo_full.png",        make_banner(*SIZES["logo_full"],   transparent=True), "PNG", {}),
    ("logo_full@2x.png",     make_banner(*SIZES["logo_2x"],     transparent=True), "PNG", {}),
    ("logo_square.png",      make_square(SIZES["logo_square"][0], transparent=True), "PNG", {}),
]

saved = []
for filename, img, fmt, kwargs in variants:
    # static/ folder
    path = os.path.join(OUTPUT_DIR, filename)
    img.save(path, fmt, **kwargs)
    saved.append(path)

    # also copy to Business Plan folder for easy access
    bp_path = os.path.join(r"Z:\GIT\Cursor\new project\youtube-transcriber\business plan", filename)
    img.save(bp_path, fmt, **kwargs)

for p in saved:
    img_obj = Image.open(p)
    print(f"  {os.path.basename(p):30s}  {img_obj.size[0]}x{img_obj.size[1]}  {os.path.splitext(p)[1].upper()}")

print(f"\nAll saved to {OUTPUT_DIR}")
print(f"Copies also in Business Plan folder.")
