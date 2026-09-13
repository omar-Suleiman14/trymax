/* Max marketing site: PostHog. Pageviews, autocapture and session replay are
   left to PostHog; the handwritten events below are only the ones that answer
   "did this visitor end up wanting Max", which no generic capture can infer. */
(() => {
  /* A PostHog project key is public: it can only write events. Paste yours here.
     EU projects use https://eu.i.posthog.com and https://eu.posthog.com. */
  const PROJECT_KEY = 'phc_vK9NyztcSWk5XUrBVtNDfkthfFYouJkQt59VHxqD9j8t';
  const API_HOST = 'https://us.i.posthog.com';
  const UI_HOST = 'https://us.posthog.com';

  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  if (!PROJECT_KEY.startsWith('phc_') || PROJECT_KEY.includes('REPLACE') || LOCAL) return;

  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],Object.defineProperty(u,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e}}),Object.defineProperty(u.people,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+".people (stub)"}}),o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  const posthog = window.posthog;
  posthog.init(PROJECT_KEY, {
    api_host: API_HOST,
    ui_host: UI_HOST,
    defaults: '2026-05-30',
    /* Max keeps a workspace on the visitor's own computer, so the site does not
       get to argue with a browser that has already asked not to be tracked. */
    respect_dnt: true,
    /* Nobody signs in here, so every visitor is anonymous and person profiles
       would only cost money without answering anything. */
    person_profiles: 'identified_only',
    /* Replay also has to be switched on in the project settings. The site has no
       forms, and masking stays on so a future one is covered by default. */
    session_recording: { maskAllInputs: true },
  });

  const PLATFORMS = { win: 'windows', mac: 'mac', linux: 'linux' };

  /* Sections already carry the ids the copy is organised by, so a click can say
     where on the page it came from without any extra markup. */
  const locationOf = (node) => {
    if (node.closest('.nav')) return 'nav';
    if (node.closest('.footer')) return 'footer';
    if (node.closest('.hero')) return 'hero';
    if (node.closest('.dl-row')) return 'download-page-row';
    if (node.closest('.doc')) return 'download-page';
    return node.closest('section[id]')?.id ?? 'page';
  };

  /* site.js fills these from the release, so a click after it resolves carries
     the version that was actually downloaded. */
  const version = () => {
    const text = document.querySelector('[data-version]')?.textContent?.trim();
    return /^v?\d/.test(text ?? '') ? text : null;
  };

  const githubDestination = (url) => {
    const path = url.pathname.replace(/^\/omar-Suleiman14\/max/, '');
    if (path.startsWith('/releases')) return 'releases';
    if (path.startsWith('/fork')) return 'fork';
    if (/LICENSE/i.test(path)) return 'license';
    return path === '' || path === '/' ? 'repo' : path;
  };

  document.addEventListener('click', (event) => {
    const node = event.target.closest('a[href]');
    if (!node || event.button !== 0) return;

    const where = locationOf(node);
    const download = node.matches('[data-download], [data-asset-link]') && node.dataset.resolved === 'true';

    if (download) {
      const row = node.closest('[data-asset]');
      const asset = row?.dataset.asset ?? PLATFORMS[document.documentElement.dataset.platform] ?? 'unknown';
      /* A row on the download page is a platform the visitor picked; a button
         anywhere else is the platform site.js guessed for them. */
      if (row) posthog.capture('download_platform_selected', { platform: asset, location: where });
      posthog.capture('download_clicked', {
        platform: asset === 'flatpak' ? 'linux' : asset,
        asset,
        platform_source: row ? 'chosen' : 'detected',
        location: where,
        version: version(),
      });
      return;
    }

    let url;
    try {
      url = new URL(node.href, location.href);
    } catch {
      return;
    }

    if (url.hostname === 'github.com') {
      posthog.capture('github_clicked', { destination: githubDestination(url), location: where });
      return;
    }

    /* Everything else worth naming is a same-site CTA: the two routes to the
       download page, and any button added to a section later. */
    if (url.origin === location.origin && node.matches('.btn, .nav-link, .footer-links a, .hero-platform-line a')) {
      posthog.capture('cta_clicked', {
        label: node.textContent.trim().replace(/\s+/g, ' '),
        href: url.pathname,
        location: where,
      });
    }
  });
})();
