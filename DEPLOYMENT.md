# SilentSOS Production Deployment & 24x7 High Availability Guide

This deployment guide covers the step-by-step instructions to configure, run, and maintain **SilentSOS** for **24x7 continuous uptime** in production environments.

---

## 1. High Availability Architecture Overview

- **Process Clustering**: Managed via PM2 ecosystem (`ecosystem.config.cjs`) utilizing all CPU cores with automatic process recovery (`autorestart: true`).
- **Zero-Downtime Reloads**: PM2 `pm2 reload ecosystem.config.cjs --env production` performs zero-downtime rolling updates.
- **Graceful Shutdown**: Intercepts `SIGTERM` and `SIGINT` to drain active HTTP requests, close WebSocket channels, and terminate DB connections without dropping requests.
- **Circuit Protection & Health Checks**: Exposed `/health` and `/ready` endpoints for Kubernetes / NGINX load balancer probes.
- **Storage & Database Failover**: Mongoose automatic retry connection loop with memory-backed schema fallback.

---

## 2. Prerequisites & Production Setup

1. **System Dependencies**:
   - Node.js `v18.x` or `v20.x` LTS
   - NPM `v9.x` or higher
   - PM2 Process Manager (`npm install -g pm2`)
   - NGINX Reverse Proxy (Optional, for SSL Termination)

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Edit .env and supply production credentials (JWT_SECRET, ENCRYPTION_KEY, MONGODB_URI)
   ```

3. **Install Dependencies & Build Project**:
   ```bash
   npm install --production=false
   npm run build
   ```

---

## 3. Running with PM2 (Cluster Mode)

To start SilentSOS under PM2 process manager control:

```bash
# Start cluster
pm2 start ecosystem.config.cjs --env production

# View active instances and status
pm2 status

# Tail live application logs
pm2 logs silent-sos-api

# Monitor real-time CPU & Memory usage
pm2 monit

# Save PM2 process list to restore on system reboot
pm2 save
pm2 startup
```

---

## 4. Zero-Downtime Deployment Command

To deploy code updates without dropping active emergency tracking sessions:

```bash
git pull origin main
npm install --production=false
npm run build
pm2 reload ecosystem.config.cjs --env production
```

---

## 5. Docker Production Container Deployment

Build and run using Docker:

```bash
# Build Docker image
docker build -t silent-sos-prod:1.0.0 .

# Run container with healthcheck
docker run -d \
  --name silent-sos-app \
  -p 5000:5000 \
  --env-file .env \
  --restart always \
  silent-sos-prod:1.0.0
```

---

## 6. Health & Readiness Monitoring Probes

| Endpoint | Probe Type | Purpose | Expected Code |
| :--- | :--- | :--- | :--- |
| `GET /health` | Liveness Probe | Verifies Node process and database responsiveness | `200 OK` |
| `GET /ready` | Readiness Probe | Verifies system readiness before receiving traffic | `200 OK` |

---

## 7. Emergency Maintenance & Log Inspection

- **Error Logs**: `logs/error.log`
- **Combined Logs**: `logs/combined.log`
- **PM2 Out Logs**: `logs/pm2-out.log`
- **PM2 Error Logs**: `logs/pm2-error.log`
