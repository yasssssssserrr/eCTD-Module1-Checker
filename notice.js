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
  dialog.addEventListener('cancel', event => event.preventDefault());
  checkbox.addEventListener('change', () => {
    if (!checkbox.checked) return;
    try { global.sessionStorage.setItem(KEY, '1'); } catch { /* The notice returns on the next load. */ }
    dialog.close();
  });
  dialog.showModal();
  // Focus lands on the checkbox; small screens must still start at the heading.
  dialog.scrollTop = 0;
})(globalThis);
