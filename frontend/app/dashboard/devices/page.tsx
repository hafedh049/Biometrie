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
import { Plus, Search, Edit, Trash2, HardDrive, Usb, Database } from "lucide-react"
import { TablePagination } from "@/components/table-pagination"
import axios from "axios"

export default function DevicesPage() {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [addDeviceOpen, setAddDeviceOpen] = useState(false)
  const [editDeviceOpen, setEditDeviceOpen] = useState(false)
  const [deleteDeviceOpen, setDeleteDeviceOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // State for API data
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Add device form state
  const [newDeviceName, setNewDeviceName] = useState("")
  const [newDeviceType, setNewDeviceType] = useState("")
  const [newDeviceCapacity, setNewDeviceCapacity] = useState("")
  const [newDeviceStatus, setNewDeviceStatus] = useState("active")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Add a new state for filtered devices
  const [filteredDevices, setFilteredDevices] = useState<any[]>([])
  // Add state for displayed devices (after pagination)
  const [displayedDevices, setDisplayedDevices] = useState<any[]>([])

  // Update the edit device functionality
  const [editDeviceName, setEditDeviceName] = useState("")
  const [editDeviceType, setEditDeviceType] = useState("")
  const [editDeviceCapacity, setEditDeviceCapacity] = useState("")
  const [editDeviceStatus, setEditDeviceStatus] = useState("")
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)
  const [editFormError, setEditFormError] = useState<string | null>(null)

  // Function to handle page changes
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  // Function to apply all filters (search, type, status) to devices
  const applyFilters = useCallback(() => {
    if (!devices.length) return []

    return devices.filter((device) => {
      // Text search filter
      const matchesSearch =
        !searchQuery.trim() ||
        (device.device_name || device.name || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (device.device_type || device.type || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (device.capacity || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (device.status || "").toLowerCase().includes(searchQuery.toLowerCase().trim())

      // Type filter
      const matchesType =
        typeFilter === "all" || (device.device_type || device.type || "").toLowerCase() === typeFilter.toLowerCase()

      // Status filter
      const matchesStatus = statusFilter === "all" || (device.status || "").toLowerCase() === statusFilter.toLowerCase()

      // Return true only if all active filters match
      return matchesSearch && matchesType && matchesStatus
    })
  }, [devices, searchQuery, typeFilter, statusFilter])

  // Update filtered devices whenever filters change
  useEffect(() => {
    const filtered = applyFilters()
    setFilteredDevices(filtered)
    setTotalCount(filtered.length)
    // Reset to first page when filters change
    setCurrentPage(1)
  }, [applyFilters, searchQuery, typeFilter, statusFilter])

  // Update displayed devices based on pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setDisplayedDevices(filteredDevices.slice(startIndex, endIndex))
  }, [filteredDevices, currentPage, itemsPerPage])

  // Function to fetch devices from API - only called once on initial load or refresh
  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get token from localStorage
      const token = localStorage.getItem("access_token")

      // Make API request with authorization header if token exists
      if (token) {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/devices/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const fetchedDevices = response.data.devices || []
        setDevices(fetchedDevices)
      } else {
        // No token available
        console.log("No authentication token found")
        setDevices([])
        setError("Authentication required. Please log in.")
      }
    } catch (err: any) {
      // If 401 Unauthorized or other API error
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.")
      } else {
        setError(err.response?.data?.message || "Failed to load devices. Please try again later.")
      }
      setDevices([]) // Clear devices on error
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch devices only on initial load or when refresh is triggered
  useEffect(() => {
    fetchDevices()
  }, [fetchDevices, refreshTrigger])

  const handleEditDevice = async (device: any) => {
    setSelectedDevice(device)
    setEditDeviceName(device.device_name || device.name || "")
    setEditDeviceType(device.device_type || device.type || "")
    setEditDeviceCapacity(device.capacity || "")
    setEditDeviceStatus((device.status || "").toLowerCase())
    setEditFormError(null)
    setEditDeviceOpen(true)
  }

  const handleDeleteDevice = async (device: any) => {
    setSelectedDevice(device)
    setDeleteDeviceOpen(true)
  }

  // Add a function to handle the actual delete operation
  const confirmDeleteDevice = async () => {
    if (!selectedDevice) return

    try {
      // Get token from localStorage
      const token = localStorage.getItem("access_token")

      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/devices/${selectedDevice._id || selectedDevice.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Update local state to avoid refetching
      const updatedDevices = devices.filter((d) => (d._id || d.id) !== (selectedDevice._id || selectedDevice.id))
      setDevices(updatedDevices)
      setDeleteDeviceOpen(false)
    } catch (err: any) {
      console.error("Failed to delete device:", err)
      // Show error message
    }
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "hardDisk":
        return <HardDrive className="h-4 w-4" />
      case "flashDrive":
        return <Usb className="h-4 w-4" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  // Handle adding a new device
  const handleAddDevice = async () => {
    // Validate form
    if (!newDeviceName || !newDeviceType || !newDeviceCapacity) {
      setFormError("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      // Get token from localStorage
      const token = localStorage.getItem("access_token")

      // Send to API
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/devices/`,
        {
          device_name: newDeviceName,
          device_type: newDeviceType,
          capacity: newDeviceCapacity,
          status: newDeviceStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      // Refresh the devices list from the backend
      setRefreshTrigger((prev) => prev + 1)

      // Reset form and close dialog
      setNewDeviceName("")
      setNewDeviceType("")
      setNewDeviceCapacity("")
      setNewDeviceStatus("active")
      setAddDeviceOpen(false)
    } catch (err: any) {
      console.error("Failed to add device:", err)
      setFormError(err.response?.data?.message || "Failed to add device. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async () => {
    // Validate form
    if (!editDeviceName || !editDeviceType || !editDeviceCapacity) {
      setEditFormError("Please fill in all required fields")
      return
    }

    setIsEditSubmitting(true)
    setEditFormError(null)

    try {
      // Get token from localStorage
      const token = localStorage.getItem("access_token")

      // Send to API
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/devices/${selectedDevice._id || selectedDevice.id}`,
        {
          device_name: editDeviceName,
          device_type: editDeviceType,
          capacity: editDeviceCapacity,
          status: editDeviceStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      // Update local state to avoid refetching
      const updatedDevices = devices.map((d) => {
        if ((d._id || d.id) === (selectedDevice._id || selectedDevice.id)) {
          return {
            ...d,
            device_name: editDeviceName,
            device_type: editDeviceType,
            capacity: editDeviceCapacity,
            status: editDeviceStatus.charAt(0).toUpperCase() + editDeviceStatus.slice(1),
          }
        }
        return d
      })
      setDevices(updatedDevices)

      // Close dialog
      setEditDeviceOpen(false)
    } catch (err: any) {
      console.error("Failed to update device:", err)
      setEditFormError(err.response?.data?.message || "Failed to update device. Please try again.")
    } finally {
      setIsEditSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("devices")}</h1>
        <Dialog open={addDeviceOpen} onOpenChange={setAddDeviceOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("addDevice")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("addDevice")}</DialogTitle>
              <DialogDescription>Add a new storage device to the system</DialogDescription>
            </DialogHeader>

            {formError && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-3 rounded-md text-sm">
                {formError}
              </div>
            )}

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="device-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="device-name"
                  className="col-span-3"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="device-type" className="text-right">
                  Type
                </Label>
                <Select value={newDeviceType} onValueChange={setNewDeviceType} disabled={isSubmitting}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hardDisk">Hard Disk</SelectItem>
                    <SelectItem value="flashDrive">Flash Drive</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="device-capacity" className="text-right">
                  Capacity
                </Label>
                <Input
                  id="device-capacity"
                  className="col-span-3"
                  value={newDeviceCapacity}
                  onChange={(e) => setNewDeviceCapacity(e.target.value)}
                  placeholder="e.g. 500 GB, 2 TB"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="device-status" className="text-right">
                  Status
                </Label>
                <Select value={newDeviceStatus} onValueChange={setNewDeviceStatus} disabled={isSubmitting}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddDevice} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Saving...</span>
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

      <Card>
        <CardHeader>
          <CardTitle>{t("deviceList")}</CardTitle>
          <CardDescription>Manage your storage devices</CardDescription>
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
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="hardDisk">Hard Disk</SelectItem>
                  <SelectItem value="flashDrive">Flash Drive</SelectItem>
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
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="uppercase">{t("deviceType")}</TableHead>
                  <TableHead className="uppercase">Name</TableHead>
                  <TableHead className="uppercase">Capacity</TableHead>
                  <TableHead className="uppercase">Status</TableHead>
                  <TableHead className="uppercase">Added Date</TableHead>
                  <TableHead className="uppercase text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading state
                  Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <TableRow key={`loading-${index}`}>
                        <TableCell colSpan={6}>
                          <div className="h-8 w-full animate-pulse rounded bg-muted"></div>
                        </TableCell>
                      </TableRow>
                    ))
                ) : displayedDevices.length > 0 ? (
                  // Data state
                  displayedDevices.map((device, index) => (
                    <TableRow key={device._id || device.id || `device-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(device.device_type || device.type)}
                          <span>{t(device.device_type || device.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{device.device_name || device.name}</TableCell>
                      <TableCell>{device.capacity}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${
                            device.status === "Active" || device.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {device.status}
                        </span>
                      </TableCell>
                      <TableCell>{device.added_date || device.addedDate || device.created_at}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditDevice(device)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">{t("editDevice")}</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteDevice(device)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">{t("deleteDevice")}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // Empty state
                  <TableRow key="empty-row">
                    <TableCell colSpan={6} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && filteredDevices.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredDevices.length)} of {filteredDevices.length} devices
              </div>
              <TablePagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredDevices.length / itemsPerPage)}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Device Dialog */}
      <Dialog open={editDeviceOpen} onOpenChange={setEditDeviceOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("editDevice")}</DialogTitle>
            <DialogDescription>Edit storage device details</DialogDescription>
          </DialogHeader>

          {editFormError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-3 rounded-md text-sm">
              {editFormError}
            </div>
          )}

          {selectedDevice && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-device-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-device-name"
                  value={editDeviceName}
                  onChange={(e) => setEditDeviceName(e.target.value)}
                  className="col-span-3"
                  disabled={isEditSubmitting}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-device-type" className="text-right">
                  Type
                </Label>
                <Select value={editDeviceType} onValueChange={setEditDeviceType} disabled={isEditSubmitting}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hardDisk">Hard Disk</SelectItem>
                    <SelectItem value="flashDrive">Flash Drive</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-device-capacity" className="text-right">
                  Capacity
                </Label>
                <Input
                  id="edit-device-capacity"
                  value={editDeviceCapacity}
                  onChange={(e) => setEditDeviceCapacity(e.target.value)}
                  className="col-span-3"
                  disabled={isEditSubmitting}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-device-status" className="text-right">
                  Status
                </Label>
                <Select value={editDeviceStatus} onValueChange={setEditDeviceStatus} disabled={isEditSubmitting}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
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
            <Button variant="outline" onClick={() => setEditDeviceOpen(false)} disabled={isEditSubmitting}>
              {t("cancel")}
            </Button>
            <Button type="submit" onClick={handleEditSubmit} disabled={isEditSubmitting}>
              {isEditSubmitting ? (
                <>
                  <span className="mr-2">Saving...</span>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </>
              ) : (
                t("save")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Device Dialog */}
      <Dialog open={deleteDeviceOpen} onOpenChange={setDeleteDeviceOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("deleteDevice")}</DialogTitle>
            <DialogDescription>{t("confirmDelete")}</DialogDescription>
          </DialogHeader>
          {selectedDevice && (
            <div className="py-4">
              <p>
                Are you sure you want to delete device{" "}
                <strong>{selectedDevice.device_name || selectedDevice.name}</strong>?
              </p>
              <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDeviceOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteDevice}>
              {t("deleteDevice")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
