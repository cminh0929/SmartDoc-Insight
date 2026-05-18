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
  CheckCircle2,
  Users,
  Plus,
  Trash2,
  Info,
  Check,
  X,
  Loader2,
  FolderPlus,
  FileUp,
  History,
  Share2
} from "lucide-react"

interface Role {
  id: string
  name: string
  description: string
  canCreateRootFolders: boolean
  canUploadRootDocs: boolean
  canViewAuditLogs: boolean
  canManageSharing: boolean
  createdAt: string
}

export default function SettingsPage() {
  const { user, token } = useAuth()
  const [activeTab, setActiveTab] = React.useState<"profile" | "roles">("profile")
  
  // Roles Management state
  const [rolesList, setRolesList] = React.useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = React.useState(false)
  const [newRoleName, setNewRoleName] = React.useState("")
  const [newRoleDesc, setNewRoleDesc] = React.useState("")
  
  // New role permissions checkboxes
  const [pCreateRoot, setPCreateRoot] = React.useState(false)
  const [pUploadRoot, setPUploadRoot] = React.useState(false)
  const [pViewLogs, setPViewLogs] = React.useState(false)
  const [pManageSharing, setPManageSharing] = React.useState(false)
  
  const [actionLoading, setActionLoading] = React.useState(false)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const showRolesTab = user?.role === "admin" || user?.role === "staff" || user?.role === "IT Manager"

  const fetchRoles = React.useCallback(async () => {
    setLoadingRoles(true)
    try {
      const res = await fetch("http://localhost:3001/roles")
      if (res.ok) {
        const data = await res.json()
        setRolesList(data)
      }
    } catch (err) {
      console.error("Failed to fetch roles:", err)
    } finally {
      setLoadingRoles(false)
    }
  }, [])

  React.useEffect(() => {
    if (activeTab === "roles") {
      fetchRoles()
    }
  }, [activeTab, fetchRoles])

  // Clear notifications after 4 seconds
  React.useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null)
        setErrorMsg(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [successMsg, errorMsg])

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoleName.trim()) return

    setActionLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await fetch("http://localhost:3001/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newRoleName,
          description: newRoleDesc,
          canCreateRootFolders: pCreateRoot,
          canUploadRootDocs: pUploadRoot,
          canViewAuditLogs: pViewLogs,
          canManageSharing: pManageSharing
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to create custom role")
      }

      setSuccessMsg(`Role "${newRoleName}" created successfully!`)
      setNewRoleName("")
      setNewRoleDesc("")
      setPCreateRoot(false)
      setPUploadRoot(false)
      setPViewLogs(false)
      setPManageSharing(false)
      fetchRoles()
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the custom role "${roleName}"?`)) return

    setActionLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await fetch(`http://localhost:3001/roles/${roleId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete role")
      }

      setSuccessMsg(`Role "${roleName}" deleted successfully!`)
      fetchRoles()
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleTogglePermission = async (role: Role, field: keyof Role) => {
    if (["admin", "staff", "intern"].includes(role.name)) {
      setErrorMsg("Cannot modify core system roles. Create a custom role to customize permissions.")
      return
    }

    const updatedValue = !role[field]
    setActionLoading(true)
    setErrorMsg(null)

    try {
      const res = await fetch(`http://localhost:3001/roles/${role.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          [field]: updatedValue
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to update role permissions")
      }

      setSuccessMsg(`Permissions updated for role "${role.name}"!`)
      fetchRoles()
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings className="text-primary animate-spin-slow" size={32} />
            System & Role Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal profile, services status, and configure custom security roles.
          </p>
        </div>

        {/* Tab Controls */}
        {showRolesTab && (
          <div className="flex bg-accent/40 p-1.5 rounded-xl border border-accent">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 rounded-lg text-sm font-bold tracking-wide transition-all ${
                activeTab === "profile" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Profile & Services
            </button>
            <button
              onClick={() => setActiveTab("roles")}
              className={`px-4 py-2 rounded-lg text-sm font-bold tracking-wide transition-all flex items-center gap-1.5 ${
                activeTab === "roles" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users size={16} />
              Roles & Permissions
            </button>
          </div>
        )}
      </div>

      {/* Floating Notifications */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl p-4 text-sm font-medium flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle2 size={18} className="shrink-0 animate-bounce" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 text-sm font-medium flex items-center gap-3 animate-fade-in shadow-sm">
          <Info size={18} className="shrink-0" />
          {errorMsg}
        </div>
      )}

      {activeTab === "profile" ? (
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
                  <div className="bg-accent/40 px-4 py-2.5 rounded-xl text-sm font-semibold">
                    {user?.fullName || "Test Admin"}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                    Email Address
                  </label>
                  <div className="bg-accent/40 px-4 py-2.5 rounded-xl text-sm font-semibold">
                    {user?.email || "admin@it.doc"}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                    Security Role Status
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-primary text-primary-foreground text-xs uppercase font-extrabold px-3 py-1.5 rounded-lg tracking-wider flex items-center gap-1.5 shadow-sm">
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
      ) : (
        <div className="space-y-8 animate-slide-up">
          {/* Top banner explaining Custom Roles */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-start gap-4">
            <div className="bg-primary text-primary-foreground p-3 rounded-xl shadow-md shrink-0">
              <Shield size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg">Granular Role-Based Access Control (RBAC)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                As a Manager, you can create and configure custom security roles. Simply select the checkboxes below each role to live-update their system-wide privileges!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Roles Listing Cards (Left & Middle Columns) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xl flex items-center gap-2">
                  <Users className="text-primary" size={20} />
                  Active System & Custom Roles
                </h3>
                {loadingRoles && <Loader2 className="animate-spin text-muted-foreground" size={18} />}
              </div>

              {rolesList.length === 0 && !loadingRoles ? (
                <div className="border border-dashed rounded-2xl p-12 text-center text-muted-foreground">
                  No roles found in database.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {rolesList.map((role) => {
                    const isSystemRole = ["admin", "staff", "intern"].includes(role.name)
                    return (
                      <div 
                        key={role.id} 
                        className={`bg-card rounded-2xl border p-5 transition-all hover:shadow-md flex flex-col justify-between relative ${
                          isSystemRole ? "border-accent bg-accent/10" : "border-primary/20 shadow-sm"
                        }`}
                      >
                        {/* Card Header */}
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h4 className="font-bold text-base flex items-center gap-1.5">
                                {role.name}
                                {isSystemRole && (
                                  <span className="text-[10px] bg-accent/70 text-muted-foreground px-2 py-0.5 rounded font-mono">
                                    CORE
                                  </span>
                                )}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed min-h-[32px]">
                                {role.description || "No description provided."}
                              </p>
                            </div>
                            
                            {!isSystemRole && (
                              <button
                                onClick={() => handleDeleteRole(role.id, role.name)}
                                className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/5 transition-all shrink-0"
                                title="Delete Custom Role"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>

                          {/* Checkbox Toggles for Permissions */}
                          <div className="border-t pt-4 mt-3 space-y-2.5">
                            <label 
                              className={`flex items-center justify-between text-xs font-medium cursor-pointer p-1.5 rounded-lg transition-all ${
                                isSystemRole ? "opacity-75 cursor-not-allowed" : "hover:bg-accent/40"
                              }`}
                              onClick={() => !isSystemRole && handleTogglePermission(role, "canCreateRootFolders")}
                            >
                              <span className="flex items-center gap-2">
                                <FolderPlus size={14} className="text-muted-foreground" />
                                Create Root Folders
                              </span>
                              <div className={`w-4 h-4 border rounded flex items-center justify-center transition-all ${
                                role.canCreateRootFolders 
                                  ? "bg-primary border-primary text-primary-foreground" 
                                  : "border-muted-foreground"
                              }`}>
                                {role.canCreateRootFolders && <Check size={12} />}
                              </div>
                            </label>

                            <label 
                              className={`flex items-center justify-between text-xs font-medium cursor-pointer p-1.5 rounded-lg transition-all ${
                                isSystemRole ? "opacity-75 cursor-not-allowed" : "hover:bg-accent/40"
                              }`}
                              onClick={() => !isSystemRole && handleTogglePermission(role, "canUploadRootDocs")}
                            >
                              <span className="flex items-center gap-2">
                                <FileUp size={14} className="text-muted-foreground" />
                                Upload Root Documents
                              </span>
                              <div className={`w-4 h-4 border rounded flex items-center justify-center transition-all ${
                                role.canUploadRootDocs 
                                  ? "bg-primary border-primary text-primary-foreground" 
                                  : "border-muted-foreground"
                              }`}>
                                {role.canUploadRootDocs && <Check size={12} />}
                              </div>
                            </label>

                            <label 
                              className={`flex items-center justify-between text-xs font-medium cursor-pointer p-1.5 rounded-lg transition-all ${
                                isSystemRole ? "opacity-75 cursor-not-allowed" : "hover:bg-accent/40"
                              }`}
                              onClick={() => !isSystemRole && handleTogglePermission(role, "canViewAuditLogs")}
                            >
                              <span className="flex items-center gap-2">
                                <History size={14} className="text-muted-foreground" />
                                View Audit Logs
                              </span>
                              <div className={`w-4 h-4 border rounded flex items-center justify-center transition-all ${
                                role.canViewAuditLogs 
                                  ? "bg-primary border-primary text-primary-foreground" 
                                  : "border-muted-foreground"
                              }`}>
                                {role.canViewAuditLogs && <Check size={12} />}
                              </div>
                            </label>

                            <label 
                              className={`flex items-center justify-between text-xs font-medium cursor-pointer p-1.5 rounded-lg transition-all ${
                                isSystemRole ? "opacity-75 cursor-not-allowed" : "hover:bg-accent/40"
                              }`}
                              onClick={() => !isSystemRole && handleTogglePermission(role, "canManageSharing")}
                            >
                              <span className="flex items-center gap-2">
                                <Share2 size={14} className="text-muted-foreground" />
                                Manage Sharing
                              </span>
                              <div className={`w-4 h-4 border rounded flex items-center justify-center transition-all ${
                                role.canManageSharing 
                                  ? "bg-primary border-primary text-primary-foreground" 
                                  : "border-muted-foreground"
                              }`}>
                                {role.canManageSharing && <Check size={12} />}
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Card Footer Info */}
                        {isSystemRole && (
                          <div className="mt-4 pt-2 border-t border-dashed flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Info size={12} />
                            Core system rules cannot be edited.
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Create Custom Role Sidebar Form (Right Column) */}
            <div className="bg-card rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all self-start space-y-5">
              <div className="border-b pb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Plus className="text-primary" size={20} />
                  Add Custom Role
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Define a new organizational role with tailored, checkbox-toggled permission flags.
                </p>
              </div>

              <form onSubmit={handleCreateRole} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
                    Role Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IT Auditor"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    required
                    className="w-full bg-accent/20 border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe role responsibilities..."
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-accent/20 border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                  />
                </div>

                <div className="border-t pt-4 space-y-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                    Tick Initial Permissions
                  </span>

                  {/* Create Root Folders Toggle */}
                  <label className="flex items-center justify-between text-xs font-medium cursor-pointer p-2 hover:bg-accent/40 rounded-lg transition-all">
                    <span className="flex items-center gap-2">
                      <FolderPlus size={14} className="text-muted-foreground" />
                      Create Root Folders
                    </span>
                    <input
                      type="checkbox"
                      checked={pCreateRoot}
                      onChange={(e) => setPCreateRoot(e.target.checked)}
                      className="accent-primary w-4 h-4 cursor-pointer"
                    />
                  </label>

                  {/* Upload Root Docs Toggle */}
                  <label className="flex items-center justify-between text-xs font-medium cursor-pointer p-2 hover:bg-accent/40 rounded-lg transition-all">
                    <span className="flex items-center gap-2">
                      <FileUp size={14} className="text-muted-foreground" />
                      Upload Root Documents
                    </span>
                    <input
                      type="checkbox"
                      checked={pUploadRoot}
                      onChange={(e) => setPUploadRoot(e.target.checked)}
                      className="accent-primary w-4 h-4 cursor-pointer"
                    />
                  </label>

                  {/* View Audit Logs Toggle */}
                  <label className="flex items-center justify-between text-xs font-medium cursor-pointer p-2 hover:bg-accent/40 rounded-lg transition-all">
                    <span className="flex items-center gap-2">
                      <History size={14} className="text-muted-foreground" />
                      View Audit Logs
                    </span>
                    <input
                      type="checkbox"
                      checked={pViewLogs}
                      onChange={(e) => setPViewLogs(e.target.checked)}
                      className="accent-primary w-4 h-4 cursor-pointer"
                    />
                  </label>

                  {/* Manage Sharing Toggle */}
                  <label className="flex items-center justify-between text-xs font-medium cursor-pointer p-2 hover:bg-accent/40 rounded-lg transition-all">
                    <span className="flex items-center gap-2">
                      <Share2 size={14} className="text-muted-foreground" />
                      Manage Sharing & Sharing Permissions
                    </span>
                    <input
                      type="checkbox"
                      checked={pManageSharing}
                      onChange={(e) => setPManageSharing(e.target.checked)}
                      className="accent-primary w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !newRoleName.trim()}
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold tracking-wide rounded-xl py-3 text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Saving role...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Save Custom Role
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
