/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { 
  Share2, 
  User, 
  Plus, 
  Trash2, 
  Loader2, 
  ShieldCheck,
  Search
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { permissionsApi, usersApi } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"

interface PermissionsModalProps {
  entityId: string
  entityType: "document" | "folder"
  entityTitle: string
  isOpen: boolean
  onClose: () => void
}

export function PermissionsModal({
  entityId,
  entityType,
  entityTitle,
  isOpen,
  onClose,
}: PermissionsModalProps) {
  const { user: currentUser } = useAuth()
  const [permissions, setPermissions] = React.useState<any[]>([])
  const [users, setUsers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  
  // Selection states
  const [selectedUserId, setSelectedUserId] = React.useState("")
  const [selectedLevel, setSelectedLevel] = React.useState<"read" | "write" | "admin">("read")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)

  React.useEffect(() => {
    if (isOpen && entityId) {
      loadPermissions()
      loadUsers()
    }
  }, [isOpen, entityId])

  const loadPermissions = async () => {
    try {
      setLoading(true)
      const data = entityType === "document" 
        ? await permissionsApi.getByDocument(entityId)
        : await permissionsApi.getByFolder(entityId)
      setPermissions(data)
    } catch (err) {
      console.error("Failed to load permissions:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const allUsers = await usersApi.getAll()
      // Exclude current user from options
      setUsers(allUsers.filter((u: any) => u.id !== currentUser?.id))
    } catch (err) {
      console.error("Failed to load users:", err)
    }
  }

  const handleGrant = async () => {
    if (!selectedUserId) return
    try {
      setSaving(true)
      const payload = {
        userId: selectedUserId,
        documentId: entityType === "document" ? entityId : undefined,
        folderId: entityType === "folder" ? entityId : undefined,
        level: selectedLevel,
      }
      await permissionsApi.grant(payload)
      setSelectedUserId("")
      setSearchQuery("")
      await loadPermissions()
    } catch (err: any) {
      alert(`Failed to grant permission: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleRevoke = async (permissionId: string) => {
    if (!confirm("Are you sure you want to revoke this user's access?")) return
    try {
      setLoading(true)
      await permissionsApi.revoke(permissionId)
      await loadPermissions()
    } catch (err: any) {
      alert(`Failed to revoke access: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedUser = users.find(u => u.id === selectedUserId)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-md border border-accent/20 shadow-2xl rounded-2xl p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Share2 className="text-primary shrink-0" size={24} />
            <span>Access Settings</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Manage who has explicit access to <span className="font-semibold text-foreground">"{entityTitle}"</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Grant Permission Area */}
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/15 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Grant Access</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* User Selection Search box */}
              <div className="relative flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchQuery || (selectedUser ? selectedUser.fullName : "")}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setSelectedUserId("")
                      setIsDropdownOpen(true)
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="w-full bg-background border border-accent/20 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                {/* Custom Search Dropdown */}
                {isDropdownOpen && searchQuery && (
                  <div className="absolute z-50 w-full mt-1.5 bg-background border border-accent/20 rounded-lg shadow-xl max-h-[200px] overflow-y-auto divide-y divide-accent/10 backdrop-blur-lg">
                    {filteredUsers.length === 0 ? (
                      <div className="p-3 text-xs text-muted-foreground text-center">No users found</div>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setSelectedUserId(u.id)
                            setSearchQuery("")
                            setIsDropdownOpen(false)
                          }}
                          className="w-full p-2.5 text-left text-xs hover:bg-primary/10 transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{u.fullName}</p>
                            <p className="text-muted-foreground text-[10px]">{u.email}</p>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/40 text-muted-foreground font-bold uppercase tracking-wider">{u.role}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Level Dropdown */}
              <select
                value={selectedLevel}
                onChange={(e: any) => setSelectedLevel(e.target.value)}
                className="bg-background border border-accent/20 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary cursor-pointer sm:w-[110px]"
              >
                <option value="read">Read</option>
                <option value="write">Write</option>
                <option value="admin">Admin</option>
              </select>

              {/* Action Button */}
              <Button
                onClick={handleGrant}
                disabled={!selectedUserId || saving}
                className="gap-1.5 shrink-0 bg-primary hover:bg-primary/95 shadow-md shadow-primary/20"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                <span>Add</span>
              </Button>
            </div>
          </div>

          {/* Current Explicit Permissions List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Explicitly Shared Users</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20">{permissions.length}</span>
            </h4>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : permissions.length === 0 ? (
              <div className="text-center py-10 border border-dashed rounded-xl border-accent/20 bg-accent/5">
                <User size={28} className="text-muted-foreground mx-auto mb-2 opacity-60" />
                <p className="text-xs text-muted-foreground italic">This item is not explicitly shared with anyone.</p>
                <p className="text-[10px] text-muted-foreground/80 mt-1">Users will inherit permissions based on roles or folders.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {permissions.map((perm) => {
                  const u = perm.user
                  return (
                    <div 
                      key={perm.id} 
                      className="flex items-center justify-between p-3 rounded-xl border border-accent/10 bg-accent/5 hover:bg-accent/10 transition-colors animate-fade-in"
                    >
                      <div className="flex items-center gap-3">
                        {/* Custom avatar initials */}
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm uppercase">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            {u.fullName}
                            {u.role === "admin" && <ShieldCheck size={14} className="text-green-500" />}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          perm.level === "admin" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          perm.level === "write" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                          "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>
                          {perm.level}
                        </span>

                        <button
                          onClick={() => handleRevoke(perm.id)}
                          className="p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive rounded-lg transition-all cursor-pointer"
                          title="Revoke access"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
