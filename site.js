/* Max marketing site: platform detection and release resolution. */
(() => {
  const REPO = 'omar-Suleiman14/max';
  const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;
  const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
  const CACHE_KEY = 'max:latest-release';

  /* Electron Forge puts the version in three of the four filenames, so only the
     flatpak has a name that /releases/latest/download can resolve. Everything
     else is read from the API, and nothing here is ever pinned to a version. */
  const PATTERNS = {
    windows: /\.exe$/i,
    mac: /(?:^|[-_.])(?:arm64|aarch64)(?:[-_.].*)?\.dmg$/i,
    linux: /\.deb$/i,
    flatpak: /\.flatpak$/i,
  };

  const LABELS = { windows: 'Windows', mac: 'macOS', linux: 'Linux' };

  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const detectPlatform = () => {
    const hint = navigator.userAgentData?.platform ?? '';
    const source = `${hint} ${navigator.platform ?? ''} ${navigator.userAgent}`.toLowerCase();
    if (/android/.test(source)) return null;
    if (/iphone|ipad|ipod/.test(source)) return 'mac';
    if (/mac/.test(source)) return 'mac';
    if (/win/.test(source)) return 'windows';
    if (/linux|cros|x11/.test(source)) return 'linux';
    return null;
  };

  const platform = detectPlatform();
  if (platform) {
    document.documentElement.dataset.platform = platform === 'windows' ? 'win' : platform;
    document.querySelectorAll('[data-download-label]').forEach((label) => {
      label.textContent = `Download for ${LABELS[platform]}`;
    });
  }

  const formatSize = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  const readCache = () => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const writeCache = (release) => {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(release));
    } catch {
      /* Private browsing modes reject writes; the page works without the cache. */
    }
  };

  const findAsset = (release, kind) => (release?.assets ?? []).find((asset) => PATTERNS[kind].test(asset.name));

  const linkTo = (node, asset) => {
    node.href = asset.browser_download_url;
    node.setAttribute('download', '');
    node.dataset.resolved = 'true';
  };

  const apply = (release) => {
    if (!release) return;

    if (release.tag_name) {
      document.querySelectorAll('[data-version]').forEach((node) => {
        node.textContent = release.tag_name;
      });
    }

    const asset = platform ? findAsset(release, platform) : null;
    if (asset) document.querySelectorAll('[data-download]').forEach((button) => linkTo(button, asset));

    document.querySelectorAll('[data-asset]').forEach((row) => {
      const match = findAsset(release, row.dataset.asset);
      const link = row.querySelector('[data-asset-link]');
      const meta = row.querySelector('[data-asset-meta]');
      if (!match || !link) return;
      linkTo(link, match);
      if (meta) meta.textContent = match.size ? `${match.name}, ${formatSize(match.size)}` : match.name;
    });
  };

  /* The cached release is a session-old view of "latest", so it is only used to
     paint the page. The live request below is what any click waits on. */
  apply(readCache());

  const latest = fetch(API_URL, { headers: { Accept: 'application/vnd.github+json' } })
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
    .then((release) => {
      const trimmed = {
        tag_name: release.tag_name,
        assets: (release.assets ?? []).map(({ name, size, browser_download_url }) => ({ name, size, browser_download_url })),
      };
      if (!trimmed.assets.length) return null;
      writeCache(trimmed);
      apply(trimmed);
      return trimmed;
    })
    .catch(() => null);

  /* Until the release resolves, a button still points at /releases/latest, which
     is correct but is a page rather than a file. Clicking early holds the
     navigation for the request instead of sending the visitor to GitHub. */
  const resolveOnClick = (event) => {
    const node = event.target.closest('[data-download], [data-asset-link]');
    if (!node) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    const row = node.closest('[data-asset]');
    const kind = row ? row.dataset.asset : platform;
    node.classList.add('is-resolving');

    latest.then((release) => {
      node.classList.remove('is-resolving');
      const asset = kind ? findAsset(release, kind) : null;
      if (asset) linkTo(node, asset);
      window.location.href = asset ? asset.browser_download_url : RELEASES_URL;
    });
  };

  document.addEventListener('click', resolveOnClick);
})();
