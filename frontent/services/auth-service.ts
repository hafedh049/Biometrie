import api from "./api"

export interface LoginCredentials {
  email: string
  password: string
}

export interface FingerprintLogin {
  fingerprint: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  phone_number: string
}

export interface ResetPasswordRequest {
  email: string
}

export interface ResetPassword {
  token: string
  new_password: string
}

export interface UpdateFingerprintData {
  fingerprint: string
  fingerprint_picture?: string
}

const AuthService = {
  register: async (data: RegisterData) => {
    const response = await api.post("/api/auth/register", data)
    return response.data
  },

  login: async (credentials: LoginCredentials) => {
    try {
      const response = await api.post("/api/auth/login", credentials)
      const { access_token, refresh_token, user } = response.data

      // Store tokens and user data
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", access_token)
        localStorage.setItem("refresh_token", refresh_token)
        localStorage.setItem("user", JSON.stringify(user))
      }

      return { user, access_token, refresh_token }
    } catch (error) {
      console.error("Login API error:", error)
      throw error
    }
  },

  loginWithFingerprint: async (data: FingerprintLogin) => {
    try {
      const response = await api.post("/api/auth/login", data)
      const { access_token, refresh_token, user } = response.data

      // Store tokens and user data
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", access_token)
        localStorage.setItem("refresh_token", refresh_token)
        localStorage.setItem("user", JSON.stringify(user))
      }

      return { user, access_token, refresh_token }
    } catch (error) {
      console.error("Fingerprint login API error:", error)
      throw error
    }
  },

  logout: async () => {
    try {
      await api.post("/api/auth/logout")
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("user")
    }
  },

  refreshToken: async () => {
    if (typeof window === "undefined") {
      return null // We're on the server, no localStorage
    }

    const refreshToken = localStorage.getItem("refresh_token")
    if (!refreshToken) {
      // Instead of throwing an error, return null or a specific value
      console.warn("No refresh token available")
      return null
    }

    try {
      const response = await api.post(
        "/api/auth/refresh",
        {},
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        },
      )

      const { access_token } = response.data
      localStorage.setItem("access_token", access_token)

      return access_token
    } catch (error) {
      console.error("Failed to refresh token:", error)
      // Clear tokens on refresh failure
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      return null
    }
  },

  resetPasswordRequest: async (data: ResetPasswordRequest) => {
    const response = await api.post("/api/auth/reset-password-request", data)
    return response.data
  },

  resetPassword: async (data: ResetPassword) => {
    const response = await api.post("/api/auth/reset-password", data)
    return response.data
  },

  updateFingerprint: async (data: UpdateFingerprintData) => {
    const response = await api.post("/api/auth/update-fingerprint", data)
    return response.data
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("user")
    if (!userStr) return null

    try {
      return JSON.parse(userStr)
    } catch (error) {
      return null
    }
  },
}

export default AuthService
