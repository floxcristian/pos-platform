"""Render the repository's geometric app mark into the PNG/ICO sizes Tauri uses."""
from pathlib import Path
from PIL import Image, ImageDraw

icon_dir = Path(__file__).resolve().parent / "src-tauri" / "icons"
canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
draw = ImageDraw.Draw(canvas)
draw.rounded_rectangle((0, 0, 1023, 1023), radius=208, fill="#006db6")
for left, top, color in [(48, 48, "#ffffff"), (140, 48, "#ffffff"), (48, 140, "#ffffff"), (140, 140, "#00937f")]:
    draw.rounded_rectangle((left * 4, top * 4, (left + 68) * 4, (top + 68) * 4), radius=48, fill=color)
for size, filename in [(32, "32x32.png"), (128, "128x128.png"), (256, "128x128@2x.png")]:
    canvas.resize((size, size), Image.Resampling.LANCZOS).save(icon_dir / filename)
canvas.resize((256, 256), Image.Resampling.LANCZOS).save(icon_dir / "icon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
