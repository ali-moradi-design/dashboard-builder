# Deploy

Live at https://dashboard-builder.ali-moradi-develop.com (one VPS, Nginx on the
host). The app needs no server: queries run in the browser (DuckDB-WASM in a
Web Worker), dashboards are kept in IndexedDB, and imported CSV files never
leave the browser.

## How it runs

- `Dockerfile`: Node builds `dist/` and gzips the large files once
  (DuckDB's wasm: ~36 MB raw, ~8 MB gzip). The final image holds only `dist/`
  and the Nginx config in `nginx-unprivileged` (uid 101, port 8080, ~5 MB RAM).
- `nginx/default.conf`: single-page app fallback, `gzip_static` (sends the
  `.gz` copies), `/assets/` immutable for a year, `/data/` 30 days,
  `index.html` no-cache, GET/HEAD only, `/healthz`.
- `nginx/security-headers.conf`: CSP and the other headers, included in every
  location. DuckDB needs `'wasm-unsafe-eval'` and downloads its parquet
  extension from `https://extensions.duckdb.org` on first use.
- `.github/workflows/docker.yml`: after CI passed on `main`, builds
  `ghcr.io/ali-moradi-design/dashboard-builder-web:<sha>`; deploy-kit's
  `deploy-app.yml` then makes the server pull it and restart (rolled back
  when not healthy) and checks a few paths through Nginx.
- `deploy/compose.yaml`: `/srv/apps/dashboard-builder/compose.yaml` on the
  server, port `127.0.0.1:3113`, read-only, 64 MB.
- `deploy/nginx.conf`: the host's site file (certbot adds TLS).

Always `nginx -t` before `systemctl reload nginx`.

## Notes

- No cross-origin isolation headers are needed (the single-threaded DuckDB
  bundles are used).
- To regenerate the sample data: `pnpm data` (writes `public/data/`).
