Start all services and open PM2 monitor.

```bash
cd "d:\01_Dev\_Workspaces\Active\ManageDocument" && pm2 start ecosystem.config.cjs && start wt.exe -d "d:\01_Dev\_Workspaces\Active\ManageDocument" pwsh -NoExit -c "pm2 monit"
```
