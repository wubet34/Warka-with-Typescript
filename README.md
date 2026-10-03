# Warka

A Reddit-style community platform built with React + TypeScript (frontend) and Express + TypeScript (backend), with real-time features via Socket.io.

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend  | Express 5, TypeScript, Node 20+ |
| Database | PostgreSQL (NeonDB for production) |
| Realtime | Socket.io |
| Storage  | Local disk (dev) / Render persistent disk (prod) |
| Deploy   | Frontend → Vercel, Backend → Render, DB → NeonDB |

---

## Local Development

### Prerequisites
- Node 20+
- PostgreSQL running locally

### 1. Clone & install

```bash
git clone https://github.com/wubet34/Warka-with-Typescript.git
cd Warka-with-Typescript

# Install server deps
cd server && npm ci

# Install client deps
cd ../client && npm ci
```

### 2. Set up local DB

```bash
psql -U postgres -c "CREATE DATABASE warka_db;"
# Create the tables (from the project root)
psql -d warka_db -f server/src/db/schema.db
psql -d warka_db -f server/src/db/notifications.sql
```

### 3. Configure environment

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your local database settings and a unique JWT_SECRET

# Client
cp client/.env.example client/.env
# Edit client/.env — set VITE_API_URL=http://localhost:5000/api
```

Never commit `.env` files. The committed `.env.example` files contain placeholders only.

### 4. Run

```bash
# Terminal 1 — backend (hot reload)
cd server && npm run dev

# Terminal 2 — frontend (hot reload)
cd client && npm run dev
```

Open `http://localhost:5173`

---

## Deploy to Production

### Step 1 — NeonDB (database)

1. Go to [neon.tech](https://neon.tech) → Create a project → Create database `warka_db`
2. Copy the **pooled connection string** (looks like `postgresql://user:pass@ep-xxx.neon.tech/warka_db?sslmode=require`)
3. Run migrations once:

```bash
cd server
DATABASE_URL="your_neon_connection_string" npx tsx src/db/migrate.ts
```

Run this from `server/`. The command initializes the tables used by the application.

---

### Step 2 — Render (backend)

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Root directory**: `server`
   - **Build command**: `npm ci && npm run build`
   - **Start command**: `npm start`
   - **Node version**: 20

4. Add environment variables in Render dashboard:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your NeonDB pooled connection string |
| `JWT_SECRET` | A long random string (use `openssl rand -hex 32`) |
| `CLIENT_URL` | Your Vercel URL (add after step 3) |
| `PORT` | `5000` |

5. **Persistent Disk** (for image uploads):
   - Add disk → Mount path: `/opt/render/project/uploads` → Size: 1GB
   - Add env var: `UPLOADS_DIR` = `/opt/render/project/uploads`

6. Deploy → copy your Render URL (e.g. `https://warka-server.onrender.com`)

---

### Step 3 — Vercel (frontend)

1. Go to [vercel.com](https://vercel.com) → New Project → Import repo
2. Settings:
   - **Root directory**: `client`
   - **Framework**: Vite
   - **Build command**: `npm run build`
   - **Output directory**: `dist`

3. Add environment variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://warka-server.onrender.com/api` |

4. Deploy → copy your Vercel URL

5. **Go back to Render** → set `CLIENT_URL` to your Vercel URL → redeploy (this is required for Socket.IO connections)

---

### Before pushing changes

- Keep real credentials in Render/Vercel environment settings and local `.env` files; never put them in source files or commit them.
- Confirm `client/.env` points at the deployed API when making a production frontend build. Vercel uses `VITE_API_URL` from its project environment settings.
- Uploaded images are stored on Render's persistent disk. Keep the disk mounted at the path configured by `UPLOADS_DIR` so uploads survive deploys.

---

## Features

- **Auth** — Register, login, JWT sessions, persistent across reloads
- **Posts** — Text, image upload, link posts with preview
- **Feed** — Home (recent), New (all posts), Popular (ranked by votes + comments)
- **Communities** — Create, join/leave, post directly to community
- **Comments** — Nested Reddit-style threads, collapse/expand, reply, delete
- **Votes** — Upvote/downvote posts with real-time score sync
- **Search** — Live full-text search with instant dropdown (posts, people, communities)
- **Profiles** — Edit username, bio, avatar, cover image
- **Notifications** — Real-time bell: comment, reply, upvote notifications
- **Dark mode** — GitHub dark style, toggle in navbar, persisted to localStorage
- **Responsive** — Mobile-first with bottom nav, hamburger menu, all screen sizes
- **Real-time** — Socket.io for live posts, votes, comments, notifications

## Project Structure

```
Warka_With_TypeScript/
├── server/                 # Express + TypeScript API
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── routes/         # Express routers
│   │   ├── middleware/     # Auth, upload, error
│   │   ├── config/         # DB connection
│   │   ├── socket.ts       # Socket.io setup
│   │   ├── utils/          # slugify, notify, imageUrl
│   │   └── db/             # Schema, migration script
│   ├── uploads/            # User-uploaded images (dev)
│   ├── dist/               # Compiled JS (production)
│   └── tsconfig.json
│
├── client/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── pages/          # Route pages
│   │   ├── components/     # UI + layout components
│   │   ├── context/        # Auth, Theme, Socket providers
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # formatDate, imageUrl
│   ├── vercel.json         # SPA routing config
│   └── vite.config.ts
│
├── render.yaml             # Render IaC config
└── README.md
```
