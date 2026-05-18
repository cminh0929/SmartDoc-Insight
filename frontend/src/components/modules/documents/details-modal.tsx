"use client"

import * as React from "react"
import { 
  History, 
  Download, 
  Upload, 
  Clock, 
  FileText, 
  Loader2,
  Tag,
  Share2
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { documentsApi, tagsApi } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { PermissionsModal } from "../permissions/permissions-modal"

interface DocumentDetailsModalProps {
  document: any | null
  isOpen: boolean
  onClose: () => void
  onTagsUpdated?: () => void
}

export function DocumentDetailsModal({
  document,
  isOpen,
  onClose,
  onTagsUpdated,
}: DocumentDetailsModalProps) {
  const { user } = useAuth()
  const [versions, setVersions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [isPermissionsOpen, setIsPermissionsOpen] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Tags state
  const [docTags, setDocTags] = React.useState<any[]>([])
  const [isEditingTags, setIsEditingTags] = React.useState(false)
  const [allAvailableTags, setAllAvailableTags] = React.useState<any[]>([])
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([])
  const [isSavingTags, setIsSavingTags] = React.useState(false)

  React.useEffect(() => {
    if (isOpen && document) {
      loadVersions()
      setDocTags(document.tags || [])
      setSelectedTagIds((document.tags || []).map((t: any) => t.id))
      loadAllTags()
    }
  }, [isOpen, document])

  const loadAllTags = async () => {
    try {
      const tags = await tagsApi.getAll()
      setAllAvailableTags(tags)
    } catch (err) {
      console.error("Failed to load available tags:", err)
    }
  }

  const loadVersions = async () => {
    if (!document) return
    try {
      setLoading(true)
      const data = await documentsApi.getVersions(document.id)
      setVersions(data)
    } catch (error) {
      console.error("Failed to load versions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadNewVersion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !document) return

    const formData = new FormData()
    formData.append("file", file)
    formData.append("ownerId", user?.id || "00000000-0000-0000-0000-000000000000")

    try {
      setIsUploading(true)
      await documentsApi.addVersion(document.id, formData)
      await loadVersions()
    } catch (error) {
      console.error("Upload version failed:", error)
      alert("Failed to upload new version.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  const handleSaveTags = async () => {
    if (!document) return
    try {
      setIsSavingTags(true)
      const updatedDoc = await documentsApi.updateTags(document.id, selectedTagIds)
      setDocTags(updatedDoc.tags || [])
      setIsEditingTags(false)
      if (onTagsUpdated) {
        onTagsUpdated()
      }
    } catch (err) {
      console.error("Failed to save tags:", err)
      alert("Failed to save tags.")
    } finally {
      setIsSavingTags(false)
    }
  }

  if (!document) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileText className="text-primary shrink-0" size={24} />
            <span className="truncate">{document.title}</span>
          </DialogTitle>
          <DialogDescription>
            Document Details & Version History
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <h4 className="text-sm font-semibold">Description</h4>
            <p className="text-sm text-muted-foreground bg-accent/20 p-3 rounded-lg border">
              {document.description || "No description provided for this document."}
            </p>
          </div>

          {/* Tags section */}
          <div className="grid gap-2">
            <h4 className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag size={14} className="text-muted-foreground" />
                Tags
              </span>
              {isEditingTags ? (
                <div className="flex items-center gap-1.5">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs font-normal text-muted-foreground px-2"
                    onClick={() => {
                      setIsEditingTags(false)
                      setSelectedTagIds(docTags.map(t => t.id))
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    variant="default" 
                    size="sm" 
                    className="h-7 text-xs font-medium px-2.5"
                    onClick={handleSaveTags}
                    disabled={isSavingTags}
                  >
                    {isSavingTags ? <Loader2 size={12} className="animate-spin" /> : "Save"}
                  </Button>
                </div>
              ) : (
                (user?.role === 'admin' || user?.role === 'staff') && (
                  <button
                    type="button"
                    onClick={() => setIsEditingTags(true)}
                    className="text-xs text-primary hover:underline font-normal cursor-pointer"
                  >
                    Edit Tags
                  </button>
                )
              )}
            </h4>

            {isEditingTags ? (
              <div className="space-y-2 bg-accent/10 p-3 rounded-lg border">
                <div className="flex flex-wrap gap-1.5 min-h-[44px]">
                  {allAvailableTags.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">No tags available.</span>
                  ) : (
                    allAvailableTags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id)
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTagSelection(tag.id)}
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer select-none",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background hover:bg-muted text-muted-foreground border-transparent"
                          )}
                        >
                          {tag.name}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 min-h-[30px] items-center">
                {docTags.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">No tags associated.</span>
                ) : (
                  docTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-primary/10 text-primary border-primary/20 animate-fade-in"
                    >
                      {tag.name}
                    </span>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <History size={16} className="text-muted-foreground" />
                Version History
              </h4>
              <div className="flex items-center gap-2">
                {(user?.role === 'admin' || document.ownerId === user?.id) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 text-primary border-primary/20 hover:bg-primary/5 hover:text-primary"
                    onClick={() => setIsPermissionsOpen(true)}
                  >
                    <Share2 size={14} />
                    <span>Share</span>
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-2"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Upload New Version
                </Button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleUploadNewVersion} 
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : versions.length === 0 ? (
              <p className="text-center py-10 text-sm text-muted-foreground italic border border-dashed rounded-xl">
                No version history found.
              </p>
            ) : (
              <div className="border rounded-xl overflow-hidden shadow-sm bg-card">
                <table className="w-full text-left text-sm">
                  <thead className="bg-accent/40 text-muted-foreground uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-3">Ver</th>
                      <th className="px-4 py-3">File Name</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {versions.map((v, idx) => (
                      <tr key={v.id} className={cn("hover:bg-accent/30 transition-colors", idx === 0 && "bg-primary/5")}>
                        <td className="px-4 py-3 font-bold">v{v.versionNumber}</td>
                        <td className="px-4 py-3 max-w-[200px] truncate">{v.fileName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{(v.fileSize / 1024).toFixed(1)} KB</td>
                        <td className="px-4 py-3 text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                          <Clock size={12} />
                          {new Date(v.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10">
                            <Download size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <PermissionsModal
          isOpen={isPermissionsOpen}
          onClose={() => setIsPermissionsOpen(false)}
          entityId={document.id}
          entityType="document"
          entityTitle={document.title}
        />
      </DialogContent>
    </Dialog>
  )
}
