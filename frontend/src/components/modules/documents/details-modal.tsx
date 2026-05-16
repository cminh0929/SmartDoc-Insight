"use client"

import * as React from "react"
import { 
  History, 
  Download, 
  Upload, 
  Clock, 
  User, 
  FileText, 
  Loader2,
  ExternalLink
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { documentsApi } from "@/lib/api"
import { cn } from "@/lib/utils"

interface DocumentDetailsModalProps {
  document: any | null
  isOpen: boolean
  onClose: () => void
}

export function DocumentDetailsModal({
  document,
  isOpen,
  onClose,
}: DocumentDetailsModalProps) {
  const [versions, setVersions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (isOpen && document) {
      loadVersions()
    }
  }, [isOpen, document])

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
    formData.append("ownerId", "00000000-0000-0000-0000-000000000000") // TODO: Use real userId

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

  if (!document) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="text-primary" size={24} />
            {document.title}
          </DialogTitle>
          <DialogDescription>
            Document Details & Version History
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <h4 className="text-sm font-semibold">Description</h4>
            <p className="text-sm text-muted-foreground bg-accent/30 p-3 rounded-lg border">
              {document.description || "No description provided for this document."}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <History size={16} />
                Version History
              </h4>
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
              <div className="border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-accent/50 text-muted-foreground uppercase text-[10px] font-bold">
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
      </DialogContent>
    </Dialog>
  )
}
