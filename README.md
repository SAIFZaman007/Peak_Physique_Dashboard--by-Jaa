# Peak Physique — Trainer / Admin Dashboard

React 18 + Vite + Tailwind CSS. A **staff-only** dashboard (trainers and admins) that
reads live client data from the same backend: KPIs and revenue, a searchable client
list, per-client detail with their real progress charts, booking management, and
payment history.

## Run locally

```bash
cp .env.example .env          # VITE_API_URL -> http://localhost:8000/api/v1
npm install
npm run dev                   # http://localhost:5174
```

Log in with a trainer/admin account (seeded from `FIRST_TRAINER_EMAIL` /
`FIRST_TRAINER_PASSWORD` in the backend `.env`). Client accounts cannot access this app.

## Build for production

```bash
npm run build                 # outputs dist/
```

Deploy `dist/` to a static host, ideally on a separate subdomain (e.g.
`dashboard.trainpeakphysique.com`). Set `VITE_API_URL` to your live API at build time.

## Structure

- `src/pages` — Login, Overview, Clients, ClientDetail, Bookings, Payments
- `src/components` — Sidebar, ProtectedRoute (staff guard)
- `src/context/AuthContext.jsx` — rejects non-staff logins