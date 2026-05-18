"use client"

import * as React from "react"
import { useAuth } from "@/context/auth-context"
import { 
  Settings, 
  User, 
  Shield, 
  Database, 
  Server, 
  Terminal, 
  Cpu, 
  Monitor, 
  CheckCircle2 
} from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings className="text-primary" size={32} />
            System & Profile Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal profile and view local platform service statuses.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: User Profile Card */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border p-6 hover:shadow-md transition-all relative overflow-hidden">
            <div className="flex items-center gap-3 border-b pb-4 mb-4">
              <User className="text-primary" size={22} />
              <h2 className="font-bold text-lg">My Profile</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                  Full Name
                </label>
                <div className="bg-accent/40 px-4 py-2.5 rounded-xl text-sm font-medium">
                  {user?.fullName || "Test Admin"}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                  Email Address
                </label>
                <div className="bg-accent/40 px-4 py-2.5 rounded-xl text-sm font-medium">
                  {user?.email || "admin2@example.com"}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                  Security Role Status
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-primary text-primary-foreground text-xs uppercase font-extrabold px-3 py-1 rounded-lg tracking-wider flex items-center gap-1.5 shadow-sm">
                    <Shield size={12} />
                    {user?.role || "ADMIN"}
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12" />
          </div>

          {/* Aesthetic Preferences */}
          <div className="bg-card rounded-2xl border p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 border-b pb-4 mb-4">
              <Monitor className="text-primary" size={22} />
              <h2 className="font-bold text-lg">Aesthetic Preferences</h2>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              This application is styled natively using premium **Tailwind CSS v4** variables, supporting seamless, beautifully animated light and dark theme switching.
            </p>
            <div className="mt-4 p-4 bg-primary/5 border border-primary/10 rounded-xl text-xs text-primary font-medium flex items-center gap-2">
              <CheckCircle2 size={16} />
              Theme toggle is accessible via the top navigation header.
            </div>
          </div>
        </div>

        {/* Right Column: Windows Native Service Statuses */}
        <div className="bg-card rounded-2xl border p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 border-b pb-4 mb-4">
            <Server className="text-primary" size={22} />
            <h2 className="font-bold text-lg">System Infrastructure Status</h2>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            The platform is running entirely as a Native Windows stack under background process orchestration.
          </p>

          <div className="space-y-4">
            {/* API Status */}
            <div className="flex items-center justify-between p-3.5 bg-accent/20 rounded-xl border border-accent">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg dark:bg-blue-900/20 dark:text-blue-400">
                  <Terminal size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">NestJS Backend API</h4>
                  <p className="text-[10px] text-muted-foreground font-mono">Port: 3001 | Host listener</p>
                </div>
              </div>
              <span className="bg-green-500/10 text-green-500 dark:bg-green-500/20 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 border border-green-500/20">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Connected
              </span>
            </div>

            {/* Meilisearch Status */}
            <div className="flex items-center justify-between p-3.5 bg-accent/20 rounded-xl border border-accent">
              <div className="flex items-center gap-3">
                <div className="bg-purple-50 text-purple-600 p-2.5 rounded-lg dark:bg-purple-900/20 dark:text-purple-400">
                  <Cpu size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Meilisearch Indexer</h4>
                  <p className="text-[10px] text-muted-foreground font-mono">Port: 7700 | Master-key</p>
                </div>
              </div>
              <span className="bg-green-500/10 text-green-500 dark:bg-green-500/20 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 border border-green-500/20">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Active
              </span>
            </div>

            {/* Postgres Status */}
            <div className="flex items-center justify-between p-3.5 bg-accent/20 rounded-xl border border-accent">
              <div className="flex items-center gap-3">
                <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg dark:bg-amber-900/20 dark:text-amber-400">
                  <Database size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">PostgreSQL CSDL</h4>
                  <p className="text-[10px] text-muted-foreground font-mono">Port: 5432 | Windows Service</p>
                </div>
              </div>
              <span className="bg-green-500/10 text-green-500 dark:bg-green-500/20 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 border border-green-500/20">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Connected
              </span>
            </div>

            {/* PM2 status */}
            <div className="flex items-center justify-between p-3.5 bg-accent/20 rounded-xl border border-accent">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg dark:bg-indigo-900/20 dark:text-indigo-400">
                  <Monitor size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">PM2 Process Manager</h4>
                  <p className="text-[10px] text-muted-foreground font-mono">3 Live Tasks | Save: dump.pm2</p>
                </div>
              </div>
              <span className="bg-green-500/10 text-green-500 dark:bg-green-500/20 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 border border-green-500/20">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
