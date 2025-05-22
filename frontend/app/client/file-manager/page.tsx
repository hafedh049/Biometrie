"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Loader2,
} from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"
import FingerprintScanner from "@/components/fingerprint-scanner"
import { TablePagination } from "@/components/table-pagination"
import { useAuth } from "@/contexts/auth-context"
import FileService from "@/services/file-service"
import axios from "axios" // Add axios import
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function ClientFileManagerPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [selectedPartition, setSelectedPartition] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannerMode, setScannerMode] = useState<"encrypt" | "decrypt" | "preview">("encrypt")
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [encryptionFilter, setEncryptionFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [totalFiles, setTotalFiles] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [files, setFiles] = useState<any[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [partitions, setPartitions] = useState<any[]>([])
  const itemsPerPage = 10
  const [selectedSizeUnit, setSelectedSizeUnit] = useState<string>("auto")
  // Add these new state variables at the top of the component with the other state declarations
  const [isViewingFile, setIsViewingFile] = useState(false)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [viewFileData, setViewFileData] = useState<{ file: any; url: string | null }>({ file: null, url: null })
  const [policiesAccepted, setPoliciesAccepted] = useState(false)
  const [termsDialogOpen, setTermsDialogOpen] = useState(false)
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false)

  useEffect(() => {
    fetchDevices()
    fetchAllPartitions() // Add this line to fetch all partitions
    fetchFiles()
  }, [currentPage, encryptionFilter, typeFilter])

  // Add this useEffect after the existing useEffect that fetches devices and partitions
  useEffect(() => {
    // Auto-select first device and partition if available and none is selected yet
    if (devices.length > 0 && !selectedDevice) {
      const firstDevice = devices[0]._id
      setSelectedDevice(firstDevice)

      // Fetch partitions for this device
      fetchPartitions(firstDevice)
    }
  }, [devices])

  // Add another useEffect to select the first partition when partitions are loaded
  useEffect(() => {
    // Auto-select first partition if available and none is selected yet
    if (partitions.length > 0 && selectedDevice && !selectedPartition) {
      const devicePartitions = partitions.filter((partition) => partition.device_id === selectedDevice)
      if (devicePartitions.length > 0) {
        setSelectedPartition(devicePartitions[0].partition_id)
      }
    }
  }, [partitions, selectedDevice])

  const fetchDevices = async () => {
    try {
      // Get the token from localStorage with the correct key "access_token"
      const token = localStorage.getItem("access_token") || ""

      // Use axios to call the specific localhost URL with headers
      const response = await axios.get("http://localhost:5000/api/devices/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      // Check if the response has the expected structure
      if (response.data && response.data.devices && Array.isArray(response.data.devices)) {
        setDevices(response.data.devices)

        if (response.data.devices.length === 0) {
          toast({
            title: "Info",
            description: "No devices found. Please add a device first.",
          })
        }
      } else {
        console.error("Unexpected API response format:", response.data)
        toast({
          title: "Error",
          description: "Received unexpected data format from the server.",
          variant: "destructive",
        })
        setDevices([])
      }
    } catch (error: any) {
      console.error("Failed to fetch devices:", error)

      // Check for authentication errors
      if (error.response && error.response.status === 401) {
        console.error("Authentication error: Invalid or expired token")
        toast({
          title: "Authentication Error",
          description: "Your session may have expired. Please log in again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch devices. Please try again later.",
          variant: "destructive",
        })
      }

      setDevices([])
    }
  }

  // Add this new function to fetch all partitions
  const fetchAllPartitions = async () => {
    try {
      // Get the token from localStorage
      const token = localStorage.getItem("access_token") || ""

      // Use axios to call the partitions endpoint without device_id filter to get all partitions
      const response = await axios.get("http://localhost:5000/api/partitions/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: {
          page: 1,
          per_page: 1000, // Get a large number to ensure we get all partitions
          status: "active",
        },
      })

      // Check if the response has the expected structure
      if (response.data && response.data.partitions && Array.isArray(response.data.partitions)) {
        setPartitions(response.data.partitions)
      } else {
        console.error("Unexpected partitions API response format:", response.data)
        setPartitions([])
      }
    } catch (error: any) {
      console.error("Failed to fetch all partitions:", error)
      setPartitions([])
    }
  }

  // Update the fetchPartitions function to use axios with device_id parameter
  const fetchPartitions = async (deviceId: string) => {
    try {
      // Get the token from localStorage
      const token = localStorage.getItem("access_token") || ""

      // Use axios to call the partitions endpoint with device_id as a query parameter
      const response = await axios.get("http://localhost:5000/api/partitions/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: {
          page: 1,
          per_page: 100,
          status: "active",
          device_id: deviceId, // Add the device_id as a query parameter
        },
      })

      // Check if the response has the expected structure
      if (response.data && response.data.partitions && Array.isArray(response.data.partitions)) {
        setPartitions(response.data.partitions)

        if (response.data.partitions.length === 0) {
          toast({
            title: "Info",
            description: "No partitions found for this device. Please add a partition first.",
          })
        }
      } else {
        console.error("Unexpected partitions API response format:", response.data)
        toast({
          title: "Error",
          description: "Received unexpected data format from the server.",
          variant: "destructive",
        })
        setPartitions([])
      }
    } catch (error: any) {
      console.error("Failed to fetch partitions:", error)

      // Check for authentication errors
      if (error.response && error.response.status === 401) {
        console.error("Authentication error: Invalid or expired token")
        toast({
          title: "Authentication Error",
          description: "Your session may have expired. Please log in again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch partitions. Please try again later.",
          variant: "destructive",
        })
      }

      setPartitions([])
    }
  }

  const fetchFiles = async () => {
    try {
      setIsLoading(true)

      // Get the token from localStorage
      const token = localStorage.getItem("access_token") || ""

      // Prepare query parameters
      const params: any = {
        page: currentPage,
        per_page: itemsPerPage,
      }

      // Add file type filter if selected
      if (typeFilter !== "all") {
        params.file_type = typeFilter
      }

      // Use axios to call the files endpoint
      const response = await axios.get("http://localhost:5000/api/files/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params,
      })

      // Check if the response has the expected structure
      if (response.data && response.data.files && Array.isArray(response.data.files)) {
        // Filter by encryption if needed (since backend might not support this filter)
        let filteredFiles = response.data.files
        if (encryptionFilter !== "all") {
          const isEncrypted = encryptionFilter === "encrypted"
          filteredFiles = response.data.files.filter((file: any) => file.encrypted === isEncrypted)
        }

        setFiles(filteredFiles)
        setTotalFiles(response.data.total || filteredFiles.length)
        setTotalPages(response.data.pages || Math.ceil(filteredFiles.length / itemsPerPage))
      } else {
        console.error("Unexpected files API response format:", response.data)
        toast({
          title: "Error",
          description: "Received unexpected data format from the server.",
          variant: "destructive",
        })
        setFiles([])
        setTotalFiles(0)
        setTotalPages(1)
      }
    } catch (error: any) {
      console.error("Failed to fetch files:", error)

      // Check for authentication errors
      if (error.response && error.response.status === 401) {
        console.error("Authentication error: Invalid or expired token")
        toast({
          title: "Authentication Error",
          description: "Your session may have expired. Please log in again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch files. Please try again later.",
          variant: "destructive",
        })
      }

      setFiles([])
      setTotalFiles(0)
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter available partitions based on selected device
  const availablePartitions = selectedDevice
    ? partitions.filter((partition) => partition.device_id === selectedDevice)
    : []

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

    if (!policiesAccepted) {
      toast({
        title: "Error",
        description: "Please accept the Terms of Service and Privacy Policy",
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

    // Check if user has fingerprint set up
    if (user?.fingerprint_hashes && user.fingerprint_hashes.length > 0) {
      // Open fingerprint scanner for verification
      setScannerMode("encrypt")
      setScannerOpen(true)
    } else {
      toast({
        title: "Fingerprint Required",
        description: "Please set up your fingerprint in settings before uploading files.",
        variant: "destructive",
      })
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const processUpload = (file: File) => {
    setIsUploading(true)

    // Create form data
    const formData = new FormData()
    formData.append("file", file)
    formData.append("partition_id", selectedPartition)
    formData.append("encrypt", "true") // Always encrypt if fingerprint is available

    // Add fingerprint data if encrypting
    if (selectedFile) {
      formData.append("fingerprint", "mock-fingerprint-data")
    }

    // Upload file
    FileService.uploadFile(formData)
      .then(() => {
        toast({
          title: "Success",
          description: "File uploaded successfully",
        })
        fetchFiles() // Refresh file list
      })
      .catch((error) => {
        console.error("Upload failed:", error)
        toast({
          title: "Error",
          description: "Failed to upload file. Please try again.",
          variant: "destructive",
        })
      })
      .finally(() => {
        setIsUploading(false)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      })
  }

  const handleEncryptDecrypt = (file: any, mode: "encrypt" | "decrypt") => {
    setSelectedFile(file)
    setScannerMode(mode)
    setScannerOpen(true)
  }

  const handleFingerprintCapture = (fingerprintData: string) => {
    setScannerOpen(false)

    // Show processing toast
    toast({
      title: "Processing",
      description: `Fingerprint captured. ${
        scannerMode === "encrypt" ? "Encrypting" : scannerMode === "preview" ? "Preparing preview" : "Decrypting"
      } file...`,
    })

    if (scannerMode === "encrypt") {
      // For upload with encryption
      if (fileInputRef.current?.files?.length) {
        processUpload(fileInputRef.current.files[0])
      } else {
        // For encrypting an existing file
        // Call API to encrypt file
        toast({
          title: "Success",
          description: `File ${selectedFile.file_name} has been encrypted`,
        })
        fetchFiles() // Refresh file list
      }
    } else if (scannerMode === "preview") {
      // For previewing an encrypted file
      previewFileWithFingerprint(selectedFile, fingerprintData)
    } else {
      // For decryption and download of existing file
      downloadFileWithFingerprint(selectedFile, fingerprintData)
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <FilePdf className="h-4 w-4 text-red-500" />
      case "IMAGE":
        return <ImageIcon className="h-4 w-4 text-blue-500" />
      case "ARCHIVE":
        return <FileArchive className="h-4 w-4 text-yellow-500" />
      case "TEXT":
        return <FileText className="h-4 w-4 text-green-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId)
    setSelectedPartition("")
    fetchPartitions(deviceId)
  }

  // Replace the handleDeleteFile function with this enhanced version
  const handleDeleteFile = (file: any) => {
    setSelectedFile(file)
    setIsDeleting(file.file_id)

    // Get the token from localStorage
    const token = localStorage.getItem("access_token") || ""

    // Use axios to delete the file
    axios
      .delete(`http://localhost:5000/api/files/${file._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      .then(() => {
        toast({
          title: "Success",
          description: "File deleted successfully",
        })
        fetchFiles() // Refresh file list
      })
      .catch((error) => {
        console.error("Delete failed:", error)
        toast({
          title: "Error",
          description: "Failed to delete file. Please try again.",
          variant: "destructive",
        })
      })
      .finally(() => {
        setIsDeleting(null)
      })
  }

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "0 B"

    if (selectedSizeUnit !== "auto") {
      switch (selectedSizeUnit) {
        case "B":
          return `${bytes} B`
        case "KB":
          return `${(bytes / 1024).toFixed(2)} KB`
        case "MB":
          return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
        case "GB":
          return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
        case "TB":
          return `${(bytes / Math.pow(1024, 4)).toFixed(2)} TB`
        case "PB":
          return `${(bytes / Math.pow(1024, 5)).toFixed(2)} PB`
        case "EB":
          return `${(bytes / Math.pow(1024, 6)).toFixed(2)} EB`
        case "ZB":
          return `${(bytes / Math.pow(1024, 7)).toFixed(2)} ZB`
        case "YB":
          return `${(bytes / Math.pow(1024, 8)).toFixed(2)} YB`
        default:
          return `${bytes} B`
      }
    }

    // Auto format based on size
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  // Add this new function before the return statement
  const handleViewFile = async (file: any) => {
    try {
      setIsViewingFile(true)
      setViewFileData({ file, url: null })

      // Get the token from localStorage
      const token = localStorage.getItem("access_token") || ""

      // Call the get_file endpoint directly (not /download)
      const response = await axios.get(`http://localhost:5000/api/files/${file._id || file.file_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      // Extract file data from response
      const { file: fileData } = response.data

      // Convert base64 to blob
      const byteCharacters = atob(fileData.file_data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: fileData.mime_type || "application/octet-stream" })

      // Create a blob URL for the file
      const url = URL.createObjectURL(blob)

      // Update file data with additional information
      const enhancedFileData = {
        ...file,
        mime_type: fileData.mime_type,
        content_preview: null,
      }

      // For text files, try to extract content for preview
      if (
        fileData.mime_type &&
        (fileData.mime_type.startsWith("text/") ||
          fileData.mime_type.includes("json") ||
          fileData.mime_type.includes("xml") ||
          fileData.mime_type.includes("javascript") ||
          fileData.mime_type.includes("css"))
      ) {
        try {
          const textContent = await blob.text()
          enhancedFileData.content_preview = textContent
        } catch (error) {
          console.error("Failed to extract text content:", error)
        }
      }

      setViewFileData({ file: enhancedFileData, url })
    } catch (error: any) {
      console.error("Failed to view file:", error)

      // Check if the error is due to no fingerprints registered
      if (error.response && error.response.data && error.response.data.error === "No fingerprints registered") {
        toast({
          title: "Fingerprint Required",
          description: "Please set up your fingerprint in settings before viewing encrypted files.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.error || "Failed to view file. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsViewingFile(false)
    }
  }

  // Add this new function to handle file preview with optional fingerprint

  const previewFileWithFingerprint = async (file: any, fingerprintData?: string) => {
    try {
      setIsViewingFile(true)
      setViewFileData({ file, url: null })

      // Get the token from localStorage
      const token = localStorage.getItem("access_token") || ""

      // Prepare request parameters
      const params: any = {}
      if (fingerprintData) {
        params.fingerprint = fingerprintData
      }

      // Call the get_file endpoint directly (not /download)
      const response = await axios.get(`http://localhost:5000/api/files/${file._id || file.file_id}/preview`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params,
      })

      // Extract file data from response
      const { file_data, mime_type } = response.data

      // Convert base64 to blob
      const byteCharacters = atob(file_data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: mime_type || "application/octet-stream" })

      // Create a blob URL for the file
      const url = URL.createObjectURL(blob)
      setViewFileData({ file, url })
    } catch (error: any) {
      console.error("Failed to preview file:", error)

      // Check if the error is due to no fingerprints registered
      if (error.response && error.response.data && error.response.data.error === "No fingerprints registered") {
        toast({
          title: "Fingerprint Required",
          description: "Please set up your fingerprint in settings before viewing encrypted files.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.error || "Failed to preview file. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsViewingFile(false)
    }
  }

  // Add this enhanced download function
  const handleDownloadFile = (file: any) => {
    // For encrypted files, open fingerprint scanner first
    if (file.encrypted) {
      setSelectedFile(file)
      setScannerMode("decrypt")
      setScannerOpen(true)
      return
    }

    // For non-encrypted files, proceed with download
    downloadFileWithFingerprint(file)
  }

  // Add this new function to handle the actual download with optional fingerprint
  const downloadFileWithFingerprint = (file: any, fingerprintData?: string) => {
    const fileId = file._id || file.file_id
    setIsDownloading(file.file_id)

    // Get the token from localStorage
    const token = localStorage.getItem("access_token") || ""

    // Prepare request parameters
    const params: any = {}
    if (fingerprintData) {
      params.fingerprint = fingerprintData
    }

    // Use axios to download the file
    axios
      .get(`http://localhost:5000/api/files/${fileId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params,
      })
      .then((response) => {
        // Extract file data from response
        const { file_data, file_name, mime_type } = response.data

        // Convert base64 to blob
        const byteCharacters = atob(file_data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: mime_type || "application/octet-stream" })

        // Create download link
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.setAttribute("download", file_name)
        document.body.appendChild(link)
        link.click()

        // Clean up
        URL.revokeObjectURL(url)
        link.remove()

        toast({
          title: "Success",
          description: `File ${file_name} has been downloaded`,
        })
      })
      .catch((error) => {
        console.error("Download failed:", error)
        let errorMessage = "Failed to download file. Please try again."

        // Extract more specific error message if available
        if (error.response && error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      })
      .finally(() => {
        setIsDownloading(null)
      })
  }

  // Function to truncate text with ellipsis
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return ""
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  // Helper function to get partition and device info
  const getLocationInfo = (file: any) => {
    // Find the partition that matches the file's partition_id
    const partition = partitions.find((p) => p._id === file.partition_id || p.partition_id === file.partition_id)

    if (partition) {
      // If we found the partition, find its device
      const device = devices.find((d) => d._id === partition.device_id)

      return {
        deviceName: device?.device_name || file.device_name || "Unknown Device",
        partitionName: partition.partition_name || partition.partition_id || file.partition_name || file.partition_id,
      }
    }

    // Fallback to the file's own device_name and partition_name if available
    return {
      deviceName: file.device_name || "Unknown Device",
      partitionName: file.partition_name || file.partition_id || "Unknown Partition",
    }
  }

  if (isLoading && files.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My File Manager</h1>
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
                      <Select value={selectedDevice} onValueChange={handleDeviceChange}>
                        <SelectTrigger id="device">
                          <SelectValue
                            placeholder={devices.length > 0 ? "Select a storage device" : "No devices available"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {devices.length > 0 ? (
                            devices.map((device) => (
                              <SelectItem key={device._id} value={device._id}>
                                <div className="flex items-center gap-2">
                                  <HardDrive className="h-4 w-4" />
                                  <span>{device.device_name}</span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-devices" disabled>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <span>No devices available</span>
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {devices.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          No devices found. Please add a device first.
                        </p>
                      )}
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
                          {availablePartitions.length > 0 ? (
                            availablePartitions.map((partition) => (
                              <SelectItem key={partition.partition_id} value={partition.partition_id}>
                                <div className="flex items-center gap-2">
                                  <Layers className="h-4 w-4" />
                                  <span>
                                    {partition.partition_name} ({partition.format})
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-partitions" disabled>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <span>No partitions available for this device</span>
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {selectedDevice && availablePartitions.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          No partitions found for this device. Please add a partition first.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Fingerprint Status */}
                  <div className="flex items-center space-x-2 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-primary" />
                      <span>
                        {user?.fingerprint_hashes && user.fingerprint_hashes.length > 0
                          ? "Files will be encrypted with your fingerprint"
                          : "Fingerprint not set up. Please add a fingerprint in settings to upload files."}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 py-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="accept-policies"
                        checked={policiesAccepted}
                        onChange={(e) => setPoliciesAccepted(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />

                      <label htmlFor="accept-policies" className="text-sm text-muted-foreground">
                        I accept the{" "}
                        <button
                          type="button"
                          onClick={() => setTermsDialogOpen(true)}
                          className="text-primary hover:underline font-medium"
                        >
                          Terms of Service
                        </button>{" "}
                        and{" "}
                        <button
                          type="button"
                          onClick={() => setPrivacyDialogOpen(true)}
                          className="text-primary hover:underline font-medium"
                        >
                          Privacy Policy
                        </button>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleFileUpload}
                      disabled={!selectedDevice || !selectedPartition || isUploading || !policiesAccepted}
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
                      Files will be automatically secured with fingerprint authentication if you have set up your
                      fingerprint
                    </li>
                    <li>Click "Select File" to choose a file from your computer</li>
                    <li>You'll be prompted to scan your fingerprint to encrypt the file during upload</li>
                    <li>
                      Only you will be able to decrypt and access your encrypted files later with your fingerprint
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
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="IMAGE">Image</SelectItem>
                        <SelectItem value="ARCHIVE">Archive</SelectItem>
                        <SelectItem value="TEXT">Text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Files Table */}
                <div className="relative">
                  <div className="overflow-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-secondary rounded-md border">
                    <div className="min-w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="uppercase">File Name</TableHead>
                            <TableHead className="uppercase">Type</TableHead>
                            <TableHead className="uppercase">
                              <div className="flex items-center gap-1">
                                Size
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                                      <ChevronDown className="h-3 w-3" />
                                      <span className="sr-only">Change size unit</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    <DropdownMenuLabel>Size Units</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setSelectedSizeUnit("auto")}>
                                      Auto
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedSizeUnit("B")}>
                                      Bytes (B)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedSizeUnit("KB")}>
                                      Kilobytes (KB)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedSizeUnit("MB")}>
                                      Megabytes (MB)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedSizeUnit("GB")}>
                                      Gigabytes (GB)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedSizeUnit("TB")}>
                                      Terabytes (TB)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedSizeUnit("PB")}>
                                      Petabytes (PB)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedSizeUnit("EB")}>
                                      Exabytes (EB)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedSizeUnit("ZB")}>
                                      Zettabytes (ZB)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedSizeUnit("YB")}>
                                      Yottabytes (YB)
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableHead>
                            <TableHead className="uppercase">Location</TableHead>
                            <TableHead className="uppercase">Uploaded</TableHead>
                            <TableHead className="uppercase">Security</TableHead>
                            <TableHead className="uppercase text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {files.map((file) => (
                            <TableRow key={file.file_id}>
                              <TableCell className="font-medium max-w-[200px]">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        {getFileIcon(file.file_type)}
                                        <span className="truncate text-sm">{file.file_name}</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-[300px]">
                                      <p>{file.file_name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                                    file.file_type === "PDF"
                                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                      : file.file_type === "IMAGE"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                        : file.file_type === "ARCHIVE"
                                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                  }`}
                                >
                                  {file.file_type}
                                </span>
                              </TableCell>
                              <TableCell>{formatFileSize(Number(file.file_size) || 0)}</TableCell>
                              <TableCell className="max-w-[150px]">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex flex-col overflow-hidden">
                                        {(() => {
                                          const { deviceName, partitionName } = getLocationInfo(file)
                                          return (
                                            <>
                                              <span className="text-xs text-muted-foreground truncate">
                                                {deviceName}
                                              </span>
                                              <span className="truncate">{partitionName}</span>
                                            </>
                                          )
                                        })()}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                      {(() => {
                                        const { deviceName, partitionName } = getLocationInfo(file)
                                        return (
                                          <>
                                            <p className="font-medium">Device: {deviceName}</p>
                                            <p>Partition: {partitionName}</p>
                                          </>
                                        )
                                      })()}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell>{new Date(file.upload_date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                {file.encrypted ? (
                                  <div className="flex items-center gap-1 text-primary">
                                    <Lock className="h-4 w-4" />
                                    <Fingerprint className="h-4 w-4" />
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
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="View file"
                                    onClick={() => handleViewFile(file)}
                                    disabled={isDownloading === file.file_id || isDeleting === file.file_id}
                                  >
                                    {isViewingFile && viewFileData.file?.file_id === file.file_id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">View</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Download file"
                                    onClick={() => handleDownloadFile(file)}
                                    disabled={isDownloading === file.file_id || isDeleting === file.file_id}
                                  >
                                    {isDownloading === file.file_id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Download className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">Download</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Delete file"
                                    onClick={() => handleDeleteFile(file)}
                                    disabled={isDownloading === file.file_id || isDeleting === file.file_id}
                                  >
                                    {isDeleting === file.file_id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {files.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="h-24 text-center">
                                No files found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Pagination */}
                  {totalFiles > 0 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                        {Math.min(currentPage * itemsPerPage, totalFiles)} of {totalFiles} files
                      </div>
                      <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </div>
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

      {/* View File Dialog */}
      <Dialog open={isViewingFile} onOpenChange={setIsViewingFile}>
        <DialogContent className="sm:max-w-[80vw] sm:max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>View File</DialogTitle>
            <DialogDescription>View the contents of the selected file.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {viewFileData.url ? (
              <iframe src={viewFileData.url} className="w-full h-[60vh]" />
            ) : (
              <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewingFile(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Viewer Dialog */}
      <Dialog
        open={viewFileData.file !== null}
        onOpenChange={(open) => {
          if (!open) {
            // Clean up the blob URL when closing the dialog
            if (viewFileData.url) {
              URL.revokeObjectURL(viewFileData.url)
            }
            setViewFileData({ file: null, url: null })
          }
        }}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewFileData.file && getFileIcon(viewFileData.file.file_type)}
              {viewFileData.file?.file_name || "View File"}
            </DialogTitle>
            <DialogDescription>
              {viewFileData.file?.file_type === "IMAGE" ? "Image preview" : "File details"}
            </DialogDescription>
          </DialogHeader>

          {viewFileData.file && (
            <div className="py-4">
              {viewFileData.url ? (
                (() => {
                  const fileType = viewFileData.file.file_type
                  const mimeType = viewFileData.file.mime_type || ""

                  // Handle image files
                  if (fileType === "IMAGE" || mimeType.startsWith("image/")) {
                    return (
                      <div className="flex justify-center overflow-auto h-[400px] border rounded-md">
                        <img
                          src={viewFileData.url || "/placeholder.svg"}
                          alt={viewFileData.file.file_name}
                          className="max-w-full object-contain"
                        />
                      </div>
                    )
                  }

                  // Handle PDF files
                  else if (fileType === "PDF" || mimeType === "application/pdf") {
                    return (
                      <div className="flex flex-col gap-2">
                        <div className="h-[400px] border rounded-md overflow-hidden">
                          <iframe
                            src={viewFileData.url}
                            title={viewFileData.file.file_name}
                            className="w-full h-full"
                          />
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                          Scroll to navigate through the PDF pages
                        </p>
                      </div>
                    )
                  }

                  // Handle text files
                  else if (
                    fileType === "TEXT" ||
                    mimeType.startsWith("text/") ||
                    mimeType.includes("json") ||
                    mimeType.includes("xml") ||
                    mimeType.includes("javascript") ||
                    mimeType.includes("css")
                  ) {
                    return (
                      <div className="h-[400px] overflow-auto p-4 bg-muted rounded-md">
                        <pre className="text-sm whitespace-pre-wrap">
                          {viewFileData.file.content_preview || "Loading text content..."}
                        </pre>
                      </div>
                    )
                  }

                  // Handle video files
                  else if (mimeType.startsWith("video/")) {
                    return (
                      <div className="flex flex-col gap-2">
                        <div className="h-[400px] flex items-center justify-center bg-black rounded-md overflow-hidden">
                          <video
                            src={viewFileData.url}
                            controls
                            className="max-h-full max-w-full"
                            style={{ maxHeight: "400px" }}
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      </div>
                    )
                  }

                  // Handle audio files
                  else if (mimeType.startsWith("audio/")) {
                    return (
                      <div className="flex flex-col gap-4 items-center justify-center p-6 h-[400px] overflow-auto">
                        <div className="text-6xl text-primary">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M9 18V5l12-2v13"></path>
                            <circle cx="6" cy="18" r="3"></circle>
                            <circle cx="18" cy="16" r="3"></circle>
                          </svg>
                        </div>
                        <p className="text-lg font-medium">{viewFileData.file.file_name}</p>
                        <audio controls className="w-full">
                          <source src={viewFileData.url} type={mimeType} />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )
                  }

                  // Handle archive files
                  else if (
                    fileType === "ARCHIVE" ||
                    mimeType.includes("zip") ||
                    mimeType.includes("tar") ||
                    mimeType.includes("rar") ||
                    mimeType.includes("7z")
                  ) {
                    return (
                      <div className="text-center p-6 h-[400px] overflow-auto flex flex-col items-center justify-center">
                        <FileArchive className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                        <p className="text-lg font-medium">Archive File</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          This is an archive file ({viewFileData.file.file_name}). Please download to extract its
                          contents.
                        </p>
                      </div>
                    )
                  }

                  // Default for other file types
                  else {
                    return (
                      <div className="text-center p-6 h-[400px] overflow-auto flex flex-col items-center justify-center">
                        <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-medium">File Preview</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Preview not available for this file type ({mimeType || fileType}). Please download the file to
                          view its contents.
                        </p>
                      </div>
                    )
                  }
                })()
              ) : (
                <div className="flex justify-center items-center h-[400px] border rounded-md">
                  <div className="flex flex-col justify-center items-center">
                    <div className="mb-4">
                      {viewFileData.file?.file_type === "IMAGE" ||
                      viewFileData.file?.mime_type?.startsWith("image/") ? (
                        <ImageIcon className="h-16 w-16 text-blue-500/70 animate-pulse" />
                      ) : viewFileData.file?.file_type === "PDF" ||
                        viewFileData.file?.mime_type === "application/pdf" ? (
                        <FilePdf className="h-16 w-16 text-red-500/70 animate-pulse" />
                      ) : viewFileData.file?.file_type === "ARCHIVE" ||
                        viewFileData.file?.mime_type?.includes("zip") ||
                        viewFileData.file?.mime_type?.includes("tar") ? (
                        <FileArchive className="h-16 w-16 text-yellow-500/70 animate-pulse" />
                      ) : viewFileData.file?.file_type === "TEXT" ||
                        viewFileData.file?.mime_type?.startsWith("text/") ? (
                        <FileText className="h-16 w-16 text-green-500/70 animate-pulse" />
                      ) : viewFileData.file?.mime_type?.startsWith("video/") ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="64"
                          height="64"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-16 w-16 text-purple-500/70 animate-pulse"
                        >
                          <polygon points="23 7 16 12 23 17 23 7"></polygon>
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                        </svg>
                      ) : viewFileData.file?.mime_type?.startsWith("audio/") ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="64"
                          height="64"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-16 w-16 text-indigo-500/70 animate-pulse"
                        >
                          <path d="M9 18V5l12-2v13"></path>
                          <circle cx="6" cy="18" r="3"></circle>
                          <circle cx="18" cy="16" r="3"></circle>
                        </svg>
                      ) : (
                        <FileText className="h-16 w-16 text-muted-foreground animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">
                        {viewFileData.file?.file_type === "IMAGE" || viewFileData.file?.mime_type?.startsWith("image/")
                          ? "Loading image..."
                          : viewFileData.file?.file_type === "PDF" || viewFileData.file?.mime_type === "application/pdf"
                            ? "Preparing PDF document..."
                            : viewFileData.file?.file_type === "TEXT" ||
                                viewFileData.file?.mime_type?.startsWith("text/")
                              ? "Loading text content..."
                              : viewFileData.file?.file_type === "ARCHIVE" ||
                                  viewFileData.file?.mime_type?.includes("zip") ||
                                  viewFileData.file?.mime_type?.includes("tar")
                                ? "Preparing archive preview..."
                                : viewFileData.file?.mime_type?.startsWith("video/")
                                  ? "Preparing video player..."
                                  : viewFileData.file?.mime_type?.startsWith("audio/")
                                    ? "Preparing audio player..."
                                    : "Loading file..."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium">File Details</h4>
                    <ul className="mt-2 space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{viewFileData.file.file_name}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium">{viewFileData.file.file_type}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Size:</span>
                        <span className="font-medium">{formatFileSize(Number(viewFileData.file.file_size) || 0)}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Uploaded:</span>
                        <span className="font-medium">{new Date(viewFileData.file.upload_date).toLocaleString()}</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Storage Location</h4>
                    <ul className="mt-2 space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Device:</span>
                        <span className="font-medium">{viewFileData.file.device_name || "Unknown Device"}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Partition:</span>
                        <span className="font-medium">
                          {viewFileData.file.partition_name || viewFileData.file.partition_id}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Security:</span>
                        <span className="font-medium flex items-center gap-1">
                          {viewFileData.file.encrypted ? (
                            <>
                              <Lock className="h-3 w-3 text-primary" />
                              <Fingerprint className="h-3 w-3 text-primary" />
                              Encrypted
                            </>
                          ) : (
                            <>
                              <Unlock className="h-3 w-3" />
                              Unencrypted
                            </>
                          )}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (viewFileData.url) {
                  URL.revokeObjectURL(viewFileData.url)
                }
                setViewFileData({ file: null, url: null })
              }}
            >
              Close
            </Button>
            {viewFileData.file && (
              <Button onClick={() => handleDownloadFile(viewFileData.file)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Dialog */}
      <Dialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
            <DialogDescription>Please read our Terms of Service carefully before using the platform.</DialogDescription>
          </DialogHeader>
          <div className="py-4 overflow-auto max-h-[50vh] pr-2">
            <h3 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h3>
            <p className="mb-4 text-sm">
              By accessing or using our secure file storage service, you agree to be bound by these Terms of Service and
              all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from
              using or accessing this service.
            </p>

            <h3 className="text-lg font-semibold mb-2">2. Use License</h3>
            <p className="mb-4 text-sm">
              Permission is granted to temporarily use our services for personal, non-commercial transitory viewing and
              file storage only. This is the grant of a license, not a transfer of title.
            </p>

            <h3 className="text-lg font-semibold mb-2">3. Disclaimer</h3>
            <p className="mb-4 text-sm">
              The materials on our service are provided on an 'as is' basis. We make no warranties, expressed or
              implied, and hereby disclaim and negate all other warranties including, without limitation, implied
              warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of
              intellectual property or other violation of rights.
            </p>

            <h3 className="text-lg font-semibold mb-2">4. Limitations</h3>
            <p className="mb-4 text-sm">
              In no event shall our company or its suppliers be liable for any damages (including, without limitation,
              damages for loss of data or profit, or due to business interruption) arising out of the use or inability
              to use our services.
            </p>

            <h3 className="text-lg font-semibold mb-2">5. Fingerprint Data</h3>
            <p className="mb-4 text-sm">
              By using our fingerprint authentication services, you consent to the collection, processing, and storage
              of your biometric data for the sole purpose of securing your files. We implement industry-standard
              security measures to protect this sensitive data.
            </p>

            <h3 className="text-lg font-semibold mb-2">6. Revisions and Errata</h3>
            <p className="mb-4 text-sm">
              The materials appearing on our service could include technical, typographical, or photographic errors. We
              do not warrant that any of the materials on our service are accurate, complete, or current. We may make
              changes to the materials contained on our service at any time without notice.
            </p>

            <h3 className="text-lg font-semibold mb-2">7. Governing Law</h3>
            <p className="mb-4 text-sm">
              These terms and conditions are governed by and construed in accordance with the laws and you irrevocably
              submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setTermsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={privacyDialogOpen} onOpenChange={setPrivacyDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
            <DialogDescription>Your privacy is important to us. Please review our privacy practices.</DialogDescription>
          </DialogHeader>
          <div className="py-4 overflow-auto max-h-[50vh] pr-2">
            <h3 className="text-lg font-semibold mb-2">1. Information We Collect</h3>
            <p className="mb-2 text-sm">
              We collect several types of information from and about users of our service, including:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-1 text-sm">
              <li>Personal information (such as name, email address, and contact details)</li>
              <li>Biometric data (fingerprint hashes for authentication purposes)</li>
              <li>Usage data (such as how you interact with our service)</li>
              <li>Device information (such as IP address, browser type, and operating system)</li>
            </ul>

            <h3 className="text-lg font-semibold mb-2">2. How We Use Your Information</h3>
            <p className="mb-2 text-sm">We use the information we collect about you to:</p>
            <ul className="list-disc pl-5 mb-4 space-y-1 text-sm">
              <li>Provide, maintain, and improve our services</li>
              <li>Process and secure your file storage and encryption</li>
              <li>Authenticate your identity through fingerprint verification</li>
              <li>Communicate with you about service-related issues</li>
              <li>Protect against unauthorized access to your data</li>
            </ul>

            <h3 className="text-lg font-semibold mb-2">3. Biometric Data Protection</h3>
            <p className="mb-2 text-sm">Your fingerprint data is processed as follows:</p>
            <ul className="list-disc pl-5 mb-4 space-y-1 text-sm">
              <li>We never store actual fingerprint images</li>
              <li>Only secure mathematical representations (hashes) are stored</li>
              <li>Biometric data is encrypted using industry-standard protocols</li>
              <li>Your fingerprint data is used solely for authentication purposes</li>
              <li>You can delete your fingerprint data at any time through account settings</li>
            </ul>

            <h3 className="text-lg font-semibold mb-2">4. Data Security</h3>
            <p className="mb-4 text-sm">
              We implement appropriate technical and organizational measures to protect your personal information
              against unauthorized or unlawful processing, accidental loss, destruction, or damage. However, no method
              of transmission over the Internet or electronic storage is 100% secure.
            </p>

            <h3 className="text-lg font-semibold mb-2">5. Data Retention</h3>
            <p className="mb-4 text-sm">
              We retain your personal information for as long as necessary to fulfill the purposes for which we
              collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements.
            </p>

            <h3 className="text-lg font-semibold mb-2">6. Your Rights</h3>
            <p className="mb-2 text-sm">
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-1 text-sm">
              <li>The right to access your personal information</li>
              <li>The right to rectify inaccurate personal information</li>
              <li>The right to request deletion of your personal information</li>
              <li>The right to restrict or object to processing of your personal information</li>
              <li>The right to data portability</li>
            </ul>

            <h3 className="text-lg font-semibold mb-2">7. Changes to Our Privacy Policy</h3>
            <p className="mb-4 text-sm">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setPrivacyDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: hsl(var(--secondary));
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.7);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary));
        }
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--primary) / 0.7) hsl(var(--secondary));
        }
      `}</style>
    </div>
  )
}
