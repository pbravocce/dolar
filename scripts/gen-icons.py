"""Genera icon-192.png e icon-512.png para la PWA."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public")


def find_font():
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/seguib.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return None


def make(size: int):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Fondo redondeado verde
    radius = int(size * 0.22)
    d.rounded_rectangle([0, 0, size, size], radius=radius, fill=(4, 120, 87, 255))
    # Símbolo $
    font_path = find_font()
    font = None
    if font_path:
        font = ImageFont.truetype(font_path, int(size * 0.62))
    text = "$"
    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1] - int(size * 0.03)
    d.text((x, y), text, font=font, fill=(255, 255, 255, 255))
    img.save(os.path.join(OUT, f"icon-{size}.png"))


if __name__ == "__main__":
    make(192)
    make(512)
    print("Iconos generados en", OUT)