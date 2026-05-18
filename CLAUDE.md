# CLAUDE.md: SmartDoc Insight Platform Management

This repository hosts a Modular Monolith Centralized IT Support Document Management system.

## Dev Commands
- Run backend dev: `npm run start:dev` (in `/backend`)
- Run frontend dev: `npm run dev` (in `/frontend`)
- Run security & performance suite: `npm run test:security` (in `/backend`)

## PM2 Services

| Port | Name                    | Type     |
| ---- | ----------------------- | -------- |
| 3000 | smartdoc-frontend-3000  | Frontend |
| 3001 | smartdoc-backend-3001   | Backend  |

**Terminal Commands:**

```bash
pm2 start ecosystem.config.cjs   # First time startup
pm2 start all                    # Startup all services
pm2 stop all                     # Stop all services
pm2 restart all                  # Restart all services
pm2 start smartdoc-backend-3001  # Start backend
pm2 start smartdoc-frontend-3000 # Start frontend
pm2 logs                         # View all service logs
pm2 status                       # View service status
pm2 monit                        # Open interactive monitoring dashboard
pm2 save                         # Save current running process list
pm2 resurrect                    # Restore saved process list on boot
```

## AI Agent Rules & Project Guidelines
1. **MANIFEST PRIORITY (CRITICAL)**: Updating `MANIFEST.md` is the HIGHEST PRIORITY after completing any architectural change, feature implementation, or task iteration. You MUST proactively update the 'Process Log' and 'Folder Details' in `MANIFEST.md` to ensure the next AI session has the correct continuation context. Do not wait for the user to ask.
