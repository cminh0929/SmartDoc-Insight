"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  FileText, 
  Folder, 
  Search, 
  Settings, 
  LayoutDashboard,
  History,
  ChevronRight,
  ChevronDown,
  Plus,
  Share2
} from "lucide-react"
import { foldersApi } from "@/lib/api"
import { CreateFolderModal } from "@/components/modules/folders/create-modal"
import { PermissionsModal } from "@/components/modules/permissions/permissions-modal"
import { useAuth } from "@/context/auth-context"
import { LogOut } from "lucide-react"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: FileText, label: "Documents", href: "/documents" },
  { icon: Search, label: "Search", href: "/search" },
  { icon: History, label: "Audit Logs", href: "/audit-logs", adminOnly: true },
  { icon: Settings, label: "Settings", href: "/settings" },
]

export function Sidebar() {
  const pathname = usePathname()
  const [folders, setFolders] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [selectedParentId, setSelectedParentId] = React.useState<string | null>(null)
  
  // Folder sharing states
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false)
  const [shareFolderData, setShareFolderData] = React.useState<{ id: string; name: string } | null>(null)

  const { user, logout, token } = useAuth()
  const [workspaceName, setWorkspaceName] = React.useState<string>("IT DocHub")

  React.useEffect(() => {
    if (user) {
      loadFolders()
      if (token) loadWorkspace()
    }
  }, [user, token])

  const loadWorkspace = async () => {
    try {
      const res = await fetch("http://localhost:3001/tenants/my-workspace", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setWorkspaceName(data.workspace.name)
      }
    } catch (err) {
      console.error("Failed to load workspace:", err)
    }
  }

  const loadFolders = async () => {
    try {
      const data = await foldersApi.getTree()
      setFolders(data)
    } catch (error) {
      console.error("Failed to load folders:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleShareFolder = (id: string, name: string) => {
    setShareFolderData({ id, name })
    setIsShareModalOpen(true)
  }

  return (
    <div className="flex flex-col h-full w-64 bg-card border-r">
      <div className="p-6 flex items-center gap-2">
        <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shrink-0">
          <FileText size={24} />
        </div>
        <span className="font-bold text-[15px] leading-tight truncate" title={workspaceName}>
          {workspaceName}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 space-y-6">
        <nav className="space-y-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Main Menu</p>
          {menuItems.filter(item => !item.adminOnly || user?.role === 'admin').map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === item.href 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folders</p>
            <button 
              onClick={() => {
                setSelectedParentId(null)
                setIsCreateModalOpen(true)
              }}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          
          <div className="space-y-1">
            {loading ? (
              <div className="px-3 py-2 text-xs text-muted-foreground animate-pulse">Loading folders...</div>
            ) : folders.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground italic">No folders yet</div>
            ) : (
              folders.map((folder) => (
                <FolderItem 
                  key={folder.id} 
                  folder={folder} 
                  level={0} 
                  onCreateSubfolder={(id) => {
                    setSelectedParentId(id)
                    setIsCreateModalOpen(true)
                  }}
                  onShareFolder={handleShareFolder}
                />
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t mt-auto">
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold uppercase">
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{user?.fullName || "User"}</span>
              <span className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-widest">{user?.role}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <CreateFolderModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={loadFolders}
        parentId={selectedParentId}
      />

      {shareFolderData && (
        <PermissionsModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false)
            setShareFolderData(null)
          }}
          entityId={shareFolderData.id}
          entityType="folder"
          entityTitle={shareFolderData.name}
        />
      )}
    </div>
  )
}

function FolderItem({ 
  folder, 
  level, 
  onCreateSubfolder,
  onShareFolder
}: { 
  folder: any; 
  level: number;
  onCreateSubfolder: (id: string) => void;
  onShareFolder: (id: string, name: string) => void;
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeFolderId = searchParams.get('folderId')
  const isActive = activeFolderId === folder.id
  
  const [isOpen, setIsOpen] = React.useState(false)
  const hasChildren = folder.children && folder.children.length > 0
  const { user } = useAuth()

  const handleFolderClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/documents?folderId=${folder.id}`)
  }

  return (
    <div className="space-y-1">
      <div 
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors group",
          isActive 
            ? "bg-primary/10 text-primary font-medium" 
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
        style={{ paddingLeft: `${(level * 12) + 12}px` }}
      >
        <div 
          className="flex items-center gap-1 shrink-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          {hasChildren ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <div className="w-3.5 h-3.5" />
          )}
        </div>
        
        <div 
          className="flex items-center gap-2 flex-1 min-w-0"
          onClick={handleFolderClick}
        >
          <Folder size={16} className={cn("shrink-0", isActive || isOpen ? "text-primary" : "text-muted-foreground")} />
          <span className="truncate">{folder.name}</span>
        </div>
        
        <div className="flex items-center gap-1">
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <button 
              onClick={(e) => {
                e.stopPropagation()
                onShareFolder(folder.id, folder.name)
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-accent-foreground/10 rounded transition-all"
              title="Share folder"
            >
              <Share2 size={12} />
            </button>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation()
              onCreateSubfolder(folder.id)
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-accent-foreground/10 rounded transition-all"
            title="Create sub-folder"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
      
      {isOpen && hasChildren && (
        <div className="space-y-1">
          {folder.children.map((child: any) => (
            <FolderItem 
              key={child.id} 
              folder={child} 
              level={level + 1} 
              onCreateSubfolder={onCreateSubfolder}
              onShareFolder={onShareFolder}
            />
          ))}
        </div>
      )}
    </div>
  )
}
