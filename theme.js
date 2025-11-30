const THEME_KEY = 'theme-preference';
const rootEl = document.documentElement;
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(theme) {
  rootEl.classList.remove('theme-light', 'theme-dark');
  const resolved = theme === 'dark' || theme === 'light' ? theme : (prefersDark.matches ? 'dark' : 'light');
  rootEl.classList.add(`theme-${resolved}`);
  localStorage.setItem(THEME_KEY, resolved);
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.textContent = resolved === 'dark' ? '☀️' : '🌙';
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}
