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
| macOS | Apple silicon `*arm64*.dmg` or `*aarch64*.dmg` |
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

Mac downloads select the Apple silicon DMG, never the ZIP update archive or
an Intel installer. If it is missing, the button opens the latest release.

## Analytics

`analytics.js` loads PostHog and captures the handful of events that say whether
a visitor ended up wanting Max. The project and host it writes to are the two
constants at the top of the file:

```js
const PROJECT_KEY = 'phc_...';                  // public: it can only write events
const API_HOST = 'https://us.i.posthog.com';   // eu.i.posthog.com for an EU project
```

On `localhost` and `file://`, and if the key is ever replaced by a placeholder,
the script returns before loading anything, so local preview never writes to the
project.

Pageviews, clicks, referrers and UTM parameters are PostHog's job: autocapture
and Web Analytics record them without any code here. Session replay has to be
switched on in the project settings; inputs are masked, and the site has no
forms. Do Not Track is honoured: a browser that sends the header is not counted
at all, which undercounts traffic on purpose, because Max keeps a workspace on
the visitor's own computer and the site should not argue with that request.

These are the events the site sends itself:

| Event | Properties | Answers |
| --- | --- | --- |
| `download_clicked` | `platform`, `asset`, `platform_source`, `location`, `version` | The conversion. Which section sent people to a download, and which build they took |
| `download_platform_selected` | `platform`, `location` | Demand per platform, from the download page rows a visitor picked by hand |
| `github_clicked` | `destination`, `location` | Interest in the source: `repo`, `releases`, `fork` or `license` |
| `cta_clicked` | `label`, `href`, `location` | The non-download routes people take, mainly nav and footer links to `/download` |

`location` is the section a click came from, read from the ids already in the
markup: `hero`, `download` for the closing panel, `open`, `nav`, `footer`, or
`download-page-row` for a row on `/download`. `platform_source` separates a
detected platform, where the button offered a build, from a chosen one, where
the visitor picked a row. `asset` keeps `flatpak` distinct from `linux`, which
`platform` folds together. `version` is the release the buttons resolved to, so
downloads can be read per release.

One dashboard covers this: visitors and unique visitors, `download_clicked`
count, the ratio between them, top sources, `download_clicked` broken down by
`platform`, and top pages. The funnel worth watching is a pageview of `/` →
interest, meaning a `github_clicked` or a pageview of `/download` →
`download_clicked`.

`demo_clicked`, `pricing_viewed` and `contact_clicked` are not wired up because
the site has no demo, pricing or contact page yet.

## Tests

```sh
node --test tools/analytics.test.cjs tools/downloads.test.cjs
```
