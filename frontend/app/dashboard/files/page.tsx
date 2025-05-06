"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-provider"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Search,
  Trash2,
  Download,
  Eye,
  FileText,
  ImageIcon,
  FileArchive,
  FileIcon as FilePdf,
  AlertCircle,
} from "lucide-react"
import { TablePagination } from "@/components/table-pagination"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import axios from "axios"

export default function FilesPage() {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [addFileOpen, setAddFileOpen] = useState(false)
  const [viewFileOpen, setViewFileOpen] = useState(false)
  const [deleteFileOpen, setDeleteFileOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [partitionFilter, setPartitionFilter] = useState<string>("all")
  const [files, setFiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token] = useLocalStorage("authToken", "")
  const itemsPerPage = 10

  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/files/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page: currentPage,
            per_page: itemsPerPage,
            file_type: typeFilter !== "all" ? typeFilter : undefined,
            partition_id: partitionFilter !== "all" ? partitionFilter : undefined,
          },
        })

        setFiles(response.data.files)
        setTotalItems(response.data.total)
        setTotalPages(response.data.pages)
        setIsLoading(false)
      } catch (err) {
        console.error("Failed to fetch files:", err)
        if (axios.isAxiosError(err) && err.response) {
          if (err.response.status === 401) {
            setError("Authentication failed. Please log in again.")
          } else {
            setError(`Error: ${err.response.status} ${err.response.statusText}`)
          }
        } else {
          setError("Failed to load files. Please try again later.")
        }
        setIsLoading(false)
      }
    }

    fetchFiles()
  }, [token, currentPage, itemsPerPage, typeFilter, partitionFilter])

  const handleViewFile = (file: any) => {
    setSelectedFile(file)
    setViewFileOpen(true)
  }

  const handleDeleteFile = async (file: any) => {
    setSelectedFile(file)
    setDeleteFileOpen(true)
  }

  const confirmDeleteFile = async () => {
    if (!selectedFile) return

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/files/${selectedFile.file_id || selectedFile.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Refresh the file list
      setDeleteFileOpen(false)
      setCurrentPage(1) // Reset to first page
      // Trigger refetch by changing a dependency in the useEffect
      setTypeFilter(typeFilter)
    } catch (err) {
      console.error("Failed to delete file:", err)
      if (axios.isAxiosError(err) && err.response) {
        setError(`Error deleting file: ${err.response.data.error || err.response.statusText}`)
      } else {
        setError("Failed to delete file. Please try again later.")
      }
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FilePdf className="h-4 w-4 text-red-500" />
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

  const handleDownloadFile = async (file: any) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/files/${file.file_id || file.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        },
      )

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", file.file_name || file.name)
      document.body.appendChild(link)
      link.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    } catch (err) {
      console.error("Failed to download file:", err)
      if (axios.isAxiosError(err) && err.response) {
        setError(`Error downloading file: ${err.response.data.error || err.response.statusText}`)
      } else {
        setError("Failed to download file. Please try again later.")
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("files")}</h1>
        <Dialog open={addFileOpen} onOpenChange={setAddFileOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setAddFileOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addFile")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("addFile")}</DialogTitle>
              <DialogDescription>Upload a new file to a partition</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file-upload" className="text-right">
                  File
                </Label>
                <Input id="file-upload" type="file" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file-partition" className="text-right">
                  Partition
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select partition" />
                  </SelectTrigger>
                  <SelectContent>{/* Partitions will be loaded dynamically */}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file-description" className="text-right">
                  Description
                </Label>
                <Input id="file-description" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setAddFileOpen(false)}>
                {t("save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("fileList")}</CardTitle>
          <CardDescription>Manage your files across partitions</CardDescription>
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
                value={partitionFilter}
                onValueChange={(value) => {
                  setPartitionFilter(value)
                  setCurrentPage(1) // Reset to first page on filter change
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by partition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Partitions</SelectItem>
                  {/* Partitions will be loaded dynamically */}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="uppercase">{t("fileName")}</TableHead>
                  <TableHead className="uppercase">Type</TableHead>
                  <TableHead className="uppercase">{t("fileSize")}</TableHead>
                  <TableHead className="uppercase">Partition</TableHead>
                  <TableHead className="uppercase">{t("uploadDate")}</TableHead>
                  <TableHead className="uppercase">Last Modified</TableHead>
                  <TableHead className="uppercase text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton
                  Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <TableRow key={`loading-${index}`}>
                        <TableCell>
                          <Skeleton className="h-5 w-48" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                ) : files && files.length > 0 ? (
                  files.map((file) => (
                    <TableRow key={file.id || file.file_id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.type || file.file_type)}
                          {file.name || file.file_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                            (file.type || file.file_type) === "pdf"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              : (file.type || file.file_type) === "image"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                : (file.type || file.file_type) === "archive"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                  : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          }`}
                        >
                          {(file.type || file.file_type).toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>{file.size || file.file_size}</TableCell>
                      <TableCell>{file.partitionName || file.partition_name}</TableCell>
                      <TableCell>{file.uploadDate || file.upload_date}</TableCell>
                      <TableCell>{file.lastModified || file.last_modified}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleViewFile(file)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDownloadFile(file)}>
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download</span>
                          </Button>
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
                      {error ? "Error loading files." : "No files found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {files && files.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
            {totalItems} files
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
                  {selectedFile && getFileIcon(selectedFile.type || selectedFile.file_type)}
                  {selectedFile?.name || selectedFile?.file_name}
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
                  <p className="text-sm text-muted-foreground">{selectedFile.type || selectedFile.file_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Size</p>
                  <p className="text-sm text-muted-foreground">{selectedFile.size || selectedFile.file_size}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Upload Date</p>
                  <p className="text-sm text-muted-foreground">{selectedFile.uploadDate || selectedFile.upload_date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Modified</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.lastModified || selectedFile.last_modified}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Partition</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.partitionName || selectedFile.partition_name}
                  </p>
                </div>
              </div>

              <div className="border rounded-md p-4 h-64 flex items-center justify-center">
                {(selectedFile.type || selectedFile.file_type) === "image" ? (
                  <div className="text-center">
                    <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Image preview would appear here</p>
                  </div>
                ) : (selectedFile.type || selectedFile.file_type) === "pdf" ? (
                  <div className="text-center">
                    <FilePdf className="h-16 w-16 mx-auto text-red-500" />
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
            <Button onClick={() => handleDownloadFile(selectedFile)}>
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
                Are you sure you want to delete file <strong>{selectedFile.name || selectedFile.file_name}</strong>?
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
