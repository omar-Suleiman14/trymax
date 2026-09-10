# Max marketing site

A static site: two HTML pages, one stylesheet, one script. There is no build
step and no framework, so the deployed output is exactly what is in this
directory.

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

Before the API answers, and if it never does, the buttons use the release
pinned in the `SHIPPED` constant at the top of `site.js`, so a visitor always
gets a direct installer link rather than the releases page. Bump that constant
when a release changes the asset filenames.

The version shown in the nav and in the open-source panel is filled from the
same release, so publishing a release is the only step needed to update it.
