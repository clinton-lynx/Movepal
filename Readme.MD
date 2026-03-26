# MovePal — Know Before You Go

> Real-time transit intelligence for Lagos commuters. The station intelligence layer Nigeria never had.

![MovePal](https://img.shields.io/badge/MovePal-Enyata%20Buildathon%202026-3B82F6?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-iOS%20%26%20Android-030816?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Live%20MVP-22C55E?style=for-the-badge)

---

## What is MovePal?

MovePal solves a problem that affects 20 million Lagos commuters every day — the complete absence of information about bus station congestion before you leave your house.

Every morning, commuters wake up, travel to a station, and only then discover a 2-hour queue and no buses. MovePal ends that. Using AI prediction, crowdsourced reports, and real-time data, MovePal tells you what is happening at every major Lagos transit station **before you step outside**.

> _"Google tells you the road is red. MovePal tells you which station to avoid."_

---

## Live Links

| Service               | URL                                          |
| --------------------- | -------------------------------------------- |
| Backend API           | https://movepal-api-pjlh.onrender.com        |
| ML Prediction Service | https://movepal-ml.onrender.com              |
| API Health Check      | https://movepal-api-pjlh.onrender.com/health |

---

## Repositories

| Repo                                                          | Description                        |
| ------------------------------------------------------------- | ---------------------------------- |
| [movepal-frontend](https://github.com/clinton-lynx/Movepal)   | React Native (Expo) mobile app     |
| [movepal-backend](https://github.com/clinton-lynx/Movepal-BE) | Node.js + TypeScript REST API      |
| [movepal-ml](https://github.com/clinton-lynx/Movepal-ML)      | Python Flask ML prediction service |

---

## Features

- **Live Station Map** — 84 real Lagos bus stations colour-coded Heavy / Moderate / Flowing
- **AI Congestion Prediction** — Random Forest model trained on Lagos traffic research, 92-97% confidence
- **Crowdsource Reporting** — One-tap status reports with points rewards
- **Proximity Detection** — Push notification when you arrive near a station asking you to report
- **Commute Reminders** — Daily smart alerts checking your station at your departure time
- **Ride Booking** — Bolt, Uber and InDrive pre-filled with your location, one tap
- **Predict Any Time** — Check what a station will look like tomorrow at 7am
- **MovePal Points** — Earn 10 points per report, redeem for airtime via Interswitch API

---

## Tech Stack

### Frontend (React Native / Expo)

- React Native with Expo SDK
- Expo Router (file-based navigation)
- NativeWind (Tailwind CSS) + StyleSheet
- react-native-maps with custom SVG teardrop markers
- Firebase JS SDK (real-time Firestore listeners)
- expo-location, expo-notifications, expo-linking
- expo-secure-store for JWT storage

### Backend (Node.js / TypeScript)

- Express + TypeScript strict mode
- Firebase Admin SDK
- JWT authentication + bcryptjs
- Zod request validation
- Majority vote report aggregation algorithm
- Interswitch OAuth 2.0 + Bills Payment API
- Deployed on Render

### ML Service (Python)

- Flask REST API
- scikit-learn Random Forest classifier
- Trained on Lagos traffic patterns from published academic research
- Features: latitude, longitude, hour, day of week
- Deployed on Render

### Infrastructure

- Firebase Firestore (real-time database)
- Google Maps API + Google Places API (84 real Lagos stations)
- Interswitch API Marketplace (airtime redemption)
- Expo Push Notifications (FCM + APNs)

---

## Architecture

```
Mobile App (Expo)
       ↓
Node.js API (Render) ←→ Firebase Firestore
       ↓                      ↑
       ↓──────────→ ML Service (Render)
       ↓
Interswitch API (Airtime rewards)
       ↓
Google Maps API (Station data + traffic)
```

---

## API Endpoints

### Auth

```
POST /api/auth/register    — Create account, returns JWT
POST /api/auth/login       — Login, returns JWT
```

### Stations

```
GET  /api/stations              — All 84 Lagos stations
GET  /api/stations/:id          — Single station
POST /api/stations/:id/report   — Submit status report (auth required)
```

### Rewards (Interswitch)

```
GET  /api/rewards/options        — Available redemption tiers
GET  /api/rewards/balance        — User points balance (auth required)
POST /api/rewards/redeem         — Redeem points for airtime (auth required)
```

### ML Predictions

```
POST /api/ml/predict             — Predict congestion (lat, lng)
```

---

## Team Contributions

### Clinton Adeoti — [@clinton-lynx](https://github.com/clinton-lynx)

**Role: Team Lead / Mobile & Backend Engineer**

- Product vision, architecture design and technical direction
- Built the complete React Native (Expo) frontend from scratch
  - Live station map with 84 real Lagos stations and custom teardrop markers
  - Glassmorphism bottom sheet with spring animations
  - Station list with search, AI prediction pills, status badges
  - Report station status sheet with three options and points incentive
  - Book a Ride sheet (Bolt, Uber, InDrive deep links)
  - Predict Congestion tool (any day and time)
  - Set Commute Reminder feature with daily smart notifications
  - Proximity-based reporting (notifies user when near a station)
  - Profile screen with points balance and redemption
  - Login and Register screens with JWT auth
- Built the Node.js + TypeScript backend API
  - JWT authentication (register, login, logout)
  - Station reporting with majority vote aggregation
  - Push notification triggers when station flips to Heavy
  - Interswitch OAuth 2.0 integration and Bills Payment API
  - MovePal points system (earn on report, redeem for airtime)
  - Standardised response format across all endpoints
- Firebase Firestore setup and real-time data architecture
- Google Places API integration (seeded 84 real Lagos stations)
- Deployed backend on Render
- Pitch deck, product documentation, demo strategy

---

### Yusuf Adeniji — [@usefulmech](https://github.com/usefulmech)

**Role: ML Engineer**

- Designed and built the MovePal congestion prediction model
- Researched Lagos traffic patterns from published academic sources
  - Oshodi-Apapa congestion studies
  - Lagos BRT evaluation report
  - Ikorodu Road traffic analysis
- Trained Random Forest classifier on Lagos-specific synthetic data
  - Features: latitude, longitude, hour of day, day of week
  - Achieves 92-97% confidence on major Lagos stations
- Built Python Flask REST API exposing prediction endpoints
  - `POST /predict` — full prediction with all parameters
  - `POST /predict/now` — prediction using current time automatically
  - `GET /health` — service health check
- Deployed ML service to Render
- Provided station coordinates list for model training

---

## The Problem We Solved

There is no publicly available dataset of Lagos bus station congestion. Not from Google, not from the government, not from any startup. Every report submitted on MovePal creates a data point that has never existed before.

We are not just building an app — we are building the data infrastructure that Nigerian public transit has never had.

_Inspired by the viral story of Ella (@darkskinned.ella) who was threatened for filming a bus queue in Lagos in January 2026._

---

## Hackathon

**Event:** Enyata Buildathon 2026 (Enyata × Interswitch Developer Community)
**Category:** Mobile Development
**Built in:** 4 days (March 23–26, 2026)

---

_MovePal — Because nobody should wake up at 4am and still be caught off guard._
