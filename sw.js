// BESD Online Field Register — service worker (v3).
// - app.html (the app page downloaded from the server) is served from the phone: opens instantly, works offline.
// - The shell files (this wrapper, config, icons) are served from the phone and refreshed in the background.
// - Google web fonts are kept on the phone too. Server calls (script.google.com) are never touched here.
var SHELL_CACHE = 'besd-shell-v3';
var UI_CACHE = 'besd-ui';          // written by shell.js; never deleted on update
var FONT_CACHE = 'besd-fonts';
var SHELL = ['./', 'index.html', 'config.js', 'shell.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL_CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  var keep = [SHELL_CACHE, UI_CACHE, FONT_CACHE];
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return keep.indexOf(k) < 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function staleWhileRevalidate(cacheName, req, opts) {
  return caches.open(cacheName).then(function (c) {
    return c.match(req, opts).then(function (hit) {
      var net = fetch(req).then(function (r) { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; });
      if (hit) { net.catch(function () {}); return hit; }
      return net;
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (/\/app\.html$/.test(url.pathname)) {
      e.respondWith(caches.open(UI_CACHE).then(function (c) { return c.match(new URL('app.html', self.registration.scope).href); })
        .then(function (hit) { return hit || fetch(req); }));
      return;
    }
    if (/\/app-version$/.test(url.pathname)) return;
    e.respondWith(staleWhileRevalidate(SHELL_CACHE, req, { ignoreSearch: true }).catch(function () {
      return caches.match('index.html');
    }));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(staleWhileRevalidate(FONT_CACHE, req).catch(function () { return new Response('', { status: 504 }); }));
  }
});
