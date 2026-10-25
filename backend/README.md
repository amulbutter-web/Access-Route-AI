# 🗺️ Backend — Express API, Routing Engine & TinyFish

> **Accessibility-first navigation backend for Delhi High Court**

AccessRoute AI provides step-free routing for advocates, litigants, and visitors who need wheelchair-accessible or step-free pathways. Unlike ordinary shortest-distance walking directions, AccessRoute AI **enforces** accessibility constraints — it will never silently fall back to a route containing stairs.

---

## 🎯 Core Features

- **Hard Exclusion Route Engine:** Dijkstra algorithm with complete pruning of stairs when `requireStepFree: true`.
- **TinyFish AI Web Agent Integration:** Uses TinyFish Search & Fetch APIs server-side to retrieve real-world accessibility citations for Delhi High Court facilities (C Block, S Block, Old Building, Bar Library, etc.).
- **Zero API Key Leaks:** TinyFish credentials remain strictly on the backend.
- **Enterprise Security:** Input sanitization, XSS mitigation, rate limiting, and structured audit logs.
- **Resilient Fallback:** When TinyFish is unavailable or rate limited, transparently falls back to local seed evidence.

---

## 🏗️ Architecture

```
┌──────────────────┐       HTTP/JSON        ┌─────────────────────────┐
│ Frontend         │ ◄────────────────────► │ Express API (Port 3001) │
│ (React + Vite)   │                        ├─────────────────────────┤
└──────────────────┘                        │ Route Engine (Local)    │
                                            │ • Hard Step-Free Filter │
                                            ├─────────────────────────┤
                                            │ Evidence Service        │
                                            │ • TinyFish Search/Fetch │
                                            │ • Local Seed Fallback   │
                                            ├─────────────────────────┤
                                            │ Delhi HC Graph Data     │
                                            │ • 16 Nodes, 21 Edges    │
                                            └─────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Install & Configure
```bash
cd backend
npm install
cp .env.example .env
# Ensure TINYFISH_API_KEY is configured in .env
```

### 2. Run Tests
```bash
npm test
```
All 43 unit tests validate Dijkstra routing, node sanitization, and Delhi High Court graph integrity.

### 3. Start Development Server
```bash
npm run dev
```
Server starts at `http://localhost:3001`.

---

## 📡 API Endpoints

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Comprehensive health check (engine + data + TinyFish) |
| `GET` | `/api/health/ping` | Liveness check |
| `GET` | `/api/locations` | List selectable campus locations |
| `POST` | `/api/route` | Compute optimal accessible route |
| `GET` | `/api/evidence/:id` | Fetch live/cached web accessibility evidence |
