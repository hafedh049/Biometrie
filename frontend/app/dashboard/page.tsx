"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, RefreshCw, Trash2, Download, FileText } from "lucide-react"

import { useLanguage } from "@/components/language-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, HardDrive, Files, Layers } from "lucide-react"
import { motion } from "framer-motion"

import { useRouter } from "next/navigation"
import UserService from "@/services/user-service"

import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"

export default function DashboardPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<any>({
    stats: {
      users: 0,
      devices: 0,
      partitions: 0,
      files: 0,
    },
    recent_activity: {
      users: [],
      files: [],
      devices: [],
    },
  })

  const [error, setError] = useState(null)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  const { toast } = useToast() // Move useToast hook to the top level
  const [isLoading, setIsLoading] = useState(true)

  // Files state
  const [files, setFiles] = useState([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [fileError, setFileError] = useState(null)

  // Add new state variables for devices and partitions
  const [devices, setDevices] = useState([])
  const [partitions, setPartitions] = useState([])
  const [isLoadingDevices, setIsLoadingDevices] = useState(false)
  const [isLoadingPartitions, setIsLoadingPartitions] = useState(false)
  const [deviceError, setDeviceError] = useState(null)
  const [partitionError, setPartitionError] = useState(null)

  // Logs state
  const [logs, setLogs] = useState([])
  const [logStats, setLogStats] = useState({
    log_types: [],
    statuses: [],
    recent_errors: [],
    total_logs: 0,
  })
  const [logFilters, setLogFilters] = useState({
    log_type: "",
    user_id: "",
    status: "",
    start_date: "",
    end_date: "",
    page: 1,
    per_page: 50,
  })
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [isClearingLogs, setIsClearingLogs] = useState(false)
  const [daysToKeep, setDaysToKeep] = useState(30)

  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 10

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const data = await UserService.getDashboardStats()
        setDashboardData(data)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Fetch all files
  useEffect(() => {
    fetchAllFiles()
  }, [])

  // Function to fetch all files
  const fetchAllFiles = async () => {
    try {
      setIsLoadingFiles(true)
      setFileError(null)

      // Get token from localStorage
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

      // Fetch files from API
      const response = await axios.get(`${apiUrl}/api/files/`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        params: {
          per_page: 100, // Get more files to have comprehensive data
        },
      })

      setFiles(response.data.files || [])

      // Update file type distribution data for charts
      if (response.data.files && response.data.files.length > 0) {
        const fileTypes = {}
        response.data.files.forEach((file) => {
          const type = file.file_type || "other"
          if (!fileTypes[type]) {
            fileTypes[type] = 0
          }
          fileTypes[type]++
        })

        // You could use this data to update charts or other visualizations
        console.log("File type distribution:", fileTypes)
      }
    } catch (err) {
      console.error("Failed to fetch files:", err)
      setFileError(err)

      // Provide some sample data for demonstration
      setFiles([])

      toast({
        title: "Error",
        description: "Failed to load files. Using sample data instead.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingFiles(false)
    }
  }

  // Add new functions to fetch all devices and partitions
  const fetchAllDevices = async () => {
    try {
      setIsLoadingDevices(true)
      setDeviceError(null)

      // Get token from localStorage
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

      // Fetch devices from API
      const response = await axios.get(`${apiUrl}/api/devices/`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        params: {
          per_page: 100, // Get more devices to have comprehensive data
        },
      })

      setDevices(response.data.devices || [])
    } catch (err) {
      console.error("Failed to fetch devices:", err)
      setDeviceError(err)

      setDevices([])
      toast({
        title: "Error",
        description: "Failed to load devices",
        variant: "destructive",
      })
    } finally {
      setIsLoadingDevices(false)
    }
  }

  const fetchAllPartitions = async () => {
    try {
      setIsLoadingPartitions(true)
      setPartitionError(null)

      // Get token from localStorage
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

      // Fetch partitions from API
      const response = await axios.get(`${apiUrl}/api/partitions/`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        params: {
          per_page: 100, // Get more partitions to have comprehensive data
        },
      })

      setPartitions(response.data.partitions || [])
    } catch (err) {
      console.error("Failed to fetch partitions:", err)
      setPartitionError(err)

      setPartitions([])
      toast({
        title: "Error",
        description: "Failed to load partitions",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPartitions(false)
    }
  }

  // Load logs when reports tab is selected
  const handleTabChange = (value) => {
    if (value === "reports") {
      fetchLogs()
      fetchLogStats()
    } else if (value === "analytics") {
      // Refresh data when analytics tab is selected
      fetchAllFiles()
      fetchAllDevices()
      fetchAllPartitions()
    }
  }

  // Helper functions to calculate distribution data from devices and partitions
  const calculateDeviceDistribution = () => {
    if (!devices || devices.length === 0) return []

    const typeCount = {}
    devices.forEach((device) => {
      let type = device.device_type || "Other"

      // Format flashDrive to FLASH DRIVE
      if (type.toLowerCase() === "flashdrive") {
        type = "FLASH DRIVE"
      }

      typeCount[type] = (typeCount[type] || 0) + 1
    })

    // Define colors for each device type
    const typeColors = {
      USB: "#3b82f6", // blue
      SSD: "#10b981", // green
      HDD: "#f59e0b", // amber
      "FLASH DRIVE": "#f43f5e", // rose
      Other: "#8b5cf6", // purple
    }

    return Object.entries(typeCount).map(([name, value]) => ({
      name,
      value,
      fill: typeColors[name] || "#8b5cf6", // default to purple if no color defined
    }))
  }

  const calculatePartitionDistribution = () => {
    if (!partitions || partitions.length === 0) return []

    const formatCount = {}
    partitions.forEach((partition) => {
      const format = partition.format || "Other"
      formatCount[format] = (formatCount[format] || 0) + 1
    })

    // Define colors for each partition format
    const formatColors = {
      NTFS: "#ef4444", // red
      FAT32: "#3b82f6", // blue
      exFAT: "#10b981", // green
      EXT4: "#f59e0b", // amber
      Other: "#8b5cf6", // purple
    }

    return Object.entries(formatCount).map(([name, value]) => ({
      name,
      value,
      fill: formatColors[name] || "#8b5cf6", // default to purple if no color defined
    }))
  }

  const stats = [
    {
      title: t("users"),
      value: dashboardData.stats.users.toString(),
      description: t("userList"),
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: t("devices"),
      value: dashboardData.stats.devices.toString(),
      description: t("deviceList"),
      icon: HardDrive,
      color: "bg-green-500",
    },
    {
      title: t("partitions"),
      value: dashboardData.stats.partitions.toString(),
      description: t("partitionList"),
      icon: Layers,
      color: "bg-purple-500",
    },
    {
      title: t("files"),
      value: dashboardData.stats.files.toString(),
      description: t("fileList"),
      icon: Files,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 text-primary" />
          </motion.div>
          <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  const getLogTypeColor = (type) => {
    const colorMap = {
      user: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
      auth: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      system:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      file: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
      device: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
      partition:
        "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800",
      error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    }

    return colorMap[type.toLowerCase()] || "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
  }

  const getFileTypeColor = (type) => {
    if (!type) return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"

    const colorMap = {
      pdf: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      image: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      archive: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      text: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    }

    return colorMap[type.toLowerCase()] || "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
  }

  const fetchLogs = async () => {
    try {
      setIsLoadingLogs(true)
      // Get token from localStorage
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

      const params = {
        ...logFilters,
        start_date: logFilters.start_date ? logFilters.start_date : undefined,
        end_date: logFilters.end_date ? logFilters.end_date : undefined,
      }

      const response = await axios.get(`${apiUrl}/api/logs/`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        params,
      })

      setLogs(response.data.logs || [])
    } catch (error) {
      console.error("Failed to fetch logs:", error)
      toast({
        title: "Error",
        description: "Failed to load logs",
        variant: "destructive",
      })

      setLogs([])
      toast({
        title: "Error",
        description: "Failed to load logs",
        variant: "destructive",
      })
    } finally {
      setIsLoadingLogs(false)
    }
  }

  const fetchLogStats = async () => {
    try {
      // Get token from localStorage
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

      const response = await axios.get(`${apiUrl}/api/logs/stats`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      })

      setLogStats(response.data)
    } catch (error) {
      console.error("Failed to fetch log stats:", error)
      toast({
        title: "Error",
        description: "Failed to load log stats",
        variant: "destructive",
      })

      setLogStats({
        log_types: [],
        statuses: [],
        recent_errors: [],
        total_logs: 0,
      })
      toast({
        title: "Error",
        description: "Failed to load log statistics",
        variant: "destructive",
      })
    }
  }

  const downloadLogsAsCSV = () => {
    const csvData = convertLogsToCSV(logs)
    downloadCSV(csvData, "system_logs.csv")
  }

  const downloadLogsAsPDF = () => {
    generatePDF(logs)
  }

  const clearOldLogs = async () => {
    try {
      setIsClearingLogs(true)
      // Get token from localStorage
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

      await axios.delete(`${apiUrl}/api/logs/clear`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        data: { days_to_keep: daysToKeep },
      })

      toast({
        title: "Success",
        description: "Old logs cleared successfully",
      })

      // Refresh logs after clearing
      fetchLogs()
      fetchLogStats()
    } catch (error) {
      console.error("Failed to clear old logs:", error)
      toast({
        title: "Error",
        description: "Failed to clear old logs",
        variant: "destructive",
      })
    } finally {
      setIsClearingLogs(false)
    }
  }

  const convertLogsToCSV = (logs) => {
    const header = ["Timestamp", "Log Type", "Status", "User ID", "Message"]
    const csvRows = [
      header.join(","),
      ...logs.map((log) => [log.timestamp, log.log_type, log.status, log.user_id, log.message].join(",")),
    ]
    return csvRows.join("\n")
  }

  const downloadCSV = (data, filename) => {
    const blob = new Blob([data], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.setAttribute("href", url)
    a.setAttribute("download", filename)
    a.click()
  }

  const generatePDF = async (logs) => {
    try {
      const { jsPDF } = await import("jspdf")

      const doc = new jsPDF()

      // Set title
      doc.setFontSize(18)
      doc.text("System Logs Report", 14, 22)
      doc.setFontSize(11)
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)

      // Add table headers
      const headers = ["Timestamp", "Log Type", "Status", "User ID", "Message"]
      const columnWidths = [40, 25, 25, 25, 75] // Approximate widths

      // Set font for headers
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")

      // Draw header row
      let y = 40
      let x = 14

      headers.forEach((header, i) => {
        doc.text(header, x, y)
        x += columnWidths[i]
      })

      // Draw line under headers
      doc.line(14, y + 2, 196, y + 2)

      // Set font for data
      doc.setFont("helvetica", "normal")
      y += 10

      // Add data rows
      logs.forEach((log, rowIndex) => {
        if (y > 280) {
          // Check if we need a new page
          doc.addPage()
          y = 20
        }

        x = 14

        // Format timestamp
        const timestamp = log.timestamp ? format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss") : "N/A"
        doc.text(timestamp, x, y)
        x += columnWidths[0]

        // Log type
        doc.text(log.log_type || "N/A", x, y)
        x += columnWidths[1]

        // Status
        doc.text(log.status || "N/A", x, y)
        x += columnWidths[2]

        // User ID
        doc.text(log.user_id || "N/A", x, y)
        x += columnWidths[3]

        // Message (truncate if too long)
        const message = log.message || "N/A"
        const truncatedMessage = message.length > 50 ? message.substring(0, 47) + "..." : message
        doc.text(truncatedMessage, x, y)

        y += 7 // Move to next row
      })

      doc.save("system_logs.pdf")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-6" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>{t("recentActivity")}</CardTitle>
                <CardDescription>{t("recentActivityDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recent_activity.users.slice(0, 3).map((user: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 rounded-lg border p-3">
                      <Users className="h-5 w-5 text-blue-500" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {user.username.charAt(0).toUpperCase() + user.username.slice(1)} added
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(user.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {dashboardData.recent_activity.files.slice(0, 3).map((file: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 rounded-lg border p-3">
                      <Files className="h-5 w-5 text-amber-500" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {file.file_name.charAt(0).toUpperCase() + file.file_name.slice(1)} uploaded
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(file.upload_date).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {dashboardData.recent_activity.devices.slice(0, 3).map((device: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 rounded-lg border p-3">
                      <HardDrive className="h-5 w-5 text-green-500" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {device.device_name.charAt(0).toUpperCase() + device.device_name.slice(1)} added
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(device.added_date).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle>{t("quickActions")}</CardTitle>
                <CardDescription>{t("quickActionsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => router.push("/dashboard/users?action=add")}
                  >
                    <Users className="h-4 w-4" />
                    {t("addUser")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => router.push("/dashboard/devices?action=add")}
                  >
                    <HardDrive className="h-4 w-4" />
                    {t("addDevice")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>View system analytics and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Device and Partition Distribution Charts */}
                  <Card className="overflow-hidden">
                    <CardHeader>
                      <CardTitle>Device & Partition Distribution</CardTitle>
                      <CardDescription>Overview of devices and partitions by type and status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {isLoadingDevices || isLoadingPartitions ? (
                          <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : deviceError || partitionError ? (
                          <div className="flex h-full flex-col items-center justify-center text-center">
                            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                            <p className="text-sm text-muted-foreground">Failed to load device or partition data</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4 h-full">
                            {/* Device Distribution */}
                            <div className="h-full">
                              <h3 className="text-sm font-medium text-center mb-2">
                                Devices by Type ({devices.length} total)
                              </h3>
                              <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                  <Pie
                                    data={calculateDeviceDistribution()}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    outerRadius={70}
                                    innerRadius={40}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                  />
                                  <Tooltip formatter={(value) => [`${value} devices`, "Count"]} />
                                  <Legend
                                    layout="horizontal"
                                    verticalAlign="bottom"
                                    align="center"
                                    wrapperStyle={{
                                      paddingTop: "10px",
                                      fontSize: "12px",
                                      fontWeight: "500",
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>

                            {/* Partition Distribution */}
                            <div className="h-full">
                              <h3 className="text-sm font-medium text-center mb-2">
                                Partitions by Format ({partitions.length} total)
                              </h3>
                              <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                  <Pie
                                    data={calculatePartitionDistribution()}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    outerRadius={70}
                                    innerRadius={40}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                  />
                                  <Tooltip formatter={(value) => [`${value} partitions`, "Count"]} />
                                  <Legend
                                    layout="horizontal"
                                    verticalAlign="bottom"
                                    align="center"
                                    wrapperStyle={{
                                      paddingTop: "10px",
                                      fontSize: "12px",
                                      fontWeight: "500",
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  {/* Files Distribution Pie Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>File Distribution</CardTitle>
                      <CardDescription>Files by type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {isLoadingFiles ? (
                          <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : fileError ? (
                          <div className="flex h-full flex-col items-center justify-center text-center">
                            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                            <p className="text-sm text-muted-foreground">Failed to load file data</p>
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={(() => {
                                // Define file extension categories with their colors
                                const fileCategories = [
                                  {
                                    name: "Documents",
                                    color: "#ef4444",
                                    extensions: ["pdf", "doc", "docx", "txt", "rtf", "odt"],
                                  },
                                  {
                                    name: "Images",
                                    color: "#3b82f6",
                                    extensions: ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"],
                                  },
                                  {
                                    name: "Archives",
                                    color: "#f59e0b",
                                    extensions: ["zip", "rar", "7z", "tar", "gz", "bz2"],
                                  },
                                  {
                                    name: "Code",
                                    color: "#10b981",
                                    extensions: ["js", "ts", "html", "css", "py", "java", "c", "cpp", "php"],
                                  },
                                  {
                                    name: "Media",
                                    color: "#8b5cf6",
                                    extensions: ["mp3", "mp4", "avi", "mov", "wav", "flac"],
                                  },
                                  {
                                    name: "Other",
                                    color: "#6b7280",
                                    extensions: [],
                                  },
                                ]

                                // Create a map to store extension counts by category
                                const categoryData = {}
                                fileCategories.forEach((category) => {
                                  categoryData[category.name] = {
                                    name: category.name,
                                    color: category.color,
                                    extensions: {},
                                  }
                                })

                                // Process each file
                                files.forEach((file) => {
                                  if (!file.file_name) return

                                  // Extract extension from filename
                                  const extension = file.file_name.split(".").pop()?.toLowerCase() || ""
                                  if (!extension) return

                                  // Find which category this extension belongs to
                                  let matched = false
                                  for (const category of fileCategories) {
                                    if (category.extensions.includes(extension)) {
                                      // Increment the count for this extension in this category
                                      if (!categoryData[category.name].extensions[extension]) {
                                        categoryData[category.name].extensions[extension] = 0
                                      }
                                      categoryData[category.name].extensions[extension]++
                                      matched = true
                                      break
                                    }
                                  }

                                  // If no category matched, count as "Other"
                                  if (!matched) {
                                    if (!categoryData["Other"].extensions[extension]) {
                                      categoryData["Other"].extensions[extension] = 0
                                    }
                                    categoryData["Other"].extensions[extension]++
                                  }
                                })

                                // Convert to array format for the chart
                                // Only include categories with files
                                return Object.values(categoryData)
                                  .filter((category) => Object.keys(category.extensions).length > 0)
                                  .map((category) => {
                                    // Create a data object with category name and all extensions
                                    const dataObj = { name: category.name, color: category.color }

                                    // Add each extension as a property
                                    Object.entries(category.extensions).forEach(([ext, count]) => {
                                      dataObj[ext] = count
                                    })

                                    return dataObj
                                  })
                              })()}
                              layout="vertical"
                              margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                              barGap={8}
                              barSize={30}
                            >
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                              <XAxis type="number" />
                              <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fontSize: 14, fontWeight: 500 }}
                                width={100}
                              />
                              <Tooltip
                                cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                                contentStyle={{
                                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                                  borderRadius: "8px",
                                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                  border: "none",
                                }}
                                formatter={(value, name) => [`${value} files`, name]}
                              />
                              <Legend
                                wrapperStyle={{
                                  paddingTop: "10px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                }}
                              />
                              {(() => {
                                // Get all unique extensions across all categories
                                const allExtensions = new Set()
                                files.forEach((file) => {
                                  if (file.file_name) {
                                    const ext = file.file_name.split(".").pop()?.toLowerCase()
                                    if (ext) allExtensions.add(ext)
                                  }
                                })

                                // Generate a color for each extension
                                const extensionColors = {}
                                const baseColors = [
                                  "#ef4444",
                                  "#f97316",
                                  "#f59e0b",
                                  "#eab308",
                                  "#84cc16",
                                  "#10b981",
                                  "#14b8a6",
                                  "#06b6d4",
                                  "#0ea5e9",
                                  "#3b82f6",
                                  "#6366f1",
                                  "#8b5cf6",
                                  "#a855f7",
                                  "#d946ef",
                                  "#ec4899",
                                  "#f43f5e",
                                ]

                                // Assign colors to extensions
                                Array.from(allExtensions).forEach((ext, i) => {
                                  extensionColors[ext] = baseColors[i % baseColors.length]
                                })

                                // Create a Bar for each unique extension
                                return Array.from(allExtensions).map((ext, index) => (
                                  <Bar
                                    key={`ext-${ext}`}
                                    dataKey={ext}
                                    name={ext.toUpperCase()}
                                    stackId="stack"
                                    fill={extensionColors[ext]}
                                    animationDuration={1500 + index * 100}
                                    animationEasing="ease-out"
                                    className="hover:opacity-80 transition-opacity duration-300"
                                    style={{ filter: "drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))" }}
                                  />
                                ))
                              })()}
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Empty space where the files table was */}
                  <div className="h-4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>View and manage system logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{logStats.total_logs}</div>
                        <p className="text-xs text-muted-foreground">Total Logs</p>
                        <div className="flex justify-center gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={downloadLogsAsCSV}
                            disabled={logs.length === 0}
                          >
                            <Download className="h-3.5 w-3.5" />
                            CSV
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={downloadLogsAsPDF}
                            disabled={logs.length === 0}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Log Types Distribution */}

                  <Card className="md:col-span-3">
                    <CardContent className="pt-6">
                      <div className="flex flex-wrap gap-3">
                        {isLoadingLogs ? (
                          <div className="w-full flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : logStats.log_types && logStats.log_types.length > 0 ? (
                          logStats.log_types.map((type, index) => {
                            // Get the appropriate color class based on log type
                            const colorClass = getLogTypeColor(type._id)
                            return (
                              <div
                                key={index}
                                className={`relative group flex items-center rounded-full px-4 py-2 border transition-all duration-200 ${colorClass} hover:shadow-md`}
                              >
                                <span className="font-medium uppercase text-xs mr-2">{type._id}</span>
                                <div className="flex items-center justify-center rounded-full bg-background/80 dark:bg-background/30 w-6 h-6 text-xs font-bold">
                                  {type.count}
                                </div>
                                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-10 bg-white dark:bg-black transition-opacity duration-200"></div>
                              </div>
                            )
                          })
                        ) : (
                          <div className="w-full text-center py-4 text-muted-foreground">
                            No log type data available
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Log Filters */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Log Filters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <Label htmlFor="log-type">Log Type</Label>
                        <Select
                          value={logFilters.log_type || "all"}
                          onValueChange={(value) => setLogFilters({ ...logFilters, log_type: value })}
                        >
                          <SelectTrigger id="log-type" className="uppercase">
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="uppercase font-medium">
                              All Types
                            </SelectItem>
                            {logStats.log_types.map((type, index) => (
                              <SelectItem key={index} value={type._id} className="uppercase">
                                {type._id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="log-status">Status</Label>
                        <Select
                          value={logFilters.status || "all"}
                          onValueChange={(value) => setLogFilters({ ...logFilters, status: value })}
                        >
                          <SelectTrigger id="log-status" className="uppercase">
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="uppercase font-medium">
                              All Statuses
                            </SelectItem>
                            {logStats.statuses.map((status, index) => (
                              <SelectItem key={index} value={status._id} className="uppercase">
                                {status._id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="user-id">User ID</Label>
                        <Input
                          id="user-id"
                          placeholder="Filter by user ID"
                          value={logFilters.user_id}
                          onChange={(e) => setLogFilters({ ...logFilters, user_id: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          className="dark:text-white dark:[color-scheme:dark]"
                          value={logFilters.start_date}
                          onChange={(e) => setLogFilters({ ...logFilters, start_date: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          className="dark:text-white dark:[color-scheme:dark]"
                          value={logFilters.end_date}
                          onChange={(e) => setLogFilters({ ...logFilters, end_date: e.target.value })}
                        />
                      </div>

                      <div className="flex items-end">
                        <Button className="w-full" onClick={fetchLogs} disabled={isLoadingLogs}>
                          {isLoadingLogs ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Apply Filters
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Log Maintenance */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Log Maintenance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <Label htmlFor="days-to-keep">Days to Keep Logs</Label>
                        <Input
                          id="days-to-keep"
                          type="number"
                          min="1"
                          value={daysToKeep}
                          onChange={(e) => setDaysToKeep(Number.parseInt(e.target.value))}
                        />
                      </div>
                      <Button variant="destructive" onClick={clearOldLogs} disabled={isClearingLogs}>
                        {isClearingLogs ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Clearing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear Old Logs
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Log Table */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Log Entries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingLogs ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : logs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No logs found matching your filters</div>
                    ) : (
                      <>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="font-semibold text-primary">Timestamp</TableHead>
                                <TableHead className="font-semibold text-primary">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                    TYPE
                                  </span>
                                </TableHead>
                                <TableHead className="font-semibold text-primary">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                    STATUS
                                  </span>
                                </TableHead>
                                <TableHead className="font-semibold text-primary">User ID</TableHead>
                                <TableHead className="font-semibold text-primary">Message</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {logs
                                .slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage)
                                .map((log, index) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      {log.timestamp ? format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss") : "N/A"}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={`uppercase font-medium ${getLogTypeColor(log.log_type)} hover:bg-opacity-80 transition-colors`}
                                      >
                                        {log.log_type}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          log.status === "error" || log.status === "critical"
                                            ? "destructive"
                                            : log.status === "warning"
                                              ? "warning"
                                              : "success"
                                        }
                                        className="uppercase font-medium"
                                      >
                                        {log.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{log.user_id || "N/A"}</TableCell>
                                    <TableCell className="max-w-md truncate">{log.message}</TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between space-x-2 py-4">
                          <div className="text-sm text-muted-foreground">
                            Showing{" "}
                            <span className="font-medium">
                              {Math.min(logs.length, (currentPage - 1) * logsPerPage + 1)}
                            </span>{" "}
                            to <span className="font-medium">{Math.min(logs.length, currentPage * logsPerPage)}</span>{" "}
                            of <span className="font-medium">{logs.length}</span> logs
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(logs.length / logsPerPage)))
                              }
                              disabled={currentPage === Math.ceil(logs.length / logsPerPage)}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Errors */}
                {logStats.recent_errors && logStats.recent_errors.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Recent Errors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {logStats.recent_errors.map((error, index) => (
                          <div key={index} className="rounded-lg border p-3 bg-red-50 dark:bg-red-950/20">
                            <div className="flex justify-between">
                              <Badge variant="destructive">{error.status.toUpperCase()}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {error.timestamp ? format(new Date(error.timestamp), "yyyy-MM-dd HH:mm:ss") : "N/A"}
                              </span>
                            </div>
                            <p className="mt-2 text-sm">{error.message}</p>
                            {error.details && (
                              <p className="mt-1 text-xs text-muted-foreground">{JSON.stringify(error.details)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
