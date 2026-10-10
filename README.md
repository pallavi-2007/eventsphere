# EventSphere 🎟️

> A production-grade event ticketing and management platform engineered for peak drops, instant gate check-ins, and zero double-bookings.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS + React Router + Lucide Icons
- **Design Tokens**: Plum (`#5A2A55`), Warm Cream (`#FBF8F4`), Lavender Tints, Sunset Gradient
- **Backend**: Node.js + Express (Modular architecture: config, models, routes, controllers, services, middleware)
- **Database**: MongoDB with Mongoose (supports MongoDB Atlas cloud database or local MongoDB)
- **Cache & Holds**: Redis (Optional for local development; holds will activate in Phase 3)
- **Authentication**: JWT with Role Guards (`organizer`, `user`, `gate`) + bcrypt password hashing
- **DevOps**: Docker Compose provided (optional for local development)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js 18+** (tested on Node v24)
- **MongoDB Atlas** account (free tier cluster) OR local MongoDB / Docker.

### 2. Environment Setup (MongoDB Atlas)
Open `server/.env` and insert your MongoDB Atlas connection string:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>.mongodb.net/eventsphere?retryWrites=true&w=majority

# Redis (OPTIONAL - leave unset or commented out)
# REDIS_URL=redis://127.0.0.1:6379

# JWT Authentication
JWT_SECRET=eventsphere_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

> 💡 **Docker is Optional**: You do **not** need Docker to run the app. If you do wish to run local containers later, `docker-compose.yml` is included in the repository.
> 💡 **Redis is Optional**: When `REDIS_URL` is omitted, the server boots normally and `/health` reports Redis as `"not configured"`.

### 3. Seed Demo Accounts & Events
Populate your MongoDB Atlas database with the 3 demo role accounts and 6 sample events:

```bash
npm run seed
```

### 4. Start Development Servers
From the project root:
```bash
npm run dev
```
Or start individually:
- **Server**: `npm run server` (runs on `http://localhost:5000`)
- **Client**: `npm run client` (opens on `http://localhost:5173`)

---

## 🔑 Demo Access (1-Click Login for Recruiters)

The login screen features 1-click demo role cards that pre-fill credentials instantly:

| Role | Demo Email | Demo Password | Default Route | Sidebar / Layout |
| :--- | :--- | :--- | :--- | :--- |
| **Organizer** | `organizer@eventsphere.com` | `Password123!` | `/organizer/dashboard` | Dashboard, My Events, Attendees, Check-ins |
| **User (Attendee)** | `user@eventsphere.com` | `Password123!` | `/user/home` | Home, Events, My Tickets, Favorites, Profile |
| **Gate Staff** | `gate@eventsphere.com` | `Password123!` | `/gate/scanner` | Single-page scanner station layout |

*Users can also create fresh accounts via the **Sign up** link on the login page.*

---

## 🌐 API Endpoints (Phase 1)

### Public Endpoints
- `GET /health` or `GET /api/health`: System health status (API uptime, MongoDB connection state, Redis state)
- `POST /api/auth/login`: Authenticate and receive JWT token
- `POST /api/auth/register`: Register new attendee account
- `GET /api/events`: List seeded events with ticket tiers and pricing

### Protected Endpoints
- `GET /api/auth/me`: Get current authenticated user profile
- `GET /api/auth/organizer-only`: Guarded route accessible only by `organizer` role
- `GET /api/auth/user-only`: Guarded route accessible only by `user` role
- `GET /api/auth/gate-only`: Guarded route accessible only by `gate` role

---

## 📂 Project Architecture

```
EventSphere/
├── docker-compose.yml       # Optional: MongoDB rs0 replica set + Redis
├── package.json             # Root monorepo orchestrator
├── docs/
│   ├── SPEC.md              # Full spec: roles, screens, build plan
│   └── ui.png               # Visual reference screens
├── server/
│   ├── src/
│   │   ├── config/          # db.js, redis.js, env.js
│   │   ├── models/          # User.js, Event.js
│   │   ├── routes/          # authRoutes.js, eventRoutes.js, healthRoutes.js, index.js
│   │   ├── controllers/     # authController.js, healthController.js, eventController.js
│   │   ├── services/        # authService.js, eventService.js
│   │   ├── middleware/      # authMiddleware.js (JWT & role guards), errorHandler.js
│   │   ├── scripts/         # seed.js (Atlas compatible seed script)
│   │   ├── app.js           # Express app, middleware, routes, error handler
│   │   └── server.js        # Server listener and database connector
│   └── .env.example
└── client/
    ├── src/
    │   ├── context/         # AuthContext.jsx
    │   ├── layouts/         # OrganizerLayout.jsx, UserLayout.jsx, GateLayout.jsx
    │   ├── pages/           # LoginPage.jsx, Organizer & User & Gate views
    │   ├── components/      # ProtectedRoute.jsx, TopProfileBar.jsx
    │   ├── services/        # api.js (Axios with JWT auto-injection)
    │   ├── App.jsx          # Role-based route definitions
    │   └── main.jsx
    ├── tailwind.config.js   # Extracted plum, warm cream & sunset gradient tokens
    └── vite.config.js       # Vite proxy setup (/api -> localhost:5000)
```
