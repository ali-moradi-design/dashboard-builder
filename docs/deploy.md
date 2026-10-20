# Deploy

The app is a static site (roadmap phase 7). `pnpm build` writes `dist/`; CI
can rsync it to `/srv/static/dashboard-builder` on the VPS.

## Nginx

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name dashboard.ali-moradi-develop.com;
    root /srv/static/dashboard-builder;

    # Single-page app: unknown paths serve index.html.
    location / {
        try_files $uri /index.html;
        add_header Cache-Control "no-cache";
    }

    # Hashed build output (JS, CSS, fonts, DuckDB worker and wasm).
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Sample datasets: not hashed, so a long but not immutable cache.
    location /data/ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    # DuckDB-WASM is ~40 MB raw, ~8 MB gzip: compress it.
    gzip on;
    gzip_types application/javascript text/css application/json application/wasm image/svg+xml;
    types {
        application/wasm wasm;
    }
}
```

Always `nginx -t` before `systemctl reload nginx`. The certificate comes from
certbot (`--nginx`).

## Notes

- The app needs no server: queries run in the browser (DuckDB-WASM in a Web
  Worker), dashboards are kept in IndexedDB, and imported CSV files never
  leave the browser.
- No cross-origin isolation headers are needed (the single-threaded DuckDB
  bundles are used).
- To regenerate the sample data: `pnpm data`.
