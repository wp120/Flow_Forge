# FlowForge

FlowForge is a multi-tenant workflow and approval platform. Organizations can configure custom forms and workflows; submitted requests move through the associated approval process.

The first planned use case is employee expense reimbursement. The platform is designed to stay generic enough for other approval processes later.

This repository is currently a **runnable project skeleton**. Product features such as authentication, tenants, forms, and workflows are not implemented yet.

## Stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL
- ORM: Prisma

## Repository layout

```text
flowforge/
├── frontend/
└── backend/
```

## Prerequisites

- Node.js 20 or later
- PostgreSQL (needed when Prisma models and migrations are added)

## Setup

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
npm run prisma:generate
```

Copy `backend/.env.example` to `backend/.env` and adjust `DATABASE_URL` if your local PostgreSQL credentials differ.

For file uploads and asynchronous notification jobs, configure `SUPABASE_URL`,
`SUPABASE_SECRET_KEY`, `SUPABASE_STORAGE_BUCKET`, and `REDIS_URL` in
`backend/.env`. Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and
`VITE_SUPABASE_STORAGE_BUCKET` in `frontend/.env`. Create the private Supabase
Storage bucket named by `SUPABASE_STORAGE_BUCKET` before uploading. The service
secret key must remain backend-only. Set the bucket's maximum file size to 20 MB
in Supabase Storage as well; the API independently verifies actual uploaded size
before accepting an attachment. Signed upload URLs expire after two minutes.
The worker removes unassociated user uploads older than 24 hours when possible.
Configure `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`, defaulting to
`gemini-2.5-flash`) in `backend/.env` to enable AI suggestions and document
extraction. The Gemini key is server-only and must not use a `VITE_` prefix.

## Run locally

In one terminal:

```bash
cd backend
npm run dev
```

Run the notification worker in another backend terminal:

```bash
cd backend
npm run dev:worker
```

The API listens on `http://localhost:3001` and exposes `GET /health`.

In another terminal:

```bash
cd frontend
npm run dev
```

The Vite app is served at `http://localhost:5173`.

## Build

```bash
cd frontend && npm run build
cd ../backend && npm run build
```
