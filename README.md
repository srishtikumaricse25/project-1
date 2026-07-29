# SilentSOS — Enterprise Women Safety & Emergency Response System

[![SilentSOS CI/CD Pipeline](https://github.com/owner/silent-sos/actions/workflows/ci.yml/badge.svg)](https://github.com/owner/silent-sos/actions/workflows/ci.yml)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/owner/silent-sos)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Security: AES-256](https://img.shields.io/badge/Encryption-AES--256--CBC-red.svg)](https://github.com/owner/silent-sos)

**SilentSOS** is a production-grade emergency response and real-time safety tracking application designed for colleges, universities, corporate enterprises, and NGOs.

---

## 🌟 Key Features

- **Silent Emergency SOS**: One-touch 3-second hold emergency trigger with stealth deactivation PIN and false alarm code protection.
- **Real-Time GPS Telemetry & Breadcrumbs**: Live location tracking powered by Leaflet and OpenStreetMap, with Douglas-Peucker polyline route simplification.
- **Ambient Audio Evidence Recording**: Automatically captures WebM audio clips during emergency alerts and uploads them securely.
- **Twilio SMS Verification & OTP**: 6-digit SMS verification code for emergency contacts with expiration and retry rate limits.
- **Recharts Analytics Dashboard**: Multi-organization metrics (Total Alerts, Response Times, False Alarm Rate, Monthly Trends).
- **Multi-Organization Scoping**: Enterprise role-based access control (`ADMIN`, `DISPATCHER`, `SECURITY_OFFICER`, `USER`).
- **AES-256 Data Encryption**: Field-level encryption for emergency contacts, notes, location history, and audio metadata.
- **Production Hardening**: Express Helmet CSP, rate limiters, Winston structured logging, Sentry error monitoring, PM2 cluster HA, and Docker containerization.

---

## 🚀 Quick Start

### 1. Local Development
```bash
npm install
npm run dev
```

### 2. Docker Compose
```bash
docker compose up -d
```

### 3. CI/CD Workflow
Automated GitHub Actions pipeline (`.github/workflows/ci.yml`) runs on push and pull requests:
- `npm install`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
