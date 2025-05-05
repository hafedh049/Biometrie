"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Files, HardDrive, Layers, Shield, Upload, Download, Lock } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import axios from "axios"

// Define the file interface based on the API response
interface FileData {
  id: string
  name: string
  size?: number
  file_size?: number
  type: string
  encrypted: boolean
  partition_id: string
  device_id: string
  created_at: string
  updated_at: string
  last_accessed: string
}

export default function ClientDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  const [files, setFiles] = useState<FileData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [partitionSizes, setPartitionSizes] = useState<Record<string, number>>({})
  const [totalStorageCapacity, setTotalStorageCapacity] = useState<number>(5 * 1024 * 1024 * 1024) // Default 5GB

  const fetchPartitionSizes = async (uniquePartitionIds: string[]) => {
    try {
      const token = localStorage.getItem("access_token")
      if (!token || uniquePartitionIds.length === 0) return

      // Create a map to store partition sizes
      const sizeMap: Record<string, number> = {}
      let totalSize = 0

      // Fetch details for each partition
      await Promise.all(
        uniquePartitionIds.map(async (partitionId) => {
          try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/partitions/${partitionId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })

            const partition = response.data
            if (partition && partition.size) {
              // Try to parse the size (could be in format like "500MB" or "2GB")
              let size = 0

              // Handle different formats
              if (typeof partition.size === "number") {
                size = partition.size
              } else if (typeof partition.size === "string") {
                // Try to parse strings like "500MB", "2GB", etc.
                const match = partition.size.match(/^(\d+(?:\.\d+)?)\s*([KMGT]B)?$/i)
                if (match) {
                  const value = Number.parseFloat(match[1])
                  const unit = match[2]?.toUpperCase() || "B"

                  // Convert to bytes
                  switch (unit) {
                    case "KB":
                      size = value * 1024
                      break
                    case "MB":
                      size = value * 1024 * 1024
                      break
                    case "GB":
                      size = value * 1024 * 1024 * 1024
                      break
                    case "TB":
                      size = value * 1024 * 1024 * 1024 * 1024
                      break
                    default:
                      size = value
                      break
                  }
                }
              }

              sizeMap[partitionId] = size
              totalSize += size
            }
          } catch (error) {
            console.error(`Error fetching partition ${partitionId}:`, error)
          }
        }),
      )

      // Update state with the partition sizes and total
      setPartitionSizes(sizeMap)
      setTotalStorageCapacity(totalSize > 0 ? totalSize : 5 * 1024 * 1024 * 1024)
    } catch (error) {
      console.error("Error fetching partition sizes:", error)
    }
  }

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("access_token")

        if (!token) {
          throw new Error("Authentication token not found")
        }

        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/files/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        // Handle different response structures
        const fileData = Array.isArray(response.data) ? response.data : response.data.files || []

        setFiles(fileData)

        // Extract unique partition IDs from files
        const uniquePartitionIds = Array.from(
          new Set(fileData.filter((file) => file && file.partition_id).map((file) => file.partition_id)),
        )

        // Fetch sizes for these partitions
        await fetchPartitionSizes(uniquePartitionIds)

        setError(null)
      } catch (err) {
        console.error("Error fetching files:", err)
        setError(err.message || "Failed to fetch files")
        setFiles([]) // Ensure files is at least an empty array on error
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchFiles()
    }
  }, [user])

  // Safe function to count encrypted files
  const countEncryptedFiles = () => {
    if (!files || !Array.isArray(files)) return 0
    return files.filter((file) => file && file.encrypted).length
  }

  // Safe function to calculate total size (using size property)
  const calculateTotalSize = () => {
    if (!files || !Array.isArray(files)) return 0
    return files.reduce((total, file) => total + (file && typeof file.size === "number" ? file.size : 0), 0)
  }

  // Safe function to calculate total file size (using file_size property)
  const calculateTotalFileSize = () => {
    if (!files || !Array.isArray(files)) return 0
    return files.reduce((total, file) => {
      // First check for file_size property
      if (file && typeof file.file_size === "number") {
        return total + file.file_size
      }
      // Fall back to size property if file_size is not available
      else if (file && typeof file.size === "number") {
        return total + file.size
      }
      return total
    }, 0)
  }

  // Safe function to get the total size considering both size and file_size properties
  const getTotalStorageUsed = () => {
    const sizeTotal = calculateTotalSize()
    const fileSizeTotal = calculateTotalFileSize()

    // If both are zero, return zero
    if (sizeTotal === 0 && fileSizeTotal === 0) return 0

    // If one is zero, return the other
    if (sizeTotal === 0) return fileSizeTotal
    if (fileSizeTotal === 0) return sizeTotal

    // If both have values, return the larger one (assuming they represent the same data)
    return Math.max(sizeTotal, fileSizeTotal)
  }

  // Safe function to count unique partitions
  const countUniquePartitions = () => {
    if (!files || !Array.isArray(files)) return 0
    const partitionIds = new Set()
    files.forEach((file) => {
      if (file && file.partition_id) {
        partitionIds.add(file.partition_id)
      }
    })
    return partitionIds.size
  }

  // Get recent activities from files data
  const getRecentActivities = () => {
    if (!files || !Array.isArray(files) || files.length === 0) {
      return [
        { type: "upload", time: "No recent activity", file: "No files found", icon: Upload, color: "text-blue-500" },
      ]
    }

    // Sort files by updated_at date (most recent first)
    const sortedFiles = [...files].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime()
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime()
      return dateB - dateA
    })

    // Take the 3 most recent files
    const recentFiles = sortedFiles.slice(0, 3)

    // Convert to activities
    return recentFiles.map((file) => {
      // Determine activity type based on file properties
      let activityType = "upload"
      let IconComponent = Upload // Use PascalCase for component references

      if (file.last_accessed && new Date(file.last_accessed) > new Date(file.updated_at || file.created_at)) {
        activityType = "download"
        IconComponent = Download
      } else if (file.encrypted) {
        activityType = "encrypt"
        IconComponent = Lock
      }

      // Format the time
      const timeAgo = formatTimeAgo(new Date(file.updated_at || file.created_at || Date.now()))

      return {
        type: activityType,
        time: timeAgo,
        file: file.name,
        icon: IconComponent,
        color:
          activityType === "download"
            ? "text-amber-500"
            : activityType === "encrypt"
              ? "text-green-500"
              : "text-blue-500",
      }
    })
  }

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return `${Math.floor(diffInSeconds / 86400)} days ago`
  }

  const stats = [
    {
      title: "My Files",
      value: isLoading ? "..." : (Array.isArray(files) ? files.length : 0).toString(),
      description: "Total files uploaded",
      icon: Files,
      color: "bg-blue-500",
    },
    {
      title: "Encrypted Files",
      value: isLoading ? "..." : countEncryptedFiles().toString(),
      description: "Files protected with fingerprint",
      icon: Shield,
      color: "bg-green-500",
    },
    {
      title: "Storage Used",
      value: isLoading ? "..." : formatBytes(getTotalStorageUsed()),
      description: `Out of ${formatBytes(totalStorageCapacity)} total`,
      icon: HardDrive,
      color: "bg-purple-500",
    },
    {
      title: "Partitions",
      value: isLoading ? "..." : countUniquePartitions().toString(),
      description: "Accessible partitions",
      icon: Layers,
      color: "bg-amber-500",
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  function formatBytes(bytes, decimals = 2) {
    if (!bytes || bytes === 0) return "0 Bytes"

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"]

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  // Get recent activities
  const recentActivities = getRecentActivities()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Client Dashboard</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.name || "User"}</CardTitle>
            <CardDescription>
              This is your personal dashboard where you can manage your files and security settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">Error loading files: {error}</p>
              </div>
            )}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            >
              {stats.map((stat) => (
                <motion.div
                  key={stat.title}
                  variants={item}
                  whileHover={{
                    y: -5,
                    boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
                    transition: { duration: 0.3, ease: "easeOut" },
                  }}
                  className="transform transition-all duration-300"
                >
                  <Card className="overflow-hidden neomorphic-card border-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                      <motion.div
                        className={`${stat.color} rounded-full p-2 text-white`}
                        whileHover={{
                          scale: 1.15,
                          transition: { duration: 0.3, ease: "easeOut" },
                        }}
                      >
                        <stat.icon className="h-4 w-4" />
                      </motion.div>
                    </CardHeader>
                    <CardContent>
                      <motion.div
                        className="text-2xl font-bold"
                        whileHover={{
                          scale: 1.05,
                          color: "var(--primary)",
                          transition: { duration: 0.3, ease: "easeOut" },
                        }}
                      >
                        {stat.value}
                      </motion.div>
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </CardContent>
                    <motion.div
                      className="absolute inset-0 bg-primary/5 opacity-0 rounded-lg"
                      whileHover={{
                        opacity: 1,
                        transition: { duration: 0.5 },
                      }}
                    />
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks you can perform</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => router.push("/client/file-manager")}
              >
                <Upload className="h-4 w-4" />
                Manage Files
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => router.push("/client/security")}
              >
                <Shield className="h-4 w-4" />
                Security Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Based on your file history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center p-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="flex items-center justify-center p-6 text-muted-foreground">
                    No recent activity found
                  </div>
                ) : (
                  recentActivities.map((activity, index) => {
                    const ActivityIcon = activity.icon
                    return (
                      <div key={index} className="flex items-center gap-4 rounded-lg border p-3">
                        <ActivityIcon className={`h-5 w-5 ${activity.color}`} />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">
                            {activity.type === "upload"
                              ? "File uploaded"
                              : activity.type === "download"
                                ? "File downloaded"
                                : "File encrypted"}
                          </p>
                          <div className="flex justify-between">
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                            <p className="text-xs font-medium truncate max-w-[150px]">{activity.file}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
