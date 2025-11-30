const THEME_KEY = 'theme-preference';
const rootEl = document.documentElement;
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

const sunIcon = '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"></line><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"></line><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"></line></g></svg>';
const moonIcon = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79z"></path></svg>';

function applyTheme(theme) {
  rootEl.classList.remove('theme-light', 'theme-dark');
  const resolved = theme === 'dark' || theme === 'light' ? theme : (prefersDark.matches ? 'dark' : 'light');
  rootEl.classList.add(`theme-${resolved}`);
  localStorage.setItem(THEME_KEY, resolved);
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.innerHTML = resolved === 'dark' ? sunIcon : moonIcon;
    toggle.setAttribute('aria-label', `Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`);
  }
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved);
  prefersDark.addEventListener('change', (e) => {
    const saved = localStorage.getItem(THEME_KEY);
    if (!saved) applyTheme(e.matches ? 'dark' : 'light');
  });
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = rootEl.classList.contains('theme-dark') ? 'dark' : 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }
  const homeBtn = document.querySelector('.home-toggle');
  if (homeBtn && window.location.pathname.includes('index.html')) {
    homeBtn.style.display = 'none';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}
