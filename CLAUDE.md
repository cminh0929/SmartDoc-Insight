# SmartDoc Insight — Project CLAUDE.md

## Project Overview
**Stack:** TypeScript, Next.js (Frontend), NestJS (Backend), Drizzle ORM, PostgreSQL, PM2, concurrently, Prettier, ESLint, Husky.

**Architecture:** Monorepo using npm workspaces (`backend`, `frontend`, `shared`).

---

## PM2 Services
| Port | Name | Type |
|------|------|------|
| 3000 | frontend-3000 | Next.js |
| 3001 | backend-3001 | NestJS |

---

## Critical Rules

### Code Style & Architecture
- **TypeScript:** Use strict type checks and type annotations for all public API signatures.
- **Monorepo imports:** Use shared workspace references for common utilities, types, and schemas.
- **Backend (NestJS):** Follow NestJS dependency injection, controller-service-repository patterns, and Drizzle ORM schemas.
- **Frontend (Next.js):** Follow standard Next.js practices. Keep logic separated from the UI presentation.
- **Immutability:** Do not mutate variables directly. Return copies of data.

---

## Available Commands

### PM2 Process Manager
```bash
pm2 start ecosystem.config.cjs   # First time
pm2 start all                    # After first time
pm2 stop all / pm2 restart all
pm2 start frontend-3000 / pm2 stop frontend-3000
pm2 logs / pm2 status / pm2 monit
pm2 save                         # Save process list
pm2 resurrect                    # Restore saved list
```

### Dev & Build Commands
- **Run dev servers concurrently:** `npm run dev`
- **Run all tests:** `npm run test`
- **Lint all files:** `npm run check:lint`
- **Format codebase:** `npm run format`

---

## File Structure
```
SmartDoc-Insight/
|-- backend/          # NestJS application
|-- frontend/         # Next.js application
|-- shared/           # Common models, schemas, and types
|-- docs/             # Technical specifications & documentation
|-- CLAUDE.md         # Project guidelines
```
