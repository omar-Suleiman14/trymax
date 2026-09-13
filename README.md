# Max marketing site

A static, two-page marketing site. The dark design, CSS motion, workspace graph
image and HTML form demo remain framework-free. There is no client-side router
or product-demo JavaScript bundle.

## Development and checks

Use Node.js 22 or later:

```sh
npm ci
npm run lint
npm run typecheck
npm run build
npm test
npm run preview
```

The preview runs at http://127.0.0.1:4173 and serves the production `dist/`
output, including clean URLs and real 404 responses. Typechecking covers
`site.js`, the browser platform/download logic. ESLint covers browser scripts
and build/test tools; tests cover downloads, analytics and generated SEO.

## Vercel deployment

Keep the existing Vercel project and domain. `vercel.json` configures
`npm run build`, output directory `dist`, clean URLs and no trailing slash.
Only public files are copied into the deployment. Source tools, tests,
configuration and dependencies are not served. No catch-all rewrite is used.

`site.config.cjs` is the sole editable canonical-origin and page-metadata
configuration. Run the build after changing it. The build updates the marked
SEO blocks in both root HTML pages, then copies them into `dist/`. It also
generates `robots.txt`, `sitemap.xml` and `site.webmanifest`. Do not hand-edit
generated metadata. Only `/` and `/download` are indexable page routes.

Set `GOOGLE_SITE_VERIFICATION` in the Vercel build environment (or set
`googleSiteVerification` in the configuration) to the exact Search Console
verification token, then rebuild/deploy. An empty value emits no verification
tag. Domain-property verification can instead use Google's DNS procedure.
After deployment, verify ownership and submit `/sitemap.xml` in Search Console.
No verification token has been supplied yet.

## Product copy

Workspace data stays locally on the computer. A blueprint is one portable
file containing structure/configuration, not all workspace records. A backup
is a complete restorable workspace copy. Keep those concepts distinct. The
primary copy intentionally avoids database-engine terminology.

## Downloads

`site.js` reads the public GitHub latest-release API. The current verified
release is v1.0.2, with these installers:

- Windows x64: `.exe`
- macOS Apple silicon: ARM64 `.dmg` (not the ZIP update archive)
- Linux Debian/Ubuntu x64: `_amd64.deb`
- Linux Flatpak x64: `x86_64.flatpak`

No version is pinned in the download implementation. Every primary CTA starts
as “Get Max for desktop” linking to `/download`. Only a successful live release
with a matching installer produces a platform-specific label. Windows links
directly to the installer. macOS and Linux link to the downloads page because
browser information cannot reliably identify Mac CPU architecture or Linux
distribution. All build choices remain visible on every device.

iPhone, iPad (including desktop mode), Android, ChromeOS and unknown systems
retain the generic CTA. Missing installers and API failures leave working
release-page links. There is no cached-release download, click interception,
or wait before navigation. The request times out after five seconds.

The downloads page labels the current architecture limits. Intel Macs and
mobile devices have no matching installers in the verified release. Additional
build formats/architectures require updating the choices, matching rules,
metadata and tests together. Recheck support copy when release targets change.

## Assets, accessibility and performance

The existing WebP graph (about 216 KB) is the hero image; the existing PNG
(about 423 KB) is the Open Graph and X card image. Both retain the established
product visual. Image dimensions reserve layout space. The hero is eager and
high-priority; footer branding is lazy. Google Fonts uses preconnect and
`display=swap`. Native fallback fonts remain available.

Existing icon files are preserved, with 192px/512px icons in the manifest.
Assets revalidate instead of keeping unversioned filenames immutable for a
year. The UI keeps its focus outlines and reduced-motion rules, adds a skip
link, increases dim-text contrast, and pauses the marquee on keyboard focus.
Reduced-motion users can scroll all marquee content without animation.

`tools/app-graph.html` and `tools/build-icons.py` remain the existing asset
sources. They are not part of public build output.

## Analytics

`analytics.js` retains the existing PostHog project and settings. Local previews
are excluded. Only resolved installer links count as `download_clicked`;
generic and build-choice CTAs count as navigation. Explicit installer choices
also emit `download_platform_selected`. GitHub source/release links and other
same-site CTAs retain their existing events. Do Not Track and input masking
remain enabled.
