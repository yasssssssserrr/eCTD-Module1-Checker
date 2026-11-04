/* Shows the data notice once per browser session and requires acknowledgement. */
(function attachNotice(global) {
  'use strict';
  const KEY = 'ectd-notice-acknowledged';
  const dialog = global.document.getElementById('dataNotice');
  const checkbox = global.document.getElementById('dataNoticeAccept');

  function acknowledged() {
    try { return global.sessionStorage.getItem(KEY) === '1'; } catch { return false; }
  }

  if (acknowledged()) return;

  function open() {
    dialog.showModal();
    // Focus lands on the checkbox; small screens must still start at the heading.
    // WebKit scrolls to the focused element after this task, so reset on the next frame too.
    dialog.scrollTop = 0;
    global.requestAnimationFrame(() => { dialog.scrollTop = 0; });
  }

  // Browsers ignore a cancelled `cancel` event on repeated Escape, so stop the key itself.
  dialog.addEventListener('keydown', event => { if (event.key === 'Escape') event.preventDefault(); });
  // Other close requests, such as the Android back gesture, cannot be blocked.
  dialog.addEventListener('close', () => { if (!checkbox.checked) open(); });
  checkbox.addEventListener('change', () => {
    if (!checkbox.checked) return;
    try { global.sessionStorage.setItem(KEY, '1'); } catch { /* The notice returns on the next load. */ }
    dialog.close();
  });
  open();
})(globalThis);
