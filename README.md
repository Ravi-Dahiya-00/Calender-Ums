# UMS Academic Calendar

A full-stack academic event calendar for Lovely Professional University, built as a prototype for UMS integration.

## Architecture

```
apps/
  calendar-widget/    → Student-facing calendar (React + Vite) → Vercel
  admin-panel/        → Event management dashboard (React + Vite) → Vercel
backend/              → REST API (Node.js + Express) → Render
                          ↕ Supabase (PostgreSQL)
```

---

## Local Development

### Prerequisites
- Node.js >= 18
- npm

### 1. Clone & install

```bash
git clone <your-repo-url>
cd Calender-Ums

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../apps/calendar-widget && npm install
cd ../admin-panel && npm install
```

### 2. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env — fill in SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_PASSWORD, ADMIN_API_KEY

# Calendar Widget
cp apps/calendar-widget/.env.example apps/calendar-widget/.env

# Admin Panel
cp apps/admin-panel/.env.example apps/admin-panel/.env
# Edit apps/admin-panel/.env — set VITE_ADMIN_PASSWORD to match backend ADMIN_PASSWORD
```

### 3. Run all services

```bash
# Terminal 1 — Backend API
cd backend && npm run dev

# Terminal 2 — Calendar Widget
cd apps/calendar-widget && npm run dev

# Terminal 3 — Admin Panel
cd apps/admin-panel && npm run dev
```

| Service | URL |
|---|---|
| Backend API | http://localhost:5000 |
| Calendar Widget | http://localhost:5173 |
| Admin Panel | http://localhost:5174 |

---

## Deployment

### Step 1: Deploy Backend to Render

1. Go to [render.com](https://render.com) and create a new account or log in.
2. Click **New → Web Service** → Connect your GitHub repo.
3. Set **Root Directory** to `backend`.
4. Render will auto-detect Node.js. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. In **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `SUPABASE_URL` = *(your Supabase project URL)*
   - `SUPABASE_ANON_KEY` = *(your Supabase anon key)*
   - `ADMIN_PASSWORD` = *(a strong password)*
   - `ADMIN_API_KEY` = *(a strong API key)*
   - `ALLOWED_ORIGINS` = *(your Vercel URLs, added in Step 2 & 3)*
6. Deploy. Note your backend URL (e.g. `https://ums-calendar-api.onrender.com`).

> **Note:** The free tier on Render "spins down" after 15 minutes of inactivity. The first request after that will take ~30 seconds to wake up. This is fine for a prototype.

---

### Step 2: Deploy Calendar Widget to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub.
2. Set **Root Directory** to `apps/calendar-widget`.
3. Framework preset: **Vite**
4. In **Environment Variables**, add:
   - `VITE_API_BASE_URL` = `https://ums-calendar-api.onrender.com` *(your Render URL)*
5. Deploy. Note your calendar URL (e.g. `https://ums-calendar.vercel.app`).

---

### Step 3: Deploy Admin Panel to Vercel

1. In Vercel, create **another new project** from the same repo.
2. Set **Root Directory** to `apps/admin-panel`.
3. Framework preset: **Vite**
4. In **Environment Variables**, add:
   - `VITE_API_BASE_URL` = `https://ums-calendar-api.onrender.com`
   - `VITE_ADMIN_PASSWORD` = *(same as ADMIN_PASSWORD on Render)*
   - `VITE_CALENDAR_URL` = `https://ums-calendar.vercel.app` *(your calendar URL from Step 2)*
5. Deploy.

---

### Step 4: Update CORS on the backend

Once you have all three URLs, go back to Render → your service → Environment Variables and update:

```
ALLOWED_ORIGINS=https://ums-calendar.vercel.app,https://ums-admin.vercel.app
```

Render will auto-redeploy.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/events` | Get all events |
| GET | `/api/events?type=MTE` | Filter by event type |
| POST | `/api/events` | Create event *(requires x-admin-token header)* |
| PUT | `/api/events/:id` | Update event *(requires x-admin-token header)* |
| DELETE | `/api/events/:id` | Delete event *(requires x-admin-token header)* |

### Event Types

| Type | Description |
|------|-------------|
| `MTE` | Mid Term Exams |
| `ETE` | End Term Exams |
| `CA` | Continuous Assessment |
| `HOLIDAY` | Holidays |
| `WORKSHOP` | Workshops |
| `EVENT` | General Events |
| `DEADLINE` | Deadlines |

---

## Security Notes

- **Never commit `.env` files** — they are in `.gitignore`
- Admin routes require an `x-admin-token` header matching `ADMIN_PASSWORD` or `ADMIN_API_KEY`
- The admin panel is marked `noindex, nofollow` — search engines won't index it
- Rate limiting is active: 200 req/15min for reads, 50 req/15min for admin writes
