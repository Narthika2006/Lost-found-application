# Lost & Found Application

Professionalized lost-and-found platform with:

- Express + MongoDB backend
- React frontend
- Admin moderation and claims
- Dark-themed reporting dashboard

## Project Structure

- `backend/` — API, models, auth, claims, admin workflows
- `frontend/` — React client, shared UI, dashboard, reporting flows

## Local Setup

### 1. Backend

- Copy `backend/.env.example` to `backend/.env`
- Install dependencies: `cd backend && npm install`
- Start dev server: `npm run dev`

Required backend environment variables:

- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `PORT`

### 2. Frontend

- Copy `frontend/.env.example` to `frontend/.env`
- Install dependencies: `cd frontend && npm install`
- Start dev server: `npm start`

Required frontend environment variables:

- `REACT_APP_API_URL`

## Production Checklist

- Set strong production values for `JWT_SECRET`
- Point `CLIENT_URL` and `REACT_APP_API_URL` to real deployed domains
- Use a managed MongoDB instance with backups enabled
- Serve `frontend/build/` through a static host or reverse proxy
- Run the backend behind HTTPS and a process manager
- Keep `backend/uploads/` on persistent storage, not in Git

## Health Check

- Backend health endpoint: `GET /api/health`
- Optional local command: `cd backend && npm run healthcheck`

## Build

- Frontend production build: `cd frontend && npm run build`
- Backend start: `cd backend && npm start`

## Recommended Deployment

- Frontend: Vercel, Netlify, or Nginx static hosting
- Backend: Render, Railway, Fly.io, VPS, or Docker
- Database: MongoDB Atlas

## Current Status

- Backend security hardening completed
- API cleanup and pagination completed
- Matching service and schema tightening completed
- Professional dark UI completed
- Production readiness basics added
