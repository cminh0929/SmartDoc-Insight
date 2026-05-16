"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { searchApi } from "@/lib/api"
import { 
  Search, 
  FileText, 
  ChevronRight, 
  Loader2, 
  SearchX,
  Clock,
  Tag,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Suspense } from "react"

function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  
  const [results, setResults] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (query) {
      handleSearch()
    } else {
      setResults([])
    }
  }, [query])

  const handleSearch = async () => {
    try {
      setLoading(true)
      const data = await searchApi.query(query)
      setResults(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Search className="text-primary" size={32} />
            Search Results
          </h1>
          <p className="text-muted-foreground mt-1">
            {loading ? "Searching..." : `Showing ${results.length} results for "${query}"`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-muted-foreground animate-pulse">Searching through documents...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed py-20 flex flex-col items-center justify-center text-center px-4">
          <div className="bg-accent/30 p-4 rounded-full mb-4">
            <SearchX size={48} className="text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold">No results found</h3>
          <p className="text-muted-foreground max-w-xs mt-2">
            We couldn't find any documents matching your search. Try different keywords or check for typos.
          </p>
          <Link 
            href="/documents" 
            className="mt-6 text-primary font-semibold hover:underline flex items-center gap-2"
          >
            Browse all documents
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {results.map((doc) => (
            <div 
              key={doc.id} 
              className="bg-card rounded-2xl border p-6 hover:shadow-md hover:border-primary/50 transition-all group relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-6 relative z-10">
                <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl group-hover:scale-110 transition-transform shrink-0">
                  <FileText size={32} />
                </div>
                
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors truncate">
                      {doc.title}
                    </h3>
                    <span className="bg-accent text-accent-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                      Document
                    </span>
                  </div>
                  
                  <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                    {doc.description || "No description provided for this document."}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      Updated {new Date(doc.updatedAt).toLocaleDateString()}
                    </div>
                    {doc.folderId && (
                      <div className="flex items-center gap-1.5">
                        <Tag size={14} />
                        Folder ID: {doc.folderId}
                      </div>
                    )}
                  </div>
                </div>

                <Link 
                  href={`/documents?folderId=${doc.folderId}`}
                  className="bg-accent hover:bg-primary hover:text-primary-foreground p-3 rounded-xl transition-all self-center md:self-start group-hover:translate-x-1"
                >
                  <ChevronRight size={24} />
                </Link>
              </div>
              
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    }>
      <SearchResults />
    </Suspense>
  )
}
