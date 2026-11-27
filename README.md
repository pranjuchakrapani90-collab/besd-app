# BESD Online Field Register (installable app)

Installable Android app for the Bilasipara ESD field register. Data stays in the Google Sheet and Drive.

How it works (v3):
- The first time, the app page is downloaded from the Apps Script web app (`?raw=ui`, needs loader v2 in Code.gs) and kept on the phone. After that it opens instantly and works with no network.
- Server calls go directly to the web app (`doPost`, JSON). Data that was read is kept on the phone, so screens open offline; saves made offline wait in the outbox and are sent when the network returns.
- A newer page in the Drive folder "App versions (do not share)" is downloaded in the background and used from the next opening (or by tapping "Update ready").
- If the server still has the old loader, the app is shown live inside a frame as before.

Files: `index.html` (start), `shell.js` (offline shell), `sw.js` (service worker), `app.html` (fallback only), `config.js` (web app URL, must end in `/exec`).

Hosting: GitHub Pages → Deploy from branch → `main` / root. On Android: open the Pages link in Chrome → ⋮ → Install app.
