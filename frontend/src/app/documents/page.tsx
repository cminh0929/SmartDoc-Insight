"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { 
  FileText, 
  Search, 
  Plus, 
  MoreVertical, 
  Download, 
  Trash2,
  FileIcon,
  Filter,
  Tag as TagIcon
} from "lucide-react"
import { documentsApi, tagsApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import { UploadDocumentModal } from "@/components/modules/documents/upload-modal"
import { DocumentDetailsModal } from "@/components/modules/documents/details-modal"

function DocumentsContent() {
  const searchParams = useSearchParams()
  const folderId = searchParams.get('folderId')
  
  const [documents, setDocuments] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [selectedFilterTagId, setSelectedFilterTagId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  useEffect(() => {
    loadDocuments()
    loadTags()
  }, [folderId])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const data = await documentsApi.getAll(folderId || undefined)
      setDocuments(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadTags = async () => {
    try {
      const data = await tagsApi.getAll()
      setTags(data)
    } catch (err) {
      console.error("Failed to load tags:", err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return
    
    try {
      await documentsApi.delete(id)
      setDocuments(documents.filter(doc => doc.id !== id))
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`)
    }
  }

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTag = !selectedFilterTagId || (doc.tags && doc.tags.some((t: any) => t.id === selectedFilterTagId))
    
    return matchesSearch && matchesTag
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">Manage and organize your IT support documents.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span>New Document</span>
          </button>
        </div>
      </div>

      {/* Horizontal Tag Filters */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-accent/20">
          <TagIcon size={14} className="text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground font-medium shrink-0">Filter by Tag:</span>
          <button
            onClick={() => setSelectedFilterTagId(null)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer shrink-0 select-none",
              !selectedFilterTagId
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card hover:bg-accent text-muted-foreground border-transparent"
            )}
          >
            All
          </button>
          {tags.map((tag) => {
            const isSelected = selectedFilterTagId === tag.id
            return (
              <button
                key={tag.id}
                onClick={() => setSelectedFilterTagId(isSelected ? null : tag.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer shrink-0 select-none",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card hover:bg-accent text-muted-foreground border-muted-foreground/10"
                )}
              >
                {tag.name}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search by title or description..." 
            className="w-full bg-accent/50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg hover:bg-accent transition-colors w-full md:w-auto justify-center">
            <Filter size={16} />
            Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg hover:bg-accent transition-colors w-full md:w-auto justify-center">
            Sort: Newest
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground animate-pulse">Loading documents...</p>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 p-8 rounded-xl text-center">
          <p className="text-destructive font-medium">Error loading documents</p>
          <p className="text-sm text-destructive/80 mt-1">{error}</p>
          <button 
            onClick={loadDocuments}
            className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-card border border-dashed p-20 rounded-xl text-center space-y-4">
          <div className="bg-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
            <FileIcon size={32} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No documents found</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mt-1">
              {searchQuery || selectedFilterTagId ? `No results found. Try clearing filters.` : "Start by uploading your first document to the system."}
            </p>
          </div>
          {!searchQuery && !selectedFilterTagId && (
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="text-primary font-medium hover:underline flex items-center gap-2 mx-auto"
            >
              <Plus size={16} />
              Upload now
            </button>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-muted-foreground text-sm uppercase tracking-wider bg-accent/30">
                  <th className="px-6 py-4 font-medium">Document</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Modified</th>
                  <th className="px-6 py-4 font-medium">Owner</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredDocs.map((doc) => (
                  <tr 
                    key={doc.id} 
                    className="hover:bg-accent/50 transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedDoc(doc)
                      setIsDetailsModalOpen(true)
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg group-hover:scale-110 transition-all mt-0.5">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{doc.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{doc.description || "No description"}</p>
                          {doc.tags && doc.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {doc.tags.map((tag: any) => (
                                <span 
                                  key={tag.id} 
                                  className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/10 shadow-xs"
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        doc.isArchived ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"
                      )}>
                        {doc.isArchived ? "Archived" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      Admin
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors" 
                          title="Download"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors" 
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(doc.id)
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                        <button 
                          className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <UploadDocumentModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onSuccess={() => {
          loadDocuments()
          loadTags()
        }} 
      />

      <DocumentDetailsModal 
        document={selectedDoc}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedDoc(null)
        }}
        onTagsUpdated={() => {
          loadDocuments()
          loadTags()
        }}
      />
    </div>
  )
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div>Loading page...</div>}>
      <DocumentsContent />
    </Suspense>
  )
}
