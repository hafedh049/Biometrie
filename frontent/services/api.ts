import axios from "axios"

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    // Only try to get the token if we're in a browser
    if (isBrowser) {
      const token = localStorage.getItem("access_token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add response interceptor to handle token refresh and network errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors gracefully
    if (!error.response) {
      return Promise.reject(new Error("Network error: Unable to connect to the server"))
    }

    const originalRequest = error.config

    // If error is 401 and not already retrying
    if (isBrowser && error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Import here to avoid circular dependency
        const AuthService = (await import("./auth-service")).default

        const newToken = await AuthService.refreshToken()
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        } else {
          // If refresh failed, redirect to login
          window.location.href = "/"
          return Promise.reject(error)
        }
      } catch (refreshError) {
        // Redirect to login page on refresh failure
        window.location.href = "/"
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)

export default api
