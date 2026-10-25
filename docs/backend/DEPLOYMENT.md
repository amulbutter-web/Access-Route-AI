# Deployment Guide — AccessRoute AI

> Person 4 Ownership: Backend, TinyFish, Security, QA & Deployment

## Local Development

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+

### Setup
```bash
# Clone the repository
git clone <repo-url>
cd accessroute-ai

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and add your TINYFISH_API_KEY

# Start development server (with hot reload)
npm run dev
```

The server starts at `http://localhost:3001` by default.

### Verify Setup
```bash
# Health check
curl http://localhost:3001/api/health/ping

# List locations
curl http://localhost:3001/api/locations

# Calculate a route
curl -X POST http://localhost:3001/api/route \
  -H "Content-Type: application/json" \
  -d '{"from":"main-gate","to":"library","requireStepFree":true}'
```

## Build for Production

```bash
# Type check
npm run typecheck

# Run tests
npm test

# Build
npm run build

# Start production server
NODE_ENV=production npm start
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | No | `development` | Environment (`development` / `production`) |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed frontend origin |
| `TINYFISH_API_KEY` | **Yes** | — | TinyFish API key (server-side only) |
| `TINYFISH_SEARCH_TIMEOUT_MS` | No | `8000` | Search API timeout |
| `TINYFISH_FETCH_TIMEOUT_MS` | No | `12000` | Fetch API timeout |
| `TINYFISH_MAX_RETRIES` | No | `2` | Max retry attempts |
| `TINYFISH_CACHE_TTL_MS` | No | `300000` | Cache TTL (5 min) |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per window |

## Security Checklist

- [ ] `.env` file exists and is NOT committed to Git
- [ ] `.gitignore` includes `.env`, `.env.local`, `.env.production`
- [ ] `TINYFISH_API_KEY` is set in server environment only
- [ ] `NODE_ENV=production` is set for production deployments
- [ ] CORS origin is set to the actual frontend URL
- [ ] No API keys or tokens appear in source code, README, or docs

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Full health check (route engine + TinyFish + data) |
| GET | `/api/health/ping` | Simple liveness probe |
| GET | `/api/locations` | List all selectable campus locations |
| GET | `/api/locations/:id` | Get details for a specific location |
| POST | `/api/route` | Calculate a route between two locations |
| GET | `/api/evidence/:locationId` | Get accessibility evidence for a location |
| POST | `/api/evidence/fetch` | Fetch detailed content from a URL |

## Deployment Options

### Option 1: Railway / Render (Recommended for hackathon)
1. Connect GitHub repository
2. Set environment variables in dashboard
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Deploy

### Option 2: Vercel (Serverless — requires adapter)
Not recommended for this Express server without modification.

### Option 3: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
COPY data/ ./data/
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

## Graceful Degradation

| Service Down | Impact | User Experience |
|---|---|---|
| TinyFish unavailable | No live evidence | Local seed evidence shown; route engine unaffected |
| Network unavailable | No external data | All local features work; evidence shows local-only |
| Campus data corrupted | Server won't start | Startup validation catches this immediately |
