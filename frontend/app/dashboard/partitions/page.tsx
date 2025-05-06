"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Plus, Search, Edit, Trash2, Layers, HardDrive } from "lucide-react"
import { TablePagination } from "@/components/table-pagination"
import axios from "axios"
import { toast } from "@/hooks/use-toast"

// Define device type
interface Device {
  _id: string
  device_name: string
  total_space: number
  used_space: number
  capacity: string
  [key: string]: any
}

export default function PartitionsPage() {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [addPartitionOpen, setAddPartitionOpen] = useState(false)
  const [editPartitionOpen, setEditPartitionOpen] = useState(false)
  const [deletePartitionOpen, setDeletePartitionOpen] = useState(false)
  const [selectedPartition, setSelectedPartition] = useState<any>(null)
  const description = "Manage your storage partitions"

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter state
  const [formatFilter, setFormatFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Data state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [partitions, setPartitions] = useState<any[]>([])
  const [totalPartitions, setTotalPartitions] = useState(0)

  // Devices state
  const [devices, setDevices] = useState<Device[]>([])
  const [devicesLoading, setDevicesLoading] = useState(false)
  const [devicesError, setDevicesError] = useState<string | null>(null)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")

  // Add these state variables
  const [partitionSize, setPartitionSize] = useState<string>("")
  const [deviceFreeSpace, setDeviceFreeSpace] = useState<number>(0)
  const [sizeError, setSizeError] = useState<string | null>(null)

  // Add these state variables after the other state declarations
  const [partitionName, setPartitionName] = useState("")
  const [partitionFormat, setPartitionFormat] = useState("NTFS")
  const [partitionStatus, setPartitionStatus] = useState("active")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Edit form state
  const [editPartitionName, setEditPartitionName] = useState("")
  const [editDeviceId, setEditDeviceId] = useState("")
  const [editPartitionSize, setEditPartitionSize] = useState("")
  const [editPartitionFormat, setEditPartitionFormat] = useState("")
  const [editPartitionStatus, setEditPartitionStatus] = useState("")
  const [editSizeError, setEditSizeError] = useState<string | null>(null)
  const [editFormError, setEditFormError] = useState<string | null>(null)
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)
  const [editDeviceFreeSpace, setEditDeviceFreeSpace] = useState<number>(0)

  // Delete state
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Add a new state for filtered partitions
  const [filteredPartitions, setFilteredPartitions] = useState<any[]>([])
  // Add state for displayed partitions (after pagination)
  const [displayedPartitions, setDisplayedPartitions] = useState<any[]>([])
  // Add state for refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Function to apply all filters (search, format, status) to partitions
  const applyFilters = useCallback(() => {
    if (!partitions.length) return []

    return partitions.filter((partition) => {
      // Text search filter
      const matchesSearch =
        !searchQuery.trim() ||
        (partition.partition_name || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (partition.device_name || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (partition.size || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (partition.format || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (partition.status || "").toLowerCase().includes(searchQuery.toLowerCase().trim())

      // Format filter
      const matchesFormat =
        formatFilter === "all" || (partition.format || "").toLowerCase() === formatFilter.toLowerCase()

      // Status filter
      const matchesStatus =
        statusFilter === "all" || (partition.status || "").toLowerCase() === statusFilter.toLowerCase()

      // Return true only if all active filters match
      return matchesSearch && matchesFormat && matchesStatus
    })
  }, [partitions, searchQuery, formatFilter, statusFilter])

  // Update filtered partitions whenever filters change
  useEffect(() => {
    const filtered = applyFilters()
    setFilteredPartitions(filtered)
    setTotalPartitions(filtered.length)
    // Reset to first page when filters change
    setCurrentPage(1)
  }, [applyFilters, searchQuery, formatFilter, statusFilter])

  // Update displayed partitions based on pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setDisplayedPartitions(filteredPartitions.slice(startIndex, endIndex))
  }, [filteredPartitions, currentPage, itemsPerPage])

  // Extract fetchDevices function to be reusable
  const fetchDevices = useCallback(async () => {
    setDevicesLoading(true)
    setDevicesError(null)

    try {
      // Get the authentication token from localStorage
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

      // Make API request with authentication token
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/api/devices/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      })

      // Update devices state with response data
      const fetchedDevices = response.data.devices || []
      console.log("Fetched devices:", fetchedDevices)
      setDevices(fetchedDevices)

      // Set the first device as default if available
      if (fetchedDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(fetchedDevices[0]._id)
      }
    } catch (err: any) {
      console.error("Failed to fetch devices:", err)

      // Set a more descriptive error message
      if (err.response?.status === 401) {
        setDevicesError("Authentication failed. Please log in again.")
      } else if (err.response?.status === 404) {
        setDevicesError("No devices found. Please add a device first.")
      } else {
        setDevicesError(err.response?.data?.message || err.message || "Failed to fetch devices")
      }

      // Clear devices array and selected device
      setDevices([])
      setSelectedDeviceId("")
    } finally {
      setDevicesLoading(false)
    }
  }, [selectedDeviceId])

  // Fetch devices when the page loads
  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  // Refresh devices when dialogs open if needed
  useEffect(() => {
    if (addPartitionOpen || editPartitionOpen) {
      if (devices.length === 0) {
        fetchDevices()
      }
    }
  }, [addPartitionOpen, editPartitionOpen, devices.length, fetchDevices])

  // Fetch partitions from API - only called once on initial load or refresh
  const fetchPartitionsFunc = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Get the authentication token from localStorage
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"

      // Use the correct API endpoint based on the blueprint registration
      const response = await axios.get(`${baseUrl}/api/partitions/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      })

      // Update state with response data
      const fetchedPartitions = response.data.partitions || []
      setPartitions(fetchedPartitions)
      console.log("Fetched partitions:", fetchedPartitions)

      // If devices are not loaded yet, fetch them
      if (devices.length === 0) {
        fetchDevices()
      }
    } catch (err: any) {
      console.error("Failed to fetch partitions:", err)

      // Handle different error types
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.")
      } else if (err.response?.status === 404) {
        setError("No partitions found.")
      } else {
        setError(err.response?.data?.message || err.message || "Failed to fetch partitions")
      }

      // Clear partitions data
      setPartitions([])
    } finally {
      setLoading(false)
    }
  }, [devices.length, fetchDevices])

  // Fetch partitions only on initial load or when refresh is triggered
  useEffect(() => {
    fetchPartitionsFunc()
  }, [fetchPartitionsFunc, refreshTrigger])

  // Handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleEditPartition = (partition: any) => {
    setSelectedPartition(partition)
    setEditPartitionName(partition.partition_name)
    setEditDeviceId(partition.device_id) // Set but won't be editable
    setEditPartitionSize(partition.size)
    setEditPartitionFormat(partition.format)
    setEditPartitionStatus(partition.status)
    setEditPartitionOpen(true)
  }

  const handleDeletePartition = (partition: any) => {
    setSelectedPartition(partition)
    setDeletePartitionOpen(true)
    setDeleteError(null)
  }

  // Add this function before the return statement
  const handleAddPartition = async () => {
    // Validate form
    if (!partitionName || !selectedDeviceId || !partitionSize || !partitionFormat) {
      setFormError("Please fill in all required fields")
      return
    }

    if (sizeError) {
      return // Don't proceed if there's a size validation error
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      // Get token from localStorage
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

      // Extract numeric value and unit from size
      const sizeRegex = /^(\d+(?:\.\d+)?)\s*(GB|MB|TB)?$/i
      const match = partitionSize.match(sizeRegex)

      if (!match) {
        setFormError("Invalid size format")
        setIsSubmitting(false)
        return
      }

      // Prepare the data for API - match the exact field names expected by the backend
      const partitionData = {
        partition_name: partitionName,
        device_id: selectedDeviceId,
        size: partitionSize, // Send as entered by user
        format: partitionFormat,
        status: partitionStatus,
      }

      // Use the correct API endpoint based on the blueprint registration
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"

      // Make the API request - using the correct URL without trailing slash
      await axios.post(`${baseUrl}/api/partitions/`, partitionData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      })

      // Success - refresh partitions list
      setAddPartitionOpen(false)

      // Reset form
      setPartitionName("")
      setSelectedDeviceId("")
      setPartitionSize("")
      setPartitionFormat("NTFS")
      setPartitionStatus("active")
      setSizeError(null)

      // Show success message
      toast({
        title: "Success",
        description: "Partition created successfully",
      })

      // Refresh partitions list
      setRefreshTrigger((prev) => prev + 1)
    } catch (err: any) {
      console.error("Failed to create partition:", err)

      // More detailed error logging
      if (err.response) {
        console.error("Error response:", {
          status: err.response.status,
          headers: err.response.headers,
          data: err.response.data,
        })

        // Show the specific error message from the API if available
        if (err.response.data && err.response.data.error) {
          setFormError(err.response.data.error)
        } else {
          setFormError(err.response?.data?.message || err.message || "Failed to create partition. Please try again.")
        }
      } else {
        setFormError("Network error. Please check your connection and try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add this function to handle updating a partition
  const handleUpdatePartition = async () => {
    // Validate form
    if (!editPartitionName) {
      setEditFormError("Please fill in all required fields")
      return
    }

    setIsEditSubmitting(true)
    setEditFormError(null)

    try {
      // Get token from localStorage
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

      // Prepare the data for API - match the exact field names expected by the backend
      // Note: device_id, size, and format are not included as they cannot be changed
      const partitionData = {
        partition_name: editPartitionName,
        status: editPartitionStatus,
      }

      // Use the correct API endpoint based on the blueprint registration
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"

      // Make the API request to update the partition
      await axios.put(`${baseUrl}/api/partitions/${selectedPartition._id}`, partitionData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      })

      // Success - refresh partitions list
      setEditPartitionOpen(false)

      // Reset form
      setEditPartitionName("")
      setEditDeviceId("")
      setEditPartitionSize("")
      setEditPartitionFormat("")
      setEditPartitionStatus("")
      setEditSizeError(null)

      // Show success message
      toast({
        title: "Success",
        description: "Partition updated successfully",
      })

      // Refresh partitions list
      setRefreshTrigger((prev) => prev + 1)
    } catch (err: any) {
      console.error("Failed to update partition:", err)

      // More detailed error logging
      if (err.response) {
        console.error("Error response:", {
          status: err.response.status,
          headers: err.response.headers,
          data: err.response.data,
        })

        // Show the specific error message from the API if available
        if (err.response.data && err.response.data.error) {
          setEditFormError(err.response.data.error)
        } else {
          setEditFormError(
            err.response?.data?.message || err.message || "Failed to update partition. Please try again.",
          )
        }
      } else {
        setEditFormError("Network error. Please check your connection and try again.")
      }
    } finally {
      setIsEditSubmitting(false)
    }
  }

  // Add this function to handle deleting a partition
  const handleConfirmDeletePartition = async () => {
    if (!selectedPartition || !selectedPartition._id) {
      setDeleteError("No partition selected")
      return
    }

    setIsDeleteSubmitting(true)
    setDeleteError(null)

    try {
      // Get token from localStorage
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

      // Use the correct API endpoint based on the blueprint registration
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"

      // Make the API request to delete the partition
      await axios.delete(`${baseUrl}/api/partitions/${selectedPartition._id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      })

      // Partition deleted successfully
      // Success - refresh partitions list
      setDeletePartitionOpen(false)

      // Show success message
      toast({
        title: "Success",
        description: "Partition deleted successfully",
      })

      // Refresh partitions list
      setRefreshTrigger((prev) => prev + 1)
    } catch (err: any) {
      console.error("Failed to delete partition:", err)

      // More detailed error logging
      if (err.response) {
        console.error("Error response:", {
          status: err.response.status,
          headers: err.response.headers,
          data: err.response.data,
        })

        // Show the specific error message from the API if available
        if (err.response.data && err.response.data.error) {
          setDeleteError(err.response.data.error)
        } else {
          setDeleteError(err.response?.data?.message || err.message || "Failed to delete partition. Please try again.")
        }
      } else {
        setDeleteError("Network error. Please check your connection and try again.")
      }
    } finally {
      setIsDeleteSubmitting(false)
    }
  }

  // Add this function after the other handler functions
  const fetchDeviceDetails = (deviceId: string) => {
    if (!deviceId) return

    // Find the selected device in our already fetched devices array
    const selectedDevice = devices.find((device) => device._id === deviceId)

    if (selectedDevice) {
      // Parse the capacity string (e.g., "500 GB")
      const capacityRegex = /^(\d+(?:\.\d+)?)\s*(GB|MB|TB)?$/i
      const capacityMatch = selectedDevice.capacity?.toString().match(capacityRegex)

      if (!capacityMatch) {
        setDeviceFreeSpace(0)
        setSizeError("Could not determine device capacity")
        return
      }

      const capacityValue = Number.parseFloat(capacityMatch[1])
      const capacityUnit = (capacityMatch[2] || "GB").toUpperCase()

      // Convert capacity to GB for standardization
      let capacityInGB = capacityValue
      if (capacityUnit === "MB") capacityInGB = capacityValue / 1024
      if (capacityUnit === "TB") capacityInGB = capacityValue * 1024

      // Filter partitions for the selected device
      const devicePartitions = partitions.filter((p) => p.device_id === deviceId)

      // Calculate total used space by summing all partition sizes
      let usedSpaceInGB = 0

      devicePartitions.forEach((partition) => {
        const sizeRegex = /^(\d+(?:\.\d+)?)\s*(GB|MB|TB)?$/i
        const sizeMatch = partition.size?.toString().match(sizeRegex)

        if (sizeMatch) {
          const sizeValue = Number.parseFloat(sizeMatch[1])
          const sizeUnit = (sizeMatch[2] || "GB").toUpperCase()

          // Convert to GB
          let partitionSizeInGB = sizeValue
          if (sizeUnit === "MB") partitionSizeInGB = sizeValue / 1024
          if (sizeUnit === "TB") partitionSizeInGB = sizeValue * 1024

          usedSpaceInGB += partitionSizeInGB
        }
      })

      // Calculate free space
      const freeSpaceInGB = capacityInGB - usedSpaceInGB

      if (isNaN(freeSpaceInGB) || freeSpaceInGB < 0) {
        setDeviceFreeSpace(0)
        setSizeError("Could not determine available space on device")
      } else {
        setDeviceFreeSpace(freeSpaceInGB)
        setSizeError(null)
      }
    } else {
      setDeviceFreeSpace(0)
      setSizeError("Device information not available")
    }
  }

  // Add this function to calculate free space for edit form
  const fetchEditDeviceDetails = (deviceId: string) => {
    if (!deviceId || devices.length === 0) {
      console.log("No device ID provided or devices not loaded yet")
      return
    }

    // Find the selected device in our already fetched devices array
    const selectedDevice = devices.find((device) => device._id === deviceId)

    if (selectedDevice) {
      console.log("Selected device for edit:", selectedDevice)

      // Parse the capacity string (e.g., "500 GB")
      const capacityRegex = /^(\d+(?:\.\d+)?)\s*(GB|MB|TB)?$/i
      const capacityMatch = selectedDevice.capacity?.toString().match(capacityRegex)

      if (!capacityMatch) {
        console.warn("Invalid capacity format:", selectedDevice.capacity)
        setEditDeviceFreeSpace(0)
        setEditSizeError("Could not determine device capacity")
        return
      }

      const capacityValue = Number.parseFloat(capacityMatch[1])
      const capacityUnit = (capacityMatch[2] || "GB").toUpperCase()

      // Convert capacity to GB for standardization
      let capacityInGB = capacityValue
      if (capacityUnit === "MB") capacityInGB = capacityValue / 1024
      if (capacityUnit === "TB") capacityInGB = capacityValue * 1024

      // Filter partitions for the selected device
      const devicePartitions = partitions.filter((p) => p.device_id === deviceId)

      // Calculate total used space by summing all partition sizes
      let usedSpaceInGB = 0

      devicePartitions.forEach((partition) => {
        // Skip the current partition being edited
        if (selectedPartition && partition._id === selectedPartition._id) {
          return
        }

        const sizeRegex = /^(\d+(?:\.\d+)?)\s*(GB|MB|TB)?$/i
        const sizeMatch = partition.size?.toString().match(sizeRegex)

        if (sizeMatch) {
          const sizeValue = Number.parseFloat(sizeMatch[1])
          const sizeUnit = (sizeMatch[2] || "GB").toUpperCase()

          // Convert to GB
          let partitionSizeInGB = sizeValue
          if (sizeUnit === "MB") partitionSizeInGB = sizeValue / 1024
          if (sizeUnit === "TB") partitionSizeInGB = sizeValue * 1024

          usedSpaceInGB += partitionSizeInGB
        }
      })

      // Calculate free space
      const freeSpaceInGB = capacityInGB - usedSpaceInGB

      if (isNaN(freeSpaceInGB) || freeSpaceInGB < 0) {
        console.warn("Invalid free space calculation for edit")
        setEditDeviceFreeSpace(0)
        setEditSizeError("Could not determine available space on device")
      } else {
        setEditDeviceFreeSpace(freeSpaceInGB)
        setEditSizeError(null)
      }
    } else {
      console.log(
        "Selected device not found in devices array for edit. Device ID:",
        deviceId,
        "Available devices:",
        devices.map((d) => d._id),
      )
      // Don't set error yet, as devices might still be loading
      if (devices.length > 0) {
        setEditDeviceFreeSpace(0)
        setEditSizeError("Device information not available")
      }
    }
  }

  // Modify the useEffect that runs when selectedDeviceId changes
  useEffect(() => {
    if (selectedDeviceId) {
      fetchDeviceDetails(selectedDeviceId)
    }
  }, [selectedDeviceId, devices, partitions]) // Add devices to the dependency array

  // Add useEffect for edit device details
  useEffect(() => {
    if (editDeviceId && devices.length > 0) {
      fetchEditDeviceDetails(editDeviceId)
    }
  }, [editDeviceId, devices, partitions, selectedPartition])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("partitions")}</h1>
        <div className="flex gap-2">
          <Dialog
            open={addPartitionOpen}
            onOpenChange={(open) => {
              setAddPartitionOpen(open)
              if (!open) {
                // Reset form state when dialog closes
                setSelectedDeviceId("")
                setPartitionSize("")
                setSizeError(null)
                setDeviceFreeSpace(0)
                setFormError(null)
                setPartitionName("")
                setPartitionFormat("NTFS")
                setPartitionStatus("active")
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("addPartition")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t("addPartition")}</DialogTitle>
                <DialogDescription>Add a new partition to a storage device</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="partition-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="partition-name"
                    className="col-span-3"
                    value={partitionName}
                    onChange={(e) => setPartitionName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="partition-device" className="text-right">
                    Device
                  </Label>
                  <div className="col-span-3">
                    {devicesLoading ? (
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    ) : devicesError ? (
                      <div className="text-sm text-red-500">{devicesError}</div>
                    ) : (
                      <Select value={selectedDeviceId} onValueChange={(value) => setSelectedDeviceId(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select device" />
                        </SelectTrigger>
                        <SelectContent>
                          {devices.map((device) => (
                            <SelectItem key={device._id} value={device._id}>
                              {device.device_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="partition-size" className="text-right">
                    Size
                  </Label>
                  <div className="col-span-3 space-y-1">
                    <Input
                      id="partition-size"
                      value={partitionSize}
                      onChange={(e) => {
                        const value = e.target.value
                        setPartitionSize(value)

                        // Validate size
                        if (!value) {
                          setSizeError("Size is required")
                          return
                        }

                        // Extract numeric value and unit
                        const sizeRegex = /^(\d+(?:\.\d+)?)\s*(GB|MB|TB)?$/i
                        const match = value.match(sizeRegex)

                        if (!match) {
                          setSizeError("Invalid format. Use number followed by unit (e.g., 500 GB)")
                          return
                        }

                        const numericValue = Number.parseFloat(match[1])
                        const unit = (match[2] || "GB").toUpperCase()

                        // Convert to GB for comparison
                        let sizeInGB = numericValue
                        if (unit === "MB") sizeInGB = numericValue / 1024
                        if (unit === "TB") sizeInGB = numericValue * 1024

                        console.log("Size validation:", {
                          input: value,
                          numericValue,
                          unit,
                          sizeInGB,
                          deviceFreeSpace,
                        })

                        if (sizeInGB > deviceFreeSpace) {
                          setSizeError(`Size exceeds available space (${deviceFreeSpace.toFixed(2)} GB free)`)
                        } else {
                          setSizeError(null)
                        }
                      }}
                      placeholder="e.g. 500 GB"
                      className={sizeError ? "border-red-500" : ""}
                    />
                    {sizeError && <p className="text-xs text-red-500">{sizeError}</p>}
                    {selectedDeviceId && !sizeError && (
                      <p className="text-xs text-muted-foreground">Available space: {deviceFreeSpace.toFixed(2)} GB</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="partition-format" className="text-right">
                    Format
                  </Label>
                  <Select value={partitionFormat} onValueChange={setPartitionFormat}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NTFS">NTFS</SelectItem>
                      <SelectItem value="exFAT">exFAT</SelectItem>
                      <SelectItem value="FAT32">FAT32</SelectItem>
                      <SelectItem value="ext4">ext4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="partition-status" className="text-right">
                    Status
                  </Label>
                  <Select value={partitionStatus} onValueChange={setPartitionStatus}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                {formError && (
                  <div className="w-full mb-4 p-2 text-sm bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200 rounded-md">
                    {formError}
                  </div>
                )}
                <Button
                  type="submit"
                  onClick={handleAddPartition}
                  disabled={!!sizeError || !partitionName || !partitionSize || !selectedDeviceId || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Creating...</span>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    </>
                  ) : (
                    t("save")
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("partitionList")}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={formatFilter} onValueChange={setFormatFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="NTFS">NTFS</SelectItem>
                  <SelectItem value="exFAT">exFAT</SelectItem>
                  <SelectItem value="FAT32">FAT32</SelectItem>
                  <SelectItem value="ext4">ext4</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-2 bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-md">{error}</div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="uppercase">Name</TableHead>
                  <TableHead className="uppercase">Device</TableHead>
                  <TableHead className="uppercase">Size</TableHead>
                  <TableHead className="uppercase">Format</TableHead>
                  <TableHead className="uppercase">Status</TableHead>
                  <TableHead className="uppercase text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Show loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      <TableCell>
                        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : displayedPartitions.length > 0 ? (
                  displayedPartitions.map((partition) => (
                    <TableRow key={partition._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" />
                          {partition.partition_name}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4" />
                          {(() => {
                            const deviceId = partition.device_id
                            const device = devices.find((device) => device._id === deviceId)
                            return device ? device.device_name : "Unknown device"
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>{partition.size}</TableCell>
                      <TableCell>{partition.format}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${
                            partition.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {partition.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditPartition(partition)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">{t("editPartition")}</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePartition(partition)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">{t("deletePartition")}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {filteredPartitions.length > 0 && !loading && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredPartitions.length)} of {filteredPartitions.length} partitions
          </div>
          <TablePagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredPartitions.length / itemsPerPage)}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Edit Partition Dialog */}
      <Dialog
        open={editPartitionOpen}
        onOpenChange={(open) => {
          setEditPartitionOpen(open)
          if (!open) {
            // Reset form state when dialog closes
            setEditPartitionName("")
            setEditDeviceId("")
            setEditPartitionSize("")
            setEditPartitionFormat("")
            setEditPartitionStatus("")
            setEditSizeError(null)
            setEditFormError(null)
            setEditDeviceFreeSpace(0)
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("editPartition")}</DialogTitle>
            <DialogDescription>Edit partition details</DialogDescription>
          </DialogHeader>
          {selectedPartition && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-partition-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-partition-name"
                  value={editPartitionName}
                  onChange={(e) => setEditPartitionName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-partition-device" className="text-right">
                  Device
                </Label>
                <div className="col-span-3">
                  {devicesLoading ? (
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    <div className="flex items-center h-10 px-3 border rounded-md bg-muted/50">
                      <HardDrive className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        {devices.find((d) => d._id === editDeviceId)?.device_name ||
                          (selectedPartition ? selectedPartition.device_name : "Loading device...")}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Device cannot be changed after creation</p>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-partition-size" className="text-right">
                  Size
                </Label>
                <div className="col-span-3">
                  <div className="flex items-center h-10 px-3 border rounded-md bg-muted/50">
                    <span>{editPartitionSize}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Size cannot be changed after creation</p>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-partition-format" className="text-right">
                  Format
                </Label>
                <div className="col-span-3">
                  <div className="flex items-center h-10 px-3 border rounded-md bg-muted/50">
                    <span>{editPartitionFormat}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Format cannot be changed after creation</p>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-partition-status" className="text-right">
                  Status
                </Label>
                <Select value={editPartitionStatus} onValueChange={setEditPartitionStatus}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            {editFormError && (
              <div className="w-full mb-4 p-2 text-sm bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200 rounded-md">
                {editFormError}
              </div>
            )}
            <Button type="submit" onClick={handleUpdatePartition} disabled={!editPartitionName || isEditSubmitting}>
              {isEditSubmitting ? (
                <>
                  <span className="mr-2">Updating...</span>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </>
              ) : (
                t("save")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Partition Dialog */}
      <Dialog open={deletePartitionOpen} onOpenChange={setDeletePartitionOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("deletePartition")}</DialogTitle>
            <DialogDescription>{t("confirmDelete")}</DialogDescription>
          </DialogHeader>
          {selectedPartition && (
            <div className="py-4">
              <p>
                Are you sure you want to delete partition <strong>{selectedPartition.partition_name}</strong>?
              </p>
              <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
              {deleteError && (
                <div className="mt-4 p-2 text-sm bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200 rounded-md">
                  {deleteError}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePartitionOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeletePartition} disabled={isDeleteSubmitting}>
              {isDeleteSubmitting ? (
                <>
                  <span className="mr-2">Deleting...</span>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </>
              ) : (
                t("deletePartition")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
