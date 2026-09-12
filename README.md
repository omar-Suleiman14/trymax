# Max marketing site

A static site: two HTML pages, one stylesheet, one script. There is no build
step and no framework, so the deployed output is exactly what is in this
directory. `tools/` holds the source of the hero image and is not linked from
anywhere in the site.

## Local preview

```sh
npx serve .
```

Any static file server works. `cleanUrls` is a Vercel setting, so locally the
download page is `/download.html`.

## Deploying to Vercel

Import this repository and set:

- Root directory: repo root
- Framework preset: Other
- Build command: none
- Output directory: leave empty

`vercel.json` turns on clean URLs so `/download` serves `download.html`, and
caches `/assets` for a year. The current domain is `trymax.vercel.app`; when
`trymax.sh` is attached, update the canonical and Open Graph URLs in
`index.html` and `download.html`.

## Images

`tools/app-graph.html` is the source of the hero image. It is a self-contained
mockup of the Max workspace map: a seeded layout, so re-rendering it produces
the same picture. Render and re-encode it with:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --hide-scrollbars --force-device-scale-factor=1.5 \
  --window-size=1440,900 --virtual-time-budget=6000 \
  --screenshot=/tmp/hero.png --allow-file-access-from-files \
  file://$PWD/tools/app-graph.html

cwebp -q 90 -m 6 /tmp/hero.png -o assets/app-graph.webp   # what the page loads
sips -Z 1200 /tmp/hero.png --out assets/app-graph.png     # what crawlers load
```

The page uses the WebP. The PNG stays because some social crawlers still do not
read WebP, and an Open Graph card is never shown wider than 1200px.

Favicons are built from the complete `assets/max-mark.png` with
`python tools/build-icons.py` (requires Pillow). The mark is centered on a transparent
square with padding. PNG icons are provided at 32, 192 and 512px, Apple touch
icons at 180px, and ICO files at 16–256px. Root `/favicon.ico` and
`/apple-touch-icon.png` also support clients that discover icons without HTML.

## Download buttons

`site.js` detects the visitor's platform, then reads the latest release from
`https://api.github.com/repos/omar-Suleiman14/max/releases/latest` and points
the button straight at the matching installer:

| Platform | Asset pattern |
| --- | --- |
| Windows | `*.exe` |
| macOS | `*darwin*.zip` or `*.dmg` |
| Debian | `*.deb` |
| Flatpak | `*.flatpak` |

No version is pinned anywhere in this repository. Until the request answers,
the buttons still point at `/releases/latest`, and clicking one holds the
navigation until the matching asset URL is known. If the request fails, the
click falls through to the releases page.

Electron Forge writes the version into three of the four filenames, so
`/releases/latest/download/<name>` only resolves for
`com.maxshop.Max_stable_x86_64.flatpak`. That row links there directly; the
other three need the API.

The version shown in the nav and in the open-source panel is filled from the
same release, so publishing a release is the only step needed to update it.
