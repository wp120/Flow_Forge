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

## Run locally

In one terminal:

```bash
cd backend
npm run dev
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
