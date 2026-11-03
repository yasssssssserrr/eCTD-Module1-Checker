/* Applies the saved theme before first paint and connects the header switch. */
(function attachTheme(global) {
  'use strict';
  const KEY = 'ectd-theme';
  const COLORS = { light: '#ffffff', dark: '#0e1626' };
  const root = global.document.documentElement;
  const systemDark = global.matchMedia('(prefers-color-scheme: dark)');

  function savedTheme() {
    try {
      const value = global.localStorage.getItem(KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch { return null; }
  }

  function saveTheme(theme) {
    try { global.localStorage.setItem(KEY, theme); } catch { /* The switch still works until the page reloads. */ }
  }

  const currentTheme = () => root.dataset.theme || (systemDark.matches ? 'dark' : 'light');

  function applyTheme(theme) {
    root.classList.add('theme-changing');
    root.dataset.theme = theme;
    global.document.querySelectorAll('meta[name="theme-color"]').forEach(meta => { meta.content = COLORS[theme]; });
    // Every color changes in the same frame, so no control lags behind the page.
    global.requestAnimationFrame(() => global.requestAnimationFrame(() => root.classList.remove('theme-changing')));
  }

  function renderSwitch(button) {
    const theme = currentTheme();
    const label = theme === 'dark' ? 'Zum hellen Design wechseln' : 'Zum dunklen Design wechseln';
    button.dataset.current = theme;
    button.setAttribute('aria-label', label);
    button.title = label;
    global.document.getElementById('themeLabel').textContent = theme === 'dark' ? 'Hell' : 'Dunkel';
  }

  const initial = savedTheme();
  if (initial) applyTheme(initial);

  global.document.addEventListener('DOMContentLoaded', () => {
    const button = global.document.getElementById('themeToggle');
    if (initial) applyTheme(initial);
    renderSwitch(button);
    button.hidden = false;
    button.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      saveTheme(next);
      renderSwitch(button);
    });
    systemDark.addEventListener('change', () => renderSwitch(button));
  });
})(globalThis);
