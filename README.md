# ZoomHub 60 — Development Starter

A cloud-hosted web dashboard foundation for managing up to 60 individually authorized Zoom account connections and one shared meeting configuration.

## Current milestone (v0.1.0)
- Responsive dashboard UI with 60 account slots.
- Central meeting link, meeting ID, and password form (prototype state only; do not enter real credentials yet).
- Account search and status filter.
- Prisma/PostgreSQL schema for Zoom accounts, central meeting configuration, and activity logs.
- No Zoom OAuth or meeting-control actions are implemented yet.

## Requirements
- Node.js 20.9 or newer
- npm
- PostgreSQL 14+

## Run on Windows (CMD)

```cmd
cd zoomhub60
copy .env.example .env
npm install
```

Edit `.env` and set `DATABASE_URL` to your PostgreSQL database. Then run:

```cmd
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000

## Important security notes
- Do not put Zoom client secrets or OAuth tokens in frontend code.
- The meeting password and OAuth tokens must be encrypted server-side before production use.
- The current meeting settings form is only an in-memory UI prototype; it does not save to PostgreSQL.
- OAuth authorization, admin login, role permissions, token refresh, audit logging, and deployment hardening are next milestones.
- This project is for legitimate management of individually authorized accounts. It does not automate bulk meeting attendance or create artificial participants.
