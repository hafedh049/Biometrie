"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Upload,
  Lock,
  Unlock,
  FileText,
  HardDrive,
  Layers,
  Shield,
  Download,
  Eye,
  Trash2,
  Fingerprint,
  ImageIcon,
  FileArchive,
  FileIcon as FilePdf,
} from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"
import FingerprintScanner from "@/components/fingerprint-scanner"
import { TablePagination } from "@/components/table-pagination"

export default function FileManagerPage() {
  const { t } = useLanguage()
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [selectedPartition, setSelectedPartition] = useState<string>("")
  const [encryptFile, setEncryptFile] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannerMode, setScannerMode] = useState<"encrypt" | "decrypt">("encrypt")
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [encryptionFilter, setEncryptionFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const itemsPerPage = 10

  // Mock devices and partitions data
  const devices = [
    { id: "1", name: "Main Server HDD", type: "hardDisk" },
    { id: "2", name: "Backup Drive", type: "hardDisk" },
    { id: "3", name: "User Data Flash Drive", type: "flashDrive" },
  ]

  const partitions = [
    { id: "1", name: "System Partition", deviceId: "1", format: "NTFS" },
    { id: "2", name: "Data Partition", deviceId: "1", format: "NTFS" },
    { id: "3", name: "Backup Partition", deviceId: "2", format: "exFAT" },
    { id: "4", name: "User Data", deviceId: "3", format: "FAT32" },
  ]

  // Mock files data
  const files = [
    {
      id: "1",
      name: "Annual Report 2023.pdf",
      type: "pdf",
      size: "2.4 MB",
      partitionId: "1",
      partitionName: "System Partition",
      deviceId: "1",
      deviceName: "Main Server HDD",
      uploadDate: "2023-04-15",
      encrypted: true,
      owner: "admin",
    },
    {
      id: "2",
      name: "Company Logo.png",
      type: "image",
      size: "156 KB",
      partitionId: "1",
      partitionName: "System Partition",
      deviceId: "1",
      deviceName: "Main Server HDD",
      uploadDate: "2023-03-10",
      encrypted: false,
      owner: "admin",
    },
    {
      id: "3",
      name: "User Data Backup.zip",
      type: "archive",
      size: "1.2 GB",
      partitionId: "3",
      partitionName: "Backup Partition",
      deviceId: "2",
      deviceName: "Backup Drive",
      uploadDate: "2023-04-01",
      encrypted: true,
      owner: "john.doe",
    },
    {
      id: "4",
      name: "System Configuration.txt",
      type: "text",
      size: "12 KB",
      partitionId: "2",
      partitionName: "Data Partition",
      deviceId: "1",
      deviceName: "Main Server HDD",
      uploadDate: "2023-02-20",
      encrypted: false,
      owner: "admin",
    },
    {
      id: "5",
      name: "Financial Report Q1.pdf",
      type: "pdf",
      size: "3.1 MB",
      partitionId: "2",
      partitionName: "Data Partition",
      deviceId: "1",
      deviceName: "Main Server HDD",
      uploadDate: "2023-01-15",
      encrypted: true,
      owner: "jane.smith",
    },
    {
      id: "6",
      name: "Employee Photos.zip",
      type: "archive",
      size: "45 MB",
      partitionId: "4",
      partitionName: "User Data",
      deviceId: "3",
      deviceName: "User Data Flash Drive",
      uploadDate: "2023-03-05",
      encrypted: true,
      owner: "admin",
    },
  ]

  // Filter available partitions based on selected device
  const availablePartitions = selectedDevice
    ? partitions.filter((partition) => partition.deviceId === selectedDevice)
    : []

  // Filter files based on search and filters
  const filteredFiles = files.filter((file) => {
    // Text search filter
    const matchesSearch =
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.partitionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.deviceName.toLowerCase().includes(searchQuery.toLowerCase())

    // Encryption filter
    const matchesEncryption =
      encryptionFilter === "all" ||
      (encryptionFilter === "encrypted" && file.encrypted) ||
      (encryptionFilter === "unencrypted" && !file.encrypted)

    // Type filter
    const matchesType = typeFilter === "all" || file.type === typeFilter

    // Return true only if all active filters match
    return matchesSearch && matchesEncryption && matchesType
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage)
  const paginatedFiles = filteredFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleFileUpload = () => {
    if (!selectedDevice || !selectedPartition) {
      toast({
        title: "Error",
        description: "Please select a device and partition first",
        variant: "destructive",
      })
      return
    }

    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (encryptFile) {
      // If encryption is enabled, open fingerprint scanner
      setScannerMode("encrypt")
      setScannerOpen(true)
    } else {
      // Otherwise, proceed with upload
      processUpload()
    }
  }

  const processUpload = () => {
    setIsUploading(true)
    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false)
      toast({
        title: "Success",
        description: "File uploaded successfully",
      })
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }, 2000)
  }

  const handleEncryptDecrypt = (file: any, mode: "encrypt" | "decrypt") => {
    setSelectedFile(file)
    setScannerMode(mode)
    setScannerOpen(true)
  }

  const handleFingerprintCapture = (fingerprintData: string) => {
    setScannerOpen(false)

    // Simulate processing
    toast({
      title: "Processing",
      description: `Fingerprint captured. ${scannerMode === "encrypt" ? "Encrypting" : "Decrypting"} file...`,
    })

    setTimeout(() => {
      if (scannerMode === "encrypt") {
        // For upload with encryption
        processUpload()
      } else {
        // For decryption of existing file
        toast({
          title: "Success",
          description: `File ${selectedFile.name} has been decrypted`,
        })
      }
    }, 1500)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">File Manager</h1>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="manage">Manage Files</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>Upload files to a specific device and partition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Device Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="device">Select Device</Label>
                      <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                        <SelectTrigger id="device">
                          <SelectValue placeholder="Select a storage device" />
                        </SelectTrigger>
                        <SelectContent>
                          {devices.map((device) => (
                            <SelectItem key={device.id} value={device.id}>
                              <div className="flex items-center gap-2">
                                <HardDrive className="h-4 w-4" />
                                <span>{device.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Partition Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="partition">Select Partition</Label>
                      <Select
                        value={selectedPartition}
                        onValueChange={setSelectedPartition}
                        disabled={!selectedDevice || availablePartitions.length === 0}
                      >
                        <SelectTrigger id="partition">
                          <SelectValue
                            placeholder={
                              !selectedDevice
                                ? "Select a device first"
                                : availablePartitions.length === 0
                                  ? "No partitions available"
                                  : "Select a partition"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePartitions.map((partition) => (
                            <SelectItem key={partition.id} value={partition.id}>
                              <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4" />
                                <span>
                                  {partition.name} ({partition.format})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Encryption Option */}
                  <div className="flex items-center space-x-2">
                    <Switch id="encrypt" checked={encryptFile} onCheckedChange={setEncryptFile} />
                    <Label htmlFor="encrypt" className="flex items-center gap-2">
                      <Shield className={`h-4 w-4 ${encryptFile ? "text-primary" : "text-muted-foreground"}`} />
                      Encrypt file with fingerprint
                    </Label>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleFileUpload}
                      disabled={!selectedDevice || !selectedPartition || isUploading}
                      className="w-full md:w-auto"
                    >
                      {isUploading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          className="mr-2"
                        >
                          <Upload className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      {isUploading ? "Uploading..." : "Select File"}
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileSelected}
                      multiple={false}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Upload Instructions</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    <li>Select a storage device and partition where you want to upload the file</li>
                    <li>
                      Enable encryption if you want to secure your file with fingerprint authentication (recommended for
                      sensitive data)
                    </li>
                    <li>Click "Select File" to choose a file from your computer</li>
                    <li>
                      If encryption is enabled, you'll be prompted to scan your fingerprint to encrypt the file during
                      upload
                    </li>
                    <li>
                      Only users with matching fingerprints will be able to decrypt and access encrypted files later
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage Files</CardTitle>
              <CardDescription>View, download, and manage your files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1)
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={encryptionFilter}
                      onValueChange={(value) => {
                        setEncryptionFilter(value)
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by encryption" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Files</SelectItem>
                        <SelectItem value="encrypted">Encrypted Only</SelectItem>
                        <SelectItem value="unencrypted">Unencrypted Only</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={typeFilter}
                      onValueChange={(value) => {
                        setTypeFilter(value)
                        setCurrentPage(1)
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
                  </div>
                </div>

                {/* Files Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="uppercase">File Name</TableHead>
                        <TableHead className="uppercase">Type</TableHead>
                        <TableHead className="uppercase">Size</TableHead>
                        <TableHead className="uppercase">Location</TableHead>
                        <TableHead className="uppercase">Uploaded</TableHead>
                        <TableHead className="uppercase">Security</TableHead>
                        <TableHead className="uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedFiles.map((file) => (
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
                              {file.type.toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell>{file.size}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">{file.deviceName}</span>
                              <span>{file.partitionName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{file.uploadDate}</TableCell>
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
                            <div className="flex justify-end gap-1">
                              {file.encrypted ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEncryptDecrypt(file, "decrypt")}
                                  title="Decrypt with fingerprint"
                                >
                                  <Fingerprint className="h-4 w-4 text-primary" />
                                  <span className="sr-only">Decrypt</span>
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEncryptDecrypt(file, "encrypt")}
                                  title="Encrypt with fingerprint"
                                >
                                  <Shield className="h-4 w-4" />
                                  <span className="sr-only">Encrypt</span>
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" title="View file">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button variant="ghost" size="icon" title="Download file">
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download</span>
                              </Button>
                              <Button variant="ghost" size="icon" title="Delete file">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {paginatedFiles.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            No files found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {filteredFiles.length > 0 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, filteredFiles.length)} of {filteredFiles.length} files
                    </div>
                    <TablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fingerprint Scanner Dialog */}
      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {scannerMode === "encrypt" ? "Encrypt File with Fingerprint" : "Decrypt File with Fingerprint"}
            </DialogTitle>
            <DialogDescription>
              {scannerMode === "encrypt"
                ? "Scan your fingerprint to encrypt the file. Only you will be able to decrypt it later."
                : "Scan your fingerprint to decrypt the file."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <FingerprintScanner onCapture={handleFingerprintCapture} mode="scanner" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScannerOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
