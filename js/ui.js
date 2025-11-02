// UI helpers for mobile navigation (hamburger + drawer)
// Injects a menu button into the header on small screens and toggles the sidebar.

(function () {
  // ===================== DEMO SESSION (optional) =====================
  // If the URL has ?demo=1, auto-create a local session so pages don't redirect to login
  function ensureDemoSession() {
    try {
      const params = new URLSearchParams(window.location.search);
      const isDemo = params.get('demo');
      if ((isDemo === '1' || isDemo === 'true') && localStorage.getItem('petCareSessionActive') !== 'true') {
        localStorage.setItem('petCareSessionActive', 'true');
        localStorage.setItem('petCareUsername', 'demo');
        localStorage.setItem('petCareUserRole', 'admin');
      }
    } catch {}
  }

  // ===================== THEME TOGGLE =====================
  function getStoredTheme() {
    try { return localStorage.getItem('petcare-theme'); } catch { return null; }
  }

  function storeTheme(theme) {
    try { localStorage.setItem('petcare-theme', theme); } catch {}
  }

  function getPreferredTheme() {
    const stored = getStoredTheme();
    // Default explicitly to light unless the user chose dark before
    if (stored === 'dark' || stored === 'light') return stored;
    return 'light';
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      document.body.setAttribute('data-theme', 'light');
    }
  }

  function createThemeButton(current) {
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Cambiar tema');
    btn.setAttribute('title', 'Cambiar tema');
    btn.innerHTML = current === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    return btn;
  }

  function initTheme() {
    const initial = getPreferredTheme();
    applyTheme(initial);
    let btn = document.querySelector('.theme-toggle');
    if (!btn) {
      btn = createThemeButton(initial);
      document.body.appendChild(btn);
    }
    const updateIcon = (theme) => {
      btn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    };
    btn.addEventListener('click', () => {
      const next = (document.body.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
      applyTheme(next);
      storeTheme(next);
      updateIcon(next);
    });
  }

  function createMenuButton() {
    const btn = document.createElement('button');
    btn.className = 'menu-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Abrir menú de navegación');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    return btn;
  }

  function ensureBackdrop() {
    let backdrop = document.querySelector('.backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
    }
    return backdrop;
  }

  function openNav(btns, sidebar, backdrop) {
    document.body.classList.add('nav-open');
    btns.forEach(b => b.setAttribute('aria-expanded', 'true'));
    if (sidebar) sidebar.setAttribute('aria-hidden', 'false');
    if (backdrop) backdrop.style.display = 'block';
  }

  function closeNav(btns, sidebar, backdrop) {
    document.body.classList.remove('nav-open');
    btns.forEach(b => b.setAttribute('aria-expanded', 'false'));
    if (sidebar) sidebar.setAttribute('aria-hidden', 'true');
    if (backdrop) backdrop.style.display = '';
  }

  function initMobileNav() {
    const header = document.querySelector('.header');
    const sidebar = document.querySelector('.sidebar');
    if (!header || !sidebar) return; // nothing to do on pages without sidebar

    // Ensure button exists (inject if missing)
    let existingBtn = header.querySelector('.menu-toggle');
    if (!existingBtn) {
      const btn = createMenuButton();
      const headerLeft = header.querySelector('.header-left');
      if (headerLeft) {
        headerLeft.insertBefore(btn, headerLeft.firstChild);
      } else {
        header.insertBefore(btn, header.firstChild);
      }
    }

    // Ensure backdrop exists
    const backdrop = ensureBackdrop();

    const buttons = Array.from(document.querySelectorAll('.menu-toggle'));

    const toggle = () => {
      const isOpen = document.body.classList.contains('nav-open');
      if (isOpen) {
        closeNav(buttons, sidebar, backdrop);
      } else {
        openNav(buttons, sidebar, backdrop);
        // Move focus to sidebar for accessibility
        const firstLink = sidebar.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
        if (firstLink) firstLink.focus();
      }
    };

    // Bind events
    buttons.forEach(btn => btn.addEventListener('click', toggle));
    backdrop.addEventListener('click', () => closeNav(buttons, sidebar, backdrop));

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeNav(buttons, sidebar, backdrop);
      }
    });

    // Close when navigating via sidebar links (for single-page feel)
    sidebar.addEventListener('click', (e) => {
      const target = e.target;
      if (target && (target.tagName === 'A' || target.closest('a'))) {
        closeNav(buttons, sidebar, backdrop);
      }
    });
  }

  // ===================== PROPAGATE QUERY PARAMS (demo, apiBase) =====================
  function propagateQueryParams() {
    let params;
    try { params = new URLSearchParams(window.location.search); } catch { return; }
    const keep = {};
    const demo = params.get('demo');
    const apiBase = params.get('apiBase');
    if (demo) keep.demo = demo;
    if (apiBase) keep.apiBase = apiBase;
    const keys = Object.keys(keep);
    if (!keys.length) return;

    const qs = new URLSearchParams();
    keys.forEach(k => qs.set(k, keep[k]));
    const qsStr = '?' + qs.toString();

    // Append to internal links
    document.querySelectorAll('a[href$=".html"]').forEach(a => {
      try {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('http')) return;
        // Already has query?
        if (href.includes('?')) {
          // merge only missing keys
          const [path, existing] = href.split('?');
          const existingParams = new URLSearchParams(existing);
          keys.forEach(k => { if (!existingParams.has(k)) existingParams.set(k, keep[k]); });
          a.setAttribute('href', path + '?' + existingParams.toString());
        } else {
          a.setAttribute('href', href + qsStr);
        }
      } catch {}
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { ensureDemoSession(); initTheme(); initMobileNav(); propagateQueryParams(); });
  } else {
    ensureDemoSession();
    initTheme();
    initMobileNav();
    propagateQueryParams();
  }
})();
