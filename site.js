/* Max marketing site: platform detection and release resolution. */
(() => {
  const REPO = 'omar-Suleiman14/max';
  const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;
  const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
  const CACHE_KEY = 'max:latest-release';

  /* Shipped with the page so every button holds a direct installer link before
     the API answers, and still holds one if it never does. Bump on release. */
  const SHIPPED = {
    tag_name: 'v0.4.3',
    assets: [
      'Max-0.4.3.Setup.exe',
      'Max-darwin-arm64-0.4.3.zip',
      'max-shop-os_0.4.3_amd64.deb',
      'com.maxshop.Max_stable_x86_64.flatpak',
    ].map((name) => ({ name, browser_download_url: `https://github.com/${REPO}/releases/download/v0.4.3/${name}` })),
  };

  const PATTERNS = {
    windows: /\.exe$/i,
    mac: /(darwin|mac).*\.(zip|dmg)$/i,
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

  const findAsset = (release, kind) => (release.assets ?? []).find((asset) => PATTERNS[kind].test(asset.name));

  const apply = (release) => {
    if (!release) return;

    if (release.tag_name) {
      document.querySelectorAll('[data-version]').forEach((node) => {
        node.textContent = release.tag_name;
      });
    }

    const asset = platform ? findAsset(release, platform) : null;
    document.querySelectorAll('[data-download]').forEach((button) => {
      if (!asset) return;
      button.href = asset.browser_download_url;
      button.setAttribute('download', '');
    });

    document.querySelectorAll('[data-asset]').forEach((row) => {
      const match = findAsset(release, row.dataset.asset);
      const link = row.querySelector('[data-asset-link]');
      const meta = row.querySelector('[data-asset-meta]');
      if (!match || !link) return;
      link.href = match.browser_download_url;
      link.setAttribute('download', '');
      if (meta) meta.textContent = match.size ? `${match.name}, ${formatSize(match.size)}` : match.name;
    });
  };

  apply(SHIPPED);
  apply(readCache());

  fetch(API_URL, { headers: { Accept: 'application/vnd.github+json' } })
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
    .then((release) => {
      const trimmed = {
        tag_name: release.tag_name,
        assets: (release.assets ?? []).map(({ name, size, browser_download_url }) => ({ name, size, browser_download_url })),
      };
      if (!trimmed.assets.length) return;
      writeCache(trimmed);
      apply(trimmed);
    })
    .catch(() => {
      /* Rate limited or offline: the shipped release links are already in place. */
      document.querySelectorAll('[data-asset-link]').forEach((link) => {
        if (!link.getAttribute('href')) link.href = RELEASES_URL;
      });
    });
})();
