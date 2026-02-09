# March Madness Betting Dashboard

A real-time betting dashboard for March Madness. Pull odds from [The Odds API](https://the-odds-api.com), display them on a shared dashboard, and let your friends place play-money bets.

## Prerequisites

- Node.js v24 (use `nvm use` to activate)
- Docker (for local MongoDB)
- An API key from [The Odds API](https://the-odds-api.com/#get-access)

## Getting Started

### 1. Start MongoDB

```bash
docker compose up -d
```

### 2. Server Setup

```bash
cd server
cp .env.example .env
# Edit .env and add your ODDS_API_KEY
npm install
npm run dev
```

The server runs on `http://localhost:3001`.

### 3. Client Setup

```bash
cd client
npm install
npm run dev
```

The client runs on `http://localhost:5173` and proxies API requests to the server.

## Tech Stack

- **Server**: Node.js, Express, TypeScript, Mongoose, node-cron
- **Client**: React, TypeScript, Vite, Tailwind CSS, React Router
- **Database**: MongoDB 7
- **Real-time**: Server-Sent Events (SSE)
- **Odds Data**: The Odds API v4
