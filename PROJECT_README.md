# Solari Agent Dashboard

A multi-product Solari app that orchestrates desktop, browser, and sandbox sessions from a single web dashboard. Built for the Pinetree Research / Solari intern challenge.

## Architecture

- **Frontend**: React app, deployable to GitHub Pages
- **Backend**: Express API, deployable to Render.com
- **Solari products used**: Desktop (VNC + GUI), Browser (Playwright), Sandbox (code execution)

## Local development

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Set `REACT_APP_API_URL` to your backend URL when running the frontend locally.

## Deploy

### Backend (Render.com)

1. Push this repo to GitHub
2. In Render, create a new **Web Service**
3. Connect the repo and set:
   - **Root directory**: `backend`
   - **Build command**: `npm install`
   - **Start command**: `npm start`
4. Add environment variable `SOLARI_API_KEY` with your Solari key

### Frontend (GitHub Pages)

1. In `frontend/package.json`, update `homepage` to your GitHub Pages URL
2. In `frontend/src/App.js`, update `API` or set `REACT_APP_API_URL` during build
3. Deploy:

```bash
cd frontend
npm run deploy
```

## Use cases

- Watch an AI agent browse, type, and run code across three environments
- Demo Solari's multi-product API in a single shareable link
- Prototype agent workflows before wiring in a real model
