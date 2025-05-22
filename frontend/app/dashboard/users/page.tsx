"use client"

import type React from "react"

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
import { Plus, Search, Edit, Trash2, Fingerprint, Loader2 } from "lucide-react"
import { TablePagination } from "@/components/table-pagination"
import { toast } from "@/hooks/use-toast"
import { useSearchParams, useRouter } from "next/navigation"
import axios from "axios"

// Add TypeScript declaration for window.searchTimeout
declare global {
  interface Window {
    searchTimeout: NodeJS.Timeout | null
  }
}

export default function UsersPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [addUserOpen, setAddUserOpen] = useState(searchParams.get("action") === "add")
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [deleteUserOpen, setDeleteUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const itemsPerPage = 10
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [fingerprintFilter, setFingerprintFilter] = useState<string>("all")
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  const [error, setError] = useState<string | null>(null)

  // Form state for adding/editing users
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone_number: "",
    account_status: "active",
    role: "client",
  })

  // Add these utility functions right after the component declaration
  function obscureEmail(email: string): string {
    if (!email) return ""
    const [username, domain] = email.split("@")
    if (!domain) return email

    const visibleChars = Math.min(2, username.length)
    const obscuredUsername =
      username.substring(0, visibleChars) + "*".repeat(Math.max(1, username.length - visibleChars))

    return `${obscuredUsername}@${domain}`
  }

  function obscurePhoneNumber(phone: string): string {
    if (!phone) return ""

    // Keep only the last 4 digits visible
    const digits = phone.replace(/\D/g, "")
    const nonDigits = [...phone].map((char) => (/\d/.test(char) ? null : char))

    let result = ""
    let digitIndex = 0

    for (let i = 0; i < phone.length; i++) {
      if (/\d/.test(phone[i])) {
        if (digitIndex < digits.length - 4) {
          result += "*"
        } else {
          result += phone[i]
        }
        digitIndex++
      } else {
        result += phone[i]
      }
    }

    return result
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, statusFilter, fingerprintFilter])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)

      // Build query parameters
      const params = new URLSearchParams()
      params.append("page", currentPage.toString())
      params.append("per_page", itemsPerPage.toString())

      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      // Get token from localStorage
      const token = localStorage.getItem("access_token")

      // Fetch users from API
      const response = await axios.get(`${apiUrl}/api/users/?${params.toString()}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      })

      let fetchedUsers = response.data.users || []

      // Filter by fingerprint if needed (since backend might not support this filter)
      if (fingerprintFilter !== "all") {
        const hasFingerprint = fingerprintFilter === "yes"
        fetchedUsers = fetchedUsers.filter((user: any) => user.fingerprint_hashes?.length > 0 === hasFingerprint)
      }

      setUsers(fetchedUsers)
      setFilteredUsers(fetchedUsers) // Initialize filtered users with all users
      setTotalUsers(response.data.total || fetchedUsers.length)
      setTotalPages(response.data.pages || Math.ceil(fetchedUsers.length / itemsPerPage))
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast({
        title: "Error",
        description: "Failed to load users. Please check your connection and try again.",
        variant: "destructive",
      })
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  const validatePassword = (password: string): boolean => {
    // Check if password is at least 8 characters and contains uppercase, lowercase, digit, and special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/
    return passwordRegex.test(password)
  }

  const handleEditUser = (user: any) => {
    // Prevent editing admin users
    if (user.role === "admin") {
      toast({
        title: "Action Restricted",
        description: "Admin users cannot be edited for security reasons.",
        variant: "destructive",
      })
      return
    }

    setSelectedUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      phone_number: user.phone_number || "",
      account_status: user.account_status || "active",
      role: user.role || "client",
    })
    setEditUserOpen(true)
  }

  const handleDeleteUser = (user: any) => {
    // Prevent deleting admin users
    if (user.role === "admin") {
      toast({
        title: "Action Restricted",
        description: "Admin users cannot be deleted for security reasons.",
        variant: "destructive",
      })
      return
    }

    setSelectedUser(user)
    setDeleteUserOpen(true)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleAddUser = async () => {
    try {
      // Validate password
      if (formData.password && !validatePassword(formData.password)) {
        toast({
          title: "Password Error",
          description:
            "Password must be at least 8 characters and contain uppercase, lowercase, digit, and special character.",
          variant: "destructive",
        })
        return
      }

      const token = localStorage.getItem("access_token")

      await axios.post(`${apiUrl}/api/users/`, formData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      })

      toast({
        title: "Success",
        description: "User created successfully",
      })
      setAddUserOpen(false)
      fetchUsers()
      // Reset form
      setFormData({
        username: "",
        email: "",
        password: "",
        phone_number: "",
        account_status: "active",
        role: "client",
      })
    } catch (error) {
      console.error("Failed to create user:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create user",
        variant: "destructive",
      })
    }
  }

  const handleUpdateUser = async () => {
    try {
      const updateData = { ...formData }
      // Don't send empty password
      if (!updateData.password) {
        delete updateData.password
      } else if (!validatePassword(updateData.password)) {
        // Validate password if it's being updated
        toast({
          title: "Password Error",
          description:
            "Password must be at least 8 characters and contain uppercase, lowercase, digit, and special character.",
          variant: "destructive",
        })
        return
      }

      const token = localStorage.getItem("access_token")

      await axios.put(`${apiUrl}/api/users/${selectedUser._id}`, updateData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      })

      toast({
        title: "Success",
        description: "User updated successfully",
      })
      setEditUserOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Failed to update user:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUserConfirm = async () => {
    try {
      const token = localStorage.getItem("access_token")

      await axios.delete(`${apiUrl}/api/users/${selectedUser._id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      })

      toast({
        title: "Success",
        description: "User deleted successfully",
      })
      setDeleteUserOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Failed to delete user:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)

    if (!query.trim()) {
      // If search is empty, show all users
      setFilteredUsers(users)
      return
    }

    // Filter users based on search query (case-insensitive)
    const lowercaseQuery = query.toLowerCase().trim()
    const filtered = users.filter(
      (user) =>
        user.username?.toLowerCase().includes(lowercaseQuery) ||
        user.email?.toLowerCase().includes(lowercaseQuery) ||
        user.phone_number?.toLowerCase().includes(lowercaseQuery),
    )

    setFilteredUsers(filtered)
  }

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("users")}</h1>
        <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("addUser")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("addUser")}</DialogTitle>
              <DialogDescription>{t("userDetails")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  {t("username")}
                </Label>
                <Input id="username" className="col-span-3" value={formData.username} onChange={handleInputChange} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  {t("email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="col-span-3"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  {t("password")}
                </Label>
                <Input
                  id="password"
                  type="password"
                  className="col-span-3"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone_number" className="text-right">
                  {t("phoneNumber")}
                </Label>
                <Input
                  id="phone_number"
                  className="col-span-3"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="account_status" className="text-right">
                  {t("accountStatus")}
                </Label>
                <Select
                  value={formData.account_status}
                  onValueChange={(value) => handleSelectChange("account_status", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select value={formData.role} onValueChange={(value) => handleSelectChange("role", value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddUser}>
                {t("save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("userList")}</CardTitle>
          <CardDescription>{t("userList")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => {
                handleSearch(e.target.value)
              }}
              className="max-w-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={fingerprintFilter}
              onValueChange={(value) => {
                setFingerprintFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by fingerprint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="yes">Has Fingerprint</SelectItem>
                <SelectItem value="no">No Fingerprint</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="uppercase">{t("username")}</TableHead>
                  <TableHead className="uppercase">{t("email")}</TableHead>
                  <TableHead className="uppercase">{t("phoneNumber")}</TableHead>
                  <TableHead className="uppercase">{t("accountStatus")}</TableHead>
                  <TableHead className="uppercase">{t("lastLogin")}</TableHead>
                  <TableHead className="uppercase">{t("fingerprint")}</TableHead>
                  <TableHead className="uppercase text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium uppercase">{user.username}</TableCell>
                    <TableCell title={user.email}>{obscureEmail(user.email)}</TableCell>
                    <TableCell title={user.phone_number}>{obscurePhoneNumber(user.phone_number)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${
                          user.account_status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {user.account_status}
                      </span>
                    </TableCell>
                    <TableCell>{user.last_login ? new Date(user.last_login).toLocaleString() : "Never"}</TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Fingerprint
                          className={`h-4 w-4 ${
                            user.fingerprint_hashes?.length > 0 ? "text-green-500" : "text-red-500"
                          }`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {user.role === "admin" ? (
                          <>
                            <Button variant="ghost" size="icon" disabled title="Admin users cannot be edited">
                              <Edit className="h-4 w-4 text-muted-foreground" />
                              <span className="sr-only">{t("editUser")}</span>
                            </Button>
                            <Button variant="ghost" size="icon" disabled title="Admin users cannot be deleted">
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                              <span className="sr-only">{t("deleteUser")}</span>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">{t("editUser")}</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">{t("deleteUser")}</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min(filteredUsers.length, 1)} to {Math.min(filteredUsers.length, totalUsers)} of{" "}
                {filteredUsers.length} users
              </div>
              <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("editUser")}</DialogTitle>
            <DialogDescription>{t("userDetails")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                {t("username")}
              </Label>
              <Input id="username" value={formData.username} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                {t("email")}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                {t("password")}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Leave blank to keep current password"
                value={formData.password}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone_number" className="text-right">
                {t("phoneNumber")}
              </Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="account_status" className="text-right">
                {t("accountStatus")}
              </Label>
              <Select
                value={formData.account_status}
                onValueChange={(value) => handleSelectChange("account_status", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select value={formData.role} onValueChange={(value) => handleSelectChange("role", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateUser}>
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteUserOpen} onOpenChange={setDeleteUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("deleteUser")}</DialogTitle>
            <DialogDescription>{t("confirmDelete")}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <p>
                Are you sure you want to delete user <strong>{selectedUser.username}</strong>?
              </p>
              <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteUserConfirm}>
              {t("deleteUser")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
