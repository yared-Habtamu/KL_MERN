# KL_MERN
# KL-MERN

Short guide to clone and run the Kiya Lottery MERN monorepo (backend + frontend).

Prerequisites

- Node.js (16+), pnpm, and MongoDB running locally or accessible via URI.

Clone

```powershell
git clone https://github.com/Kiya-Lottery/KL-MERN.git
cd KL-MERN
```

Run backend (development)

```powershell
cd kl-backend
pnpm install
# create a .env with MONGO_URI (and optionally PORT). Example:
# MONGO_URI=mongodb://127.0.0.1:27017/kl_db
# PORT=4000
pnpm dev
```

Run frontend (development)

```powershell
cd kl-frontend
pnpm install
pnpm dev
# open http://localhost:5173 (vite default) to view the app
```

Notes

- Backend default port: 4000 (API base: http://localhost:4000/api).
- Frontend default (vite): 5173.
- Uploaded files are stored in the backend `uploads/` folder and served at `http://localhost:4000/uploads/`.
- If ports conflict, set `PORT` in `kl-backend/.env` or change Vite port in `kl-frontend` config.

Troubleshooting

- If you see `EADDRINUSE` when starting the backend, stop the process using that port or set a different `PORT`.
- Ensure MongoDB is reachable from the value you set for `MONGO_URI`.

That's it
