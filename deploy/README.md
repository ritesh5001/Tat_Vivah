# Phase 1 Infra Baseline

This folder contains production baseline config for high-throughput deployment.

## 1) PM2 cluster processes

```bash
pm2 start deploy/pm2/ecosystem.config.cjs
pm2 save
pm2 startup
```

Apps started:
- Frontend (Next.js) on port `3000` in cluster mode
- Backend API on port `4000` in cluster mode
- Worker in fork mode (`1` instance)

Note: in backend cluster mode, only PM2 instance 0 runs scheduled background jobs by default to avoid duplicate cleanup/integrity tasks.

## 2) Nginx reverse proxy + cache/compression

```bash
sudo cp deploy/nginx/tatvivah.conf /etc/nginx/sites-available/tatvivah.conf
sudo ln -sf /etc/nginx/sites-available/tatvivah.conf /etc/nginx/sites-enabled/tatvivah.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 3) SSL (recommended)

Use certbot after DNS points to the server:

```bash
sudo certbot --nginx -d tatvivahtrends.com -d www.tatvivahtrends.com -d admin.tatvivahtrends.com -d seller.tatvivahtrends.com
```

## 4) Optional warmup ping

If backend can idle in your hosting plan, set these backend env vars:

- `BACKEND_WARMUP_URL=https://api.tatvivahtrends.com/health/live`
- `BACKEND_WARMUP_INTERVAL_MS=240000`

This triggers periodic lightweight warmup calls from the backend process itself.
