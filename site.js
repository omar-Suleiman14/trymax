/* Max marketing site: enhance generic links only after a live release resolves. */
(() => {
  const RELEASES_URL = 'https://github.com/omar-Suleiman14/max/releases/latest';
  const API_URL = 'https://api.github.com/repos/omar-Suleiman14/max/releases/latest';
  const PATTERNS = {
    windows: /\.exe$/i,
    mac: /(?:^|[-_.])(?:arm64|aarch64)(?:[-_.].*)?\.dmg$/i,
    linux: /_amd64\.deb$/i,
    flatpak: /x86_64\.flatpak$/i,
  };
  const LABELS = { windows: 'Windows', mac: 'macOS', linux: 'Linux', flatpak: 'Linux (Flatpak)' };
  /** @typedef {keyof typeof PATTERNS} Platform */
  /** @typedef {{name: string, size?: number, browser_download_url: string}} Asset */
  /** @typedef {{tag_name?: string, assets?: Asset[]}} Release */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  /** @returns {Platform | null} */
  const detectPlatform = () => {
    const hints = /** @type {Navigator & {userAgentData?: {platform?: string, mobile?: boolean}}} */ (navigator).userAgentData;
    const source = `${hints?.platform ?? ''} ${navigator.platform ?? ''} ${navigator.userAgent ?? ''}`.toLowerCase();
    if (hints?.mobile || /android|iphone|ipad|ipod|mobile|cros|windows phone/.test(source)) return null;
    if (/mac/.test(source) && navigator.maxTouchPoints > 1) return null;
    if (/mac/.test(source)) return 'mac';
    if (/win/.test(source)) return 'windows';
    if (/linux/.test(source)) return 'linux';
    return null;
  };
  const platform = detectPlatform();
  /** @param {Release} release @param {Platform} kind */
  const findAsset = (release, kind) => (release.assets ?? []).find(asset =>
    PATTERNS[kind].test(asset.name) && asset.browser_download_url.startsWith('https://github.com/omar-Suleiman14/max/releases/download/'));
  /** @param {HTMLAnchorElement} node @param {Asset} asset */
  const linkTo = (node, asset) => {
    node.href = asset.browser_download_url;
    node.dataset.resolved = 'true';
  };
  /** @param {Release} release */
  const apply = (release) => {
    if (release.tag_name) document.querySelectorAll('[data-version]').forEach(node => { node.textContent = release.tag_name; });
    const asset = platform ? findAsset(release, platform) ?? (platform === 'linux' ? findAsset(release, 'flatpak') : null) : null;
    if (asset && platform) {
      document.documentElement.dataset.platform = platform === 'windows' ? 'win' : platform;
      document.querySelectorAll('[data-download-label]').forEach(node => { node.textContent = `Download for ${LABELS[platform]}`; });
      document.querySelectorAll('[data-download]').forEach(node => {
        if (!(node instanceof HTMLAnchorElement)) return;
        // Mac CPU architecture and Linux distro cannot be detected reliably.
        // Those visitors choose an explicitly labelled package on /download.
        if (platform === 'windows') linkTo(node, asset);
      });
    }
    document.querySelectorAll('[data-asset]').forEach(row => {
      if (!(row instanceof HTMLElement)) return;
      const kind = /** @type {Platform} */ (row.dataset.asset);
      const match = findAsset(release, kind);
      const link = row.querySelector('[data-asset-link]');
      const meta = row.querySelector('[data-asset-meta]');
      if (!(link instanceof HTMLAnchorElement)) return;
      if (!match) {
        link.href = RELEASES_URL;
        link.textContent = 'View release';
        if (meta) meta.textContent = 'No matching installer in the latest release.';
        return;
      }
      linkTo(link, match);
      link.textContent = 'Download';
      link.setAttribute('aria-label', `Download ${match.name}`);
      if (meta) meta.textContent = match.size ? `${match.name}, ${(match.size / 1024 / 1024).toFixed(1)} MB` : match.name;
    });
  };
  // Fallback links work immediately, even when GitHub fails or stalls.
  fetch(API_URL, { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(5000) })
    .then(response => { if (!response.ok) throw new Error(String(response.status)); return response.json(); })
    .then(apply)
    .catch(() => { /* Keep generic desktop and release-page links. */ });
})();
