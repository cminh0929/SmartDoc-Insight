"use client"

import * as React from "react"
import { FolderPlus, Loader2 } from "lucide-react"
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
import { foldersApi } from "@/lib/api"

interface CreateFolderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  parentId?: string | null
}

export function CreateFolderModal({
  isOpen,
  onClose,
  onSuccess,
  parentId = null,
}: CreateFolderModalProps) {
  const [name, setName] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      setIsSubmitting(true)
      setError(null)

      await foldersApi.create({
        name: name.trim(),
        parentId: parentId,
      })
      
      onSuccess()
      handleClose()
    } catch (err: any) {
      setError(err.message || "Failed to create folder.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setName("")
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              {parentId ? "Create a sub-folder to organize your documents." : "Create a new root folder for your documentation."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <div className="relative">
                <Input 
                  id="folder-name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Server Guides, Networking..."
                  className="pl-9"
                  required
                  autoFocus
                />
                <FolderPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              </div>
            </div>

            {error && (
              <p className="text-xs font-medium text-destructive">{error}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Folder"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
