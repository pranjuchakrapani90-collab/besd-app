/* BESD Online Field Register — installed-app shell (v4).
 * The app page itself (besd-ui-vX.Y.html from the Drive folder) is downloaded once from the Apps Script web app
 * and kept on the phone, so the app opens instantly and also with no network. This file is loaded at the top
 * of that page. It tells the page to talk to the server directly (fetch) and looks for a newer page in the
 * background; a newer page is used from the next opening (or at once, by tapping the "Update ready" bar). */
(function () {
  var EXEC = window.BESD_APP_URL || '';
  var UI_CACHE = 'besd-ui';
  var KEY_PAGE = new URL('app.html', location.href).href;
  var KEY_VER = new URL('app-version', location.href).href;

  window.BESD_SHELL = { exec: EXEC, shell: 4 };
  /* install tags: without the manifest link on the page Chrome says "This app cannot be installed" */
  window.BESD_INSTALL_TAGS = '<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#111a2e">' +
    '<link rel="icon" href="icons/icon-192.png"><link rel="apple-touch-icon" href="icons/apple-touch-icon.png">';

  /* store a downloaded page; config.js + shell.js are put at the very top of its <head> */
  window.BESD_STORE_UI = function (name, html) {
    var inject = '<script src="config.js"></scr' + 'ipt><script src="shell.js"></scr' + 'ipt>';
    if (!/rel=["']?manifest/i.test(html)) inject += window.BESD_INSTALL_TAGS;
    var page = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, function (m) { return m + inject; }) : inject + html;
    return caches.open(UI_CACHE).then(function (c) {
      return Promise.all([
        c.put(KEY_PAGE, new Response(page, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })),
        c.put(KEY_VER, new Response(String(name || ''), { headers: { 'Content-Type': 'text/plain' } }))
      ]);
    });
  };
  window.BESD_FETCH_UI = function () {
    return fetch(EXEC + '?raw=ui&t=' + Date.now(), { credentials: 'omit', redirect: 'follow' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { if (!j || !j.html) throw new Error('No page in reply'); return window.BESD_STORE_UI(j.name, j.html).then(function () { return j.name; }); });
  };

  if (!/\/app\.html$/.test(location.pathname)) return;   // the rest is only for the app page

  function bar(text, onTap) {
    var b = document.getElementById('besdUpd');
    if (!b) {
      b = document.createElement('button'); b.id = 'besdUpd';
      b.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:84px;z-index:70;border:0;border-radius:999px;' +
        'background:#1d4ed8;color:#fff;font:600 14px system-ui,sans-serif;padding:10px 18px;box-shadow:0 4px 14px #0004';
      document.body.appendChild(b);
    }
    b.textContent = text; b.onclick = onTap;
  }
  var checking = false;
  function check() {
    if (checking || navigator.onLine === false || !EXEC) return;
    checking = true;
    caches.open(UI_CACHE).then(function (c) { return c.match(KEY_VER); }).then(function (r) { return r ? r.text() : ''; }).then(function (cur) {
      return fetch(EXEC + '?raw=ver&t=' + Date.now(), { credentials: 'omit', redirect: 'follow' }).then(function (r) { return r.json(); }).then(function (v) {
        if (!v || !v.ui || v.ui === cur) return;
        return window.BESD_FETCH_UI().then(function () {
          bar('Update ready — tap to load it', function () {
            if (document.querySelector('.modal') || document.querySelector('.sticky-foot')) { if (!confirm('A form is open. Load the update now? Unsaved typing on this screen will be lost.')) return; }
            location.reload();
          });
        });
      });
    }).catch(function () {}).then(function () { checking = false; });
  }
  window.addEventListener('load', function () { setTimeout(check, 8000); });
  window.addEventListener('online', function () { setTimeout(check, 3000); });
  setInterval(check, 30 * 60 * 1000);
})();
