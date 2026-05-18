"use client"

import * as React from "react"
import { Upload, X, FileText, Loader2, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { documentsApi, tagsApi } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"

interface UploadDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function UploadDocumentModal({
  isOpen,
  onClose,
  onSuccess,
}: UploadDocumentModalProps) {
  const { user } = useAuth()
  const [file, setFile] = React.useState<File | null>(null)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [availableTags, setAvailableTags] = React.useState<any[]>([])
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([])
  const [newTagName, setNewTagName] = React.useState("")
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      loadTags()
    }
  }, [isOpen])

  const loadTags = async () => {
    try {
      const tags = await tagsApi.getAll()
      setAvailableTags(tags)
    } catch (err) {
      console.error("Failed to load tags:", err)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    try {
      setError(null)
      const tag = await tagsApi.create(newTagName.trim())
      setAvailableTags(prev => [...prev, tag])
      setSelectedTagIds(prev => [...prev, tag.id])
      setNewTagName("")
    } catch (err: any) {
      setError(err.message || "Failed to create tag.")
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      if (!title) {
        // Auto-fill title with filename without extension
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError("Please select a file to upload.")
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title)
      formData.append("description", description)
      formData.append("ownerId", user?.id || "00000000-0000-0000-0000-000000000000")
      if (selectedTagIds.length > 0) {
        formData.append("tagIds", JSON.stringify(selectedTagIds))
      }

      await documentsApi.create(formData)
      
      onSuccess()
      handleClose()
    } catch (err: any) {
      setError(err.message || "Failed to upload document.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setTitle("")
    setDescription("")
    setSelectedTagIds([])
    setNewTagName("")
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add a new document to the IT support knowledge base.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">File</Label>
              {file ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-accent/20">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="text-primary shrink-0" size={20} />
                    <span className="text-sm font-medium truncate">{file.name}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setFile(null)}
                    className="text-muted-foreground hover:text-destructive animate-fade-in"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-accent/50 transition-colors cursor-pointer relative">
                  <Upload className="text-muted-foreground mb-2" size={24} />
                  <p className="text-xs text-muted-foreground">Click to browse or drag and drop</p>
                  <Input 
                    id="file" 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handleFileChange}
                    required
                  />
                </div>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Document title"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Brief summary of the document"
                className="resize-none"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5 p-2 border rounded-lg bg-card min-h-[44px]">
                {availableTags.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">No tags available.</span>
                ) : (
                  availableTags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer select-none",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm scale-102"
                            : "bg-muted/50 hover:bg-muted text-muted-foreground border-transparent"
                        )}
                      >
                        {tag.name}
                      </button>
                    )
                  })
                )}
              </div>
              
              {(user?.role === 'admin' || user?.role === 'staff') && (
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="New tag name..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="h-8 text-xs flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleCreateTag()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 text-xs px-3 flex items-center gap-1 shrink-0"
                    onClick={handleCreateTag}
                  >
                    <Plus size={12} />
                    Add Tag
                  </Button>
                </div>
              )}
            </div>

            {error && (
              <p className="text-xs font-medium text-destructive">{error}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !file}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
