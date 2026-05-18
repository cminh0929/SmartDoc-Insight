"use client"

import * as React from "react"
import { 
  FileText, 
  Folder, 
  Clock, 
  Database, 
  TrendingUp,
  ChevronRight,
  Loader2,
  AlertCircle
} from "lucide-react"
import { dashboardApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function DashboardPage() {
  const [stats, setStats] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await dashboardApi.getStats()
      setStats(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted-foreground animate-pulse">Loading dashboard statistics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle className="text-destructive" size={40} />
        <div>
          <p className="font-bold text-lg">Failed to load dashboard</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <button 
          onClick={loadStats}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    )
  }

  const statCards = [
    { 
      label: "Total Documents", 
      value: stats?.totalDocuments || 0, 
      icon: FileText, 
      color: "text-blue-600", 
      bg: "bg-blue-50",
      trend: "+12% from last month" 
    },
    { 
      label: "Active Folders", 
      value: stats?.totalFolders || 0, 
      icon: Folder, 
      color: "text-purple-600", 
      bg: "bg-purple-50",
      trend: "Organized storage" 
    },
    { 
      label: "Storage Used", 
      value: stats ? `${(stats.storageUsed / 1024 / 1024).toFixed(2)} MB` : "0 MB", 
      icon: Database, 
      color: "text-amber-600", 
      bg: "bg-amber-50",
      trend: "Local FS usage" 
    },
    { 
      label: "Recent Activity", 
      value: stats?.recentActivity?.length || 0, 
      icon: TrendingUp, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50",
      trend: "Last 7 days" 
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Quick overview of your IT support documentation system.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-card rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <h3 className="text-2xl font-bold mt-1">{card.value}</h3>
              </div>
              <div className={cn("p-3 rounded-xl", card.bg, card.color)}>
                <card.icon size={24} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t flex items-center gap-1 text-xs text-muted-foreground">
              <span className="text-emerald-600 font-bold">●</span>
              {card.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b flex items-center justify-between bg-accent/10">
              <h3 className="font-bold flex items-center gap-2">
                <Clock size={18} className="text-primary" />
                Recent Documents
              </h3>
              <Link href="/documents" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                View all
                <ChevronRight size={14} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-muted-foreground uppercase text-[10px] font-bold bg-accent/30 tracking-wider">
                    <th className="px-6 py-3">Document</th>
                    <th className="px-6 py-3">Last Updated</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats?.recentActivity?.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-muted-foreground italic">
                        No documents found yet.
                      </td>
                    </tr>
                  ) : (
                    stats?.recentActivity?.map((doc: any) => (
                      <tr key={doc.id} className="hover:bg-accent/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold truncate max-w-[200px]">{doc.title}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{doc.fileName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(doc.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link 
                            href={doc.folderId ? `/documents?folderId=${doc.folderId}` : `/documents`}
                            className="text-primary hover:bg-primary/10 p-2 rounded-lg inline-flex transition-colors"
                          >
                            <ChevronRight size={18} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-2xl border shadow-sm">
            <div className="px-6 py-5 border-b bg-accent/10">
              <h3 className="font-bold flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                Category Distribution
              </h3>
            </div>
            <div className="p-6 space-y-6">
              {stats?.categoryDistribution?.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground italic">
                  No categories to show.
                </div>
              ) : (
                stats?.categoryDistribution?.map((cat: any, idx: number) => (
                  <div key={cat.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-muted-foreground">{cat.count} docs</span>
                    </div>
                    <div className="h-2 bg-accent rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          idx % 3 === 0 ? "bg-blue-500" : idx % 3 === 1 ? "bg-purple-500" : "bg-amber-500"
                        )}
                        style={{ width: `${Math.min(100, (cat.count / stats.totalDocuments) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground shadow-lg shadow-primary/20 relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <h3 className="font-bold text-lg">Need Help?</h3>
              <p className="text-primary-foreground/80 text-sm leading-relaxed">
                Check out the internal wiki for best practices on document management and organization.
              </p>
              <button className="bg-white text-primary px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-white/90 transition-colors">
                Open Wiki
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <FileText size={120} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
