"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import AuthService from "@/services/auth-service"

// Define user types
export type UserRole = "admin" | "client"

export interface User {
  user_id: string
  username: string
  email: string
  role: UserRole
  account_status: string
  hasFingerprint?: boolean // Added for UI compatibility
}

// Auth context type
interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  loginWithFingerprint: (fingerprintData: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider props
interface AuthProviderProps {
  children: ReactNode
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.getCurrentUser()
        if (currentUser) {
          // Add hasFingerprint property for UI compatibility
          setUser({
            ...currentUser,
            hasFingerprint: true, // Assume user has fingerprint if logged in
          })
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      const result = await AuthService.login({ email, password })

      // Add hasFingerprint property for UI compatibility
      setUser({
        ...result.user,
        hasFingerprint: true, // Assume user has fingerprint if logged in
      })

      setIsLoading(false)
      return true
    } catch (error) {
      console.error("Login failed:", error)
      setIsLoading(false)
      return false
    }
  }

  // Login with fingerprint
  const loginWithFingerprint = async (fingerprintData: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      const result = await AuthService.loginWithFingerprint({ fingerprint: fingerprintData })

      // Add hasFingerprint property for UI compatibility
      setUser({
        ...result.user,
        hasFingerprint: true,
      })

      setIsLoading(false)
      return true
    } catch (error) {
      console.error("Fingerprint login failed:", error)
      setIsLoading(false)
      return false
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await AuthService.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      router.push("/")
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, loginWithFingerprint, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
