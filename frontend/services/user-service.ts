import api from "./api"

// Default timeout for API requests (5 seconds)
const API_TIMEOUT = 5000

export interface UserData {
  username?: string
  email?: string
  password?: string
  phone_number?: string
  account_status?: "active" | "inactive"
  role?: "admin" | "client"
}

const UserService = {
  getUsers: async (page = 1, per_page = 10, status?: string) => {
    const params = { page, per_page, status }
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

      const response = await api.get("/api/users", {
        params,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response.data
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout: The server took too long to respond")
      }
      console.error("Error fetching users:", error)
      return { users: [], error: error instanceof Error ? error.message : "Unknown error" }
    }
  },

  getUser: async (userId: string) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

      const response = await api.get(`/api/users/${userId}`, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response.data
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout: The server took too long to respond")
      }
      console.error("Error fetching user:", error)
      throw error
    }
  },

  createUser: async (userData: UserData) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

      const response = await api.post("/api/users", userData, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response.data
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout: The server took too long to respond")
      }
      console.error("Error creating user:", error)
      throw error
    }
  },

  updateUser: async (userId: string, userData: UserData) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

      const response = await api.put(`/api/users/${userId}`, userData, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response.data
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout: The server took too long to respond")
      }
      console.error("Error updating user:", error)
      throw error
    }
  },

  deleteUser: async (userId: string) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

      const response = await api.delete(`/api/users/${userId}`, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response.data
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout: The server took too long to respond")
      }
      console.error("Error deleting user:", error)
      throw error
    }
  },

  getDashboardStats: async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

      const response = await api.get("/api/users/dashboard/stats", {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response.data
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout: The server took too long to respond")
      }
      console.error("Error fetching dashboard stats:", error)
      throw error
    }
  },
}

export default UserService
