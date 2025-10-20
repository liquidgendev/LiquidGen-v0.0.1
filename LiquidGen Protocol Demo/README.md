LiquidGen — Demo landing page

Quick steps to run this demo locally (development-only, no build required):

1. Open the file `index.html` in your browser. On Windows you can right-click the file and choose "Open with" your browser.

2. (Optional, recommended) Run a simple local static server to avoid clipboard or module issues when opening via file://

   In PowerShell you can run a one-liner if you have Python installed:

   ```powershell
   python -m http.server 8000;
   # then open http://localhost:8000 in your browser
   ```

Notes:
- This demo uses CDN builds of React, Recharts and Tailwind and Babel in the browser. It's meant for quick preview only, not production.
- The original single-file React component `liquid_gen_landing_page_react_single_file.jsx` is included in the repo; `index.html` inlines an adapted version so it can run without a build step.

If you want me to scaffold a proper npm project with a build step and dev server (fast refresh, proper production bundling), tell me and I'll add package.json, install dependencies, and wire up scripts.
