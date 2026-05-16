"use client"

import * as React from "react"
import { Bell, Search, User, FileText, Loader2, X } from "lucide-react"
import { searchApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function Header() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [results, setResults] = React.useState<any[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const searchRef = React.useRef<HTMLDivElement>(null)
  const router = useRouter()

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  React.useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.trim().length < 2) {
        setResults([])
        return
      }
      try {
        setIsSearching(true)
        const data = await searchApi.query(searchQuery)
        setResults(data || [])
      } catch (error) {
        console.error("Search failed:", error)
      } finally {
        setIsSearching(false)
      }
    }

    const timer = setTimeout(fetchResults, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsDropdownOpen(false)
    }
  }

  return (
    <header className="h-16 border-b bg-card px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex-1 max-w-xl relative group" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search documents, folders, or keywords..." 
            className="w-full bg-accent/50 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsDropdownOpen(true)}
          />
        </div>

        {/* Search Results Dropdown */}
        {isDropdownOpen && searchQuery.trim() && (
          <div className="absolute top-full left-0 w-full mt-2 bg-card border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-2 border-b bg-accent/10 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-2">Quick Results</span>
              <Link 
                href={`/search?q=${encodeURIComponent(searchQuery)}`}
                className="text-[10px] font-bold text-primary hover:underline px-2"
                onClick={() => setIsDropdownOpen(false)}
              >
                See all results
              </Link>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {isSearching ? (
                <div className="p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  Searching...
                </div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">No results found for "{searchQuery}"</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Try different keywords</p>
                </div>
              ) : (
                results.map((doc) => (
                  <Link 
                    key={doc.id} 
                    href={`/documents?folderId=${doc.folderId}`}
                    className="flex items-center gap-4 p-4 hover:bg-accent transition-all group"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="bg-blue-50 text-blue-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{doc.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{doc.description || "No description"}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2 text-muted-foreground hover:bg-accent rounded-xl transition-all relative group">
          <Bell size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold border cursor-pointer hover:border-primary transition-colors">
          AD
        </div>
      </div>
    </header>
  )
}
