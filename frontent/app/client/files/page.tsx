"use client"

import { useState } from "react"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Download,
  Eye,
  FileArchive,
  FileIcon,
  FileText,
  Fingerprint,
  ImageIcon,
  Lock,
  Search,
  Shield,
  Trash2,
  Unlock,
} from "lucide-react"
import { TablePagination } from "@/components/table-pagination"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import axios from "axios"
import { toast } from "@/hooks/use-toast"

export default function ClientFilesPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [viewFileOpen, setViewFileOpen] = useState(false)
  const [deleteFileOpen, setDeleteFileOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [encryptionFilter, setEncryptionFilter] = useState<string>("all")
  const [files, setFiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true)
      try {
        const token = localStorage.getItem("access_token")

        if (!token) {
          setError("Authentication token not found")
          setIsLoading(false)
          return
        }

        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/files/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            user_id: user?.user_id,
          },
        })

        setFiles(response.data.files || [])
        setError(null)
      } catch (err) {
        console.error("Failed to fetch files:", err)
        setError("Failed to load files. Please try again later.")
        setFiles([])
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchFiles()
    }
  }, [user])

  const filteredFiles = files.filter((file) => {
    // Text search filter
    const matchesSearch =
      (file.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (file.type?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (file.partitionName?.toLowerCase() || "").includes(searchQuery.toLowerCase())

    // Type filter
    const matchesType = typeFilter === "all" || file.type === typeFilter

    // Encryption filter
    const matchesEncryption =
      encryptionFilter === "all" ||
      (encryptionFilter === "encrypted" && file.encrypted) ||
      (encryptionFilter === "unencrypted" && !file.encrypted)

    // Return true only if all active filters match
    return matchesSearch && matchesType && matchesEncryption
  })

  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage)
  const paginatedFiles = filteredFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleViewFile = (file: any) => {
    setSelectedFile(file)
    setViewFileOpen(true)
  }

  const handleDeleteFile = (file: any) => {
    setSelectedFile(file)
    setDeleteFileOpen(true)
  }

  const confirmDeleteFile = async () => {
    if (!selectedFile) return

    try {
      const token = localStorage.getItem("access_token")
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/files/${selectedFile.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Remove file from state
      setFiles(files.filter((file) => file.id !== selectedFile.id))
      setDeleteFileOpen(false)
      toast({
        title: "Success",
        description: "File deleted successfully",
      })
    } catch (err) {
      console.error("Failed to delete file:", err)
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getFileIcon = (type = "") => {
    switch (type) {
      case "pdf":
        return <FileIcon className="h-4 w-4 text-red-500" />
      case "image":
        return <ImageIcon className="h-4 w-4 text-blue-500" />
      case "archive":
        return <FileArchive className="h-4 w-4 text-yellow-500" />
      case "text":
        return <FileText className="h-4 w-4 text-green-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Files</h1>
        <Button onClick={() => router.push("/client/file-manager")}>Upload New File</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Files</CardTitle>
          <CardDescription>View and manage your personal files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("search")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1) // Reset to first page on search
                }}
                className="max-w-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value)
                  setCurrentPage(1) // Reset to first page on filter change
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="archive">Archive</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={encryptionFilter}
                onValueChange={(value) => {
                  setEncryptionFilter(value)
                  setCurrentPage(1) // Reset to first page on filter change
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by security" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Files</SelectItem>
                  <SelectItem value="encrypted">Encrypted Only</SelectItem>
                  <SelectItem value="unencrypted">Unencrypted Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="uppercase">File Name</TableHead>
                  <TableHead className="uppercase">Type</TableHead>
                  <TableHead className="uppercase">Size</TableHead>
                  <TableHead className="uppercase">Location</TableHead>
                  <TableHead className="uppercase">Upload Date</TableHead>
                  <TableHead className="uppercase">Security</TableHead>
                  <TableHead className="uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Loading files...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-red-500">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : paginatedFiles.length > 0 ? (
                  paginatedFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.type)}
                          {file.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                            file.type === "pdf"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              : file.type === "image"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                : file.type === "archive"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                  : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          }`}
                        >
                          {file.type?.toUpperCase() || "UNKNOWN"}
                        </span>
                      </TableCell>
                      <TableCell>{file.size || "N/A"}</TableCell>
                      <TableCell>{file.partitionName || "N/A"}</TableCell>
                      <TableCell>{file.uploadDate || "N/A"}</TableCell>
                      <TableCell>
                        {file.encrypted ? (
                          <div className="flex items-center gap-1 text-primary">
                            <Lock className="h-4 w-4" />
                            <span className="text-xs">Encrypted</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Unlock className="h-4 w-4" />
                            <span className="text-xs">Unencrypted</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleViewFile(file)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download</span>
                          </Button>
                          {file.encrypted ? (
                            <Button variant="ghost" size="icon">
                              <Fingerprint className="h-4 w-4 text-primary" />
                              <span className="sr-only">Decrypt</span>
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon">
                              <Shield className="h-4 w-4" />
                              <span className="sr-only">Encrypt</span>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(file)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">{t("deleteFile")}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No files found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {filteredFiles.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredFiles.length)} of {filteredFiles.length} files
          </div>
          <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}

      {/* View File Dialog */}
      <Dialog open={viewFileOpen} onOpenChange={setViewFileOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedFile && (
                <div className="flex items-center gap-2">
                  {selectedFile && getFileIcon(selectedFile.type)}
                  {selectedFile?.name || "Unnamed File"}
                </div>
              )}
            </DialogTitle>
            <DialogDescription>File details and preview</DialogDescription>
          </DialogHeader>
          {selectedFile && (
            <div className="py-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-sm text-muted-foreground">{selectedFile.type || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Size</p>
                  <p className="text-sm text-muted-foreground">{selectedFile.size || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Upload Date</p>
                  <p className="text-sm text-muted-foreground">{selectedFile.uploadDate || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Security</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.encrypted ? "Encrypted" : "Unencrypted"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{selectedFile.partitionName || "Unknown"}</p>
                </div>
              </div>

              <div className="border rounded-md p-4 h-64 flex items-center justify-center">
                {selectedFile.type === "image" ? (
                  <div className="text-center">
                    <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Image preview would appear here</p>
                  </div>
                ) : selectedFile.type === "pdf" ? (
                  <div className="text-center">
                    <FileIcon className="h-16 w-16 mx-auto text-red-500" />
                    <p className="mt-2 text-sm text-muted-foreground">PDF preview would appear here</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">File preview not available</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewFileOpen(false)}>
              Close
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete File Dialog */}
      <Dialog open={deleteFileOpen} onOpenChange={setDeleteFileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("deleteFile")}</DialogTitle>
            <DialogDescription>{t("confirmDelete")}</DialogDescription>
          </DialogHeader>
          {selectedFile && (
            <div className="py-4">
              <p>
                Are you sure you want to delete file <strong>{selectedFile.name || "Unnamed File"}</strong>?
              </p>
              <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFileOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteFile}>
              {t("deleteFile")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
