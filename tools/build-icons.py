"""Package the existing Max mark into centered, padded app/site icons.
Run with Python and Pillow: python tools/build-icons.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
mark = Image.open(ASSETS / 'max-mark.png').convert('RGBA')
# Keep the complete source square; fit before centering, never crop a wing.
def tile(size):
    result = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    inset = round(size * .08)
    fitted = mark.copy()
    fitted.thumbnail((size - inset * 2, size - inset * 2), Image.Resampling.LANCZOS)
    result.alpha_composite(fitted, ((size - fitted.width) // 2, (size - fitted.height) // 2))
    return result

for size in (32, 192, 512):
    tile(size).save(ASSETS / f'max-icon-{size}.png')
tile(180).save(ASSETS / 'apple-touch-icon.png')
tile(180).save(ROOT / 'apple-touch-icon.png')
for path in (ASSETS / 'favicon.ico', ASSETS / 'max-favicon.ico', ROOT / 'favicon.ico'):
    tile(256).save(path, sizes=[(s, s) for s in (16, 24, 32, 48, 64, 128, 256)])
print('Created complete, centered Max icons.')
