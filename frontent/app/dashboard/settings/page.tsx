"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
// Update the imports to include the necessary components
import { Save, SettingsIcon, User, RefreshCw, Circle, Upload } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

// Helper function to convert hex to HSL
const hexToHSL = (hex: string): { h: number; s: number; l: number } => {
  // Remove the # if present
  hex = hex.replace(/^#/, "")

  // Parse the hex values
  const r = Number.parseInt(hex.substring(0, 2), 16) / 255
  const g = Number.parseInt(hex.substring(2, 4), 16) / 255
  const b = Number.parseInt(hex.substring(4, 6), 16) / 255

  // Find the min and max values to compute the lightness
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  let l = (max + min) / 2

  // Only calculate hue and saturation if the color isn't grayscale
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }

    h = Math.round(h * 60)
  }

  // Convert saturation and lightness to percentages
  s = Math.round(s * 100)
  l = Math.round(l * 100)

  return { h, s, l }
}

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage()
  const { resolvedTheme, setTheme } = useTheme()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isProfileUpdateLoading, setIsProfileUpdateLoading] = useState(false)
  const [profile, setProfile] = useState({
    name: "Admin User",
    email: "admin@example.com",
    avatar: "/mystical-forest-spirit.png",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [debugLog, setDebugLog] = useState<string[]>([])
  // Simplified state for fingerprint management
  const [isFingerprintUpdateLoading, setIsFingerprintUpdateLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock settings data
  const [settings, setSettings] = useState({
    // General
    language: language,
    theme: "light",
    autoLogout: 30,
    accentColor: "#0ea5e9", // Default accent color - sky blue

    // Security
    twoFactorAuth: true,
    fingerprintRequired: true,
    passwordExpiry: 90,
    loginAttempts: 5,

    // Storage
    autoBackup: true,
    backupFrequency: "daily",
    compressionLevel: 7,
    encryptBackups: true,

    // Notifications
    emailNotifications: true,
    loginAlerts: true,
    storageAlerts: true,
    updateAlerts: true,

    // System
    autoUpdate: true,
    telemetry: false,
    debugMode: false,
    logLevel: "error",
  })

  // Update the handleSaveSettings function to save settings to localStorage
  const handleSaveSettings = () => {
    setIsLoading(true)

    // Save settings to localStorage
    localStorage.setItem("admin-settings", JSON.stringify(settings))

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: t("operationSuccess"),
        description: "Settings have been saved successfully.",
      })
    }, 1000)
  }

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const saveAccentColor = (color: string) => {
    // Update the state
    updateSetting("general", "accentColor", color)

    // Save to localStorage immediately
    try {
      localStorage.setItem("accent-color", color)
      console.log(`Accent color saved to localStorage: ${color}`)

      // Dispatch custom event to update particles immediately
      const event = new CustomEvent("accent-color-change", {
        detail: { color },
      })
      window.dispatchEvent(event)
    } catch (error) {
      console.error("Failed to save accent color to localStorage:", error)
    }
  }

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

  // Update the useEffect to load settings from localStorage on component mount
  useEffect(() => {
    // Set theme to light on component mount
    setTheme("light")

    // Load settings from localStorage
    const savedSettings = localStorage.getItem("admin-settings")
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings(parsedSettings)

        // Apply language setting if it exists
        if (parsedSettings.language) {
          setLanguage(parsedSettings.language as "en" | "fr")
        }
      } catch (error) {
        console.error("Failed to parse settings from localStorage:", error)
      }
    }

    // Load user profile if available
    if (user) {
      setProfile({
        name: user.username || "Admin User",
        email: user.email || "admin@example.com",
        avatar: "/mystical-forest-spirit.png",
      })
    }
  }, [setTheme, setLanguage, user])

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsProfileUpdateLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const name = formData.get("name") as string
      const email = formData.get("email") as string

      if (!user || !user.user_id) {
        throw new Error("User data or user ID is missing. Please log in again.")
      }

      // Get the API URL using the user_id from the auth context
      const apiUrl = `http://127.0.0.1:5000/api/users/${user.user_id}`

      // Get access_token from localStorage
      const accessToken = localStorage.getItem("access_token")

      // Use fetch API for simplicity
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          username: name,
          email: email,
        }),
      })

      if (response.ok) {
        // Only update profile in state if API call is successful
        setProfile({
          name,
          email,
          avatar: profile.avatar,
        })

        toast({
          title: t("operationSuccess"),
          description: "Profile has been updated successfully on the server.",
        })
        // Close the dialog
        setIsDialogOpen(false)
      } else {
        const errorText = await response.text()
        throw new Error(`Server error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error("Error in profile update:", error)
      toast({
        title: "Error",
        description: `Error: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setIsProfileUpdateLoading(false)
    }
  }

  // Handle image selection and fingerprint update in one function
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsFingerprintUpdateLoading(true)

    try {
      // Read the file as data URL
      const reader = new FileReader()

      reader.onload = async (event) => {
        const imageData = event.target?.result as string

        // Get access_token from localStorage
        const accessToken = localStorage.getItem("access_token")

        // API URL for updating fingerprint
        const apiUrl = `http://127.0.0.1:5000/api/auth/update-fingerprint`

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            fingerprint: imageData,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          toast({
            title: t("operationSuccess"),
            description: data.message || "Fingerprint has been updated successfully.",
          })
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || `Server error: ${response.status}`)
        }

        setIsFingerprintUpdateLoading(false)
      }

      reader.onerror = () => {
        throw new Error("Failed to read the image file")
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error updating fingerprint:", error)
      toast({
        title: "Error",
        description: `Error: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
      setIsFingerprintUpdateLoading(false)
    }
  }

  // Apply accent color when it changes and store in localStorage
  useEffect(() => {
    if (settings.accentColor) {
      // Convert hex to HSL for CSS variables
      const hsl = hexToHSL(settings.accentColor)

      // Apply to CSS variables for the entire website
      const root = document.documentElement

      // Set primary color variables
      root.style.setProperty("--primary", `${hsl.h} ${hsl.s}% ${hsl.l}%`)
      root.style.setProperty("--primary-foreground", resolvedTheme === "dark" ? "0 0% 100%" : "0 0% 100%")

      // Set ring color
      root.style.setProperty("--ring", `${hsl.h} ${hsl.s}% ${hsl.l}%`)

      // Adjust accent color based on primary and theme
      if (resolvedTheme === "dark") {
        root.style.setProperty("--accent", `${hsl.h} ${Math.max(10, hsl.s - 20)}% ${Math.min(90, hsl.l + 15)}%`)
        root.style.setProperty("--accent-foreground", `${hsl.h} ${hsl.s}% ${Math.max(20, hsl.l - 20)}%`)
      } else {
        root.style.setProperty("--accent", `${hsl.h} ${Math.max(10, hsl.s - 30)}% ${Math.min(95, hsl.l + 25)}%`)
        root.style.setProperty("--accent-foreground", `${hsl.h} ${hsl.s}% ${Math.max(10, hsl.l - 30)}%`)
      }

      // Store the accent color in localStorage immediately
      localStorage.setItem("accent-color", settings.accentColor)
    }
  }, [settings.accentColor, resolvedTheme])

  // Load accent color from localStorage on initial load
  useEffect(() => {
    try {
      const savedAccentColor = localStorage.getItem("accent-color")
      if (savedAccentColor) {
        console.log(`Loaded accent color from localStorage: ${savedAccentColor}`)
        updateSetting("general", "accentColor", savedAccentColor)
      } else {
        console.log("No saved accent color found in localStorage, using default")
      }
    } catch (error) {
      console.error("Error loading accent color from localStorage:", error)
    }
  }, [])

  // Add router for navigation
  const router = useRouter()

  // Implement auto logout functionality
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout | null = null

    // Function to reset the timer
    const resetTimer = () => {
      // Clear existing timer
      if (inactivityTimer) {
        clearTimeout(inactivityTimer)
      }

      // Only set timer if auto logout is enabled and user is logged in
      if (settings.autoLogout > 0 && user) {
        // Convert minutes to milliseconds
        const timeoutInMs = settings.autoLogout * 60 * 1000

        inactivityTimer = setTimeout(() => {
          // Log the user out
          if (settings.debugMode) {
            setDebugLog((prev) => [...prev, `Auto logout triggered after ${settings.autoLogout} minutes of inactivity`])
          }

          // Clear localStorage
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")

          // Show toast notification
          toast({
            title: "Auto Logout",
            description: "You have been logged out due to inactivity",
          })

          // Redirect to login page
          router.push("/")
        }, timeoutInMs)
      }
    }

    // Reset timer on initial load
    resetTimer()

    // Reset timer on user activity
    const handleUserActivity = () => {
      resetTimer()
    }

    // Add event listeners for user activity
    window.addEventListener("mousemove", handleUserActivity)
    window.addEventListener("mousedown", handleUserActivity)
    window.addEventListener("keypress", handleUserActivity)
    window.addEventListener("touchmove", handleUserActivity)
    window.addEventListener("scroll", handleUserActivity)

    // Clean up event listeners and timer on unmount
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer)
      }
      window.removeEventListener("mousemove", handleUserActivity)
      window.removeEventListener("mousedown", handleUserActivity)
      window.removeEventListener("keypress", handleUserActivity)
      window.removeEventListener("touchmove", handleUserActivity)
      window.removeEventListener("scroll", handleUserActivity)
    }
  }, [settings.autoLogout, settings.debugMode, user, router])

  // Update accent color when theme changes
  useEffect(() => {
    if (settings.accentColor) {
      // Find the current color in our color list
      const currentColor = [
        { name: "Sky", value: "#0ea5e9", darkValue: "#0284c7" },
        { name: "Blue", value: "#3b82f6", darkValue: "#2563eb" },
        { name: "Indigo", value: "#6366f1", darkValue: "#4f46e5" },
        { name: "Purple", value: "#8b5cf6", darkValue: "#7c3aed" },
        { name: "Pink", value: "#ec4899", darkValue: "#db2777" },
        { name: "Red", value: "#ef4444", darkValue: "#dc2626" },
        { name: "Orange", value: "#f97316", darkValue: "#ea580c" },
        { name: "Green", value: "#10b981", darkValue: "#059669" },
        { name: "Teal", value: "#14b8a6", darkValue: "#0d9488" },
        { name: "Amber", value: "#f59e0b", darkValue: "#d97706" },
      ].find((color) => color.value === settings.accentColor || color.darkValue === settings.accentColor)

      if (currentColor) {
        // Update the accent color based on the current theme
        updateSetting("general", "accentColor", resolvedTheme === "dark" ? currentColor.darkValue : currentColor.value)
      }
    }
  }, [resolvedTheme])

  // Add this useEffect after the existing auto logout useEffect
  useEffect(() => {
    // Save auto logout setting to localStorage whenever it changes
    if (settings.autoLogout) {
      try {
        // Get current settings from localStorage or use current state
        const savedSettings = localStorage.getItem("admin-settings")
        const currentSettings = savedSettings ? JSON.parse(savedSettings) : { ...settings }

        // Update auto logout value
        currentSettings.autoLogout = settings.autoLogout

        // Save back to localStorage
        localStorage.setItem("admin-settings", JSON.stringify(currentSettings))
      } catch (error) {
        console.error("Failed to save auto logout setting to localStorage:", error)
      }
    }
  }, [settings, settings.autoLogout])

  // Define the color palette
  const colorPalette = [
    { name: "Sky", value: "#0ea5e9", darkValue: "#0284c7" },
    { name: "Blue", value: "#3b82f6", darkValue: "#2563eb" },
    { name: "Indigo", value: "#6366f1", darkValue: "#4f46e5" },
    { name: "Purple", value: "#8b5cf6", darkValue: "#7c3aed" },
    { name: "Pink", value: "#ec4899", darkValue: "#db2777" },
    { name: "Red", value: "#ef4444", darkValue: "#dc2626" },
    { name: "Orange", value: "#f97316", darkValue: "#ea580c" },
    { name: "Green", value: "#10b981", darkValue: "#059669" },
    { name: "Teal", value: "#14b8a6", darkValue: "#0d9488" },
    { name: "Amber", value: "#f59e0b", darkValue: "#d97706" },
    { name: "Yellow", value: "#eab308", darkValue: "#ca8a04" },
    { name: "Lime", value: "#84cc16", darkValue: "#65a30d" },
    { name: "Emerald", value: "#34d399", darkValue: "#10b981" },
    { name: "Cyan", value: "#06b6d4", darkValue: "#0891b2" },
    { name: "Violet", value: "#8b5cf6", darkValue: "#7c3aed" },
    { name: "Fuchsia", value: "#d946ef", darkValue: "#c026d3" },
    { name: "Rose", value: "#f43f5e", darkValue: "#e11d48" },
    { name: "Slate", value: "#64748b", darkValue: "#475569" },
    { name: "Gray", value: "#6b7280", darkValue: "#4b5563" },
    { name: "Stone", value: "#78716c", darkValue: "#57534e" },
    { name: "Zinc", value: "#71717a", darkValue: "#52525b" },
    { name: "Neutral", value: "#737373", darkValue: "#525252" },
    { name: "Turquoise", value: "#2dd4bf", darkValue: "#14b8a6" },
    { name: "Magenta", value: "#e879f9", darkValue: "#d946ef" },
    { name: "Crimson", value: "#dc2626", darkValue: "#b91c1c" },
    { name: "Gold", value: "#fbbf24", darkValue: "#d97706" },
    { name: "Bronze", value: "#b45309", darkValue: "#92400e" },
    { name: "Midnight", value: "#1e3a8a", darkValue: "#1e40af" },
    { name: "Forest", value: "#166534", darkValue: "#15803d" },
    { name: "Ocean", value: "#0c4a6e", darkValue: "#0369a1" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("settings")}</h1>
        <Button onClick={handleSaveSettings} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {t("saving")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t("save")}
            </>
          )}
        </Button>
      </div>

      {/* Debug Log Display */}
      {settings.debugMode && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Debug Log</CardTitle>
          </CardHeader>
          <CardContent className="max-h-40 overflow-auto">
            <pre className="text-xs">
              {debugLog.map((log, i) => (
                <div key={i} className="py-1 border-b border-gray-100">
                  {log}
                </div>
              ))}
            </pre>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" onClick={() => setDebugLog([])}>
              Clear Log
            </Button>
          </CardFooter>
        </Card>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-1 w-full">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{t("general")}</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle>{t("generalSettings")}</CardTitle>
                  <CardDescription>{t("generalSettingsDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Language Setting */}
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="language">{t("language")}</Label>
                        <p className="text-sm text-muted-foreground">{t("languageDescription")}</p>
                      </div>
                      <Select
                        value={settings.language}
                        onValueChange={(value) => {
                          updateSetting("general", "language", value)
                          setLanguage(value as "en" | "fr")
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder={t("selectLanguage")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* Auto Logout Setting */}
                  <div className="flex flex-col space-y-1.5">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoLogout">{t("autoLogout")}</Label>
                      <p className="text-sm text-muted-foreground">{t("autoLogoutDescription")}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Slider
                        id="autoLogout"
                        min={5}
                        max={60}
                        step={5}
                        value={[settings.autoLogout]}
                        onValueChange={(value) => {
                          // Update state
                          updateSetting("general", "autoLogout", value[0])

                          // Save to localStorage immediately
                          try {
                            // Get current settings from localStorage or use current state
                            const savedSettings = localStorage.getItem("admin-settings")
                            const currentSettings = savedSettings ? JSON.parse(savedSettings) : settings

                            // Update auto logout value
                            currentSettings.autoLogout = value[0]

                            // Save back to localStorage
                            localStorage.setItem("admin-settings", JSON.stringify(currentSettings))

                            if (settings.debugMode) {
                              setDebugLog((prev) => [
                                ...prev,
                                `Auto logout timer updated to ${value[0]} minutes and saved to localStorage`,
                              ])
                            }
                          } catch (error) {
                            console.error("Failed to save auto logout setting to localStorage:", error)
                          }
                        }}
                        className="flex-1"
                      />
                      <span className="w-12 text-sm">{settings.autoLogout} min</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Accent Color Setting */}
                  <div className="flex flex-col space-y-1.5">
                    <div className="space-y-0.5">
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <p className="text-sm text-muted-foreground">
                        Choose your preferred accent color for the application.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {colorPalette.map((color) => (
                        <Button
                          key={color.name}
                          type="button"
                          variant="outline"
                          className={`w-8 h-8 rounded-full p-0 flex items-center justify-center ${
                            settings.accentColor === (resolvedTheme === "dark" ? color.darkValue : color.value)
                              ? "ring-2 ring-offset-2"
                              : ""
                          }`}
                          style={{ backgroundColor: resolvedTheme === "dark" ? color.darkValue : color.value }}
                          onClick={() => saveAccentColor(resolvedTheme === "dark" ? color.darkValue : color.value)}
                          title={color.name}
                        >
                          {settings.accentColor === (resolvedTheme === "dark" ? color.darkValue : color.value) && (
                            <Circle className="h-3 w-3 text-white fill-current" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle>{t("userPreferences")}</CardTitle>
                  <CardDescription>{t("userPreferencesDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* User Profile Settings would go here */}
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t("editProfile")}</Label>
                        <p className="text-sm text-muted-foreground">{t("editProfileDescription")}</p>
                      </div>
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <User className="mr-2 h-4 w-4" />
                            {t("editProfile")}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <form onSubmit={handleProfileUpdate}>
                            <DialogHeader>
                              <DialogTitle>{t("editProfile")}</DialogTitle>
                              <DialogDescription>{t("editProfileDescription")}</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="flex flex-col items-center gap-4 mb-4">
                                <Avatar className="h-20 w-20">
                                  <AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                  {t("username")}
                                </Label>
                                <Input id="name" name="name" defaultValue={profile.name} className="col-span-3" />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">
                                  {t("email")}
                                </Label>
                                <Input
                                  id="email"
                                  name="email"
                                  type="email"
                                  defaultValue={profile.email}
                                  className="col-span-3"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="submit" disabled={isProfileUpdateLoading}>
                                {isProfileUpdateLoading ? (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    {t("saving")}
                                  </>
                                ) : (
                                  t("save")
                                )}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Fingerprint Update Section - Simplified */}
                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="space-y-0.5">
                        <Label>Update Fingerprint</Label>
                        <p className="text-sm text-muted-foreground">
                          Update your biometric authentication fingerprint
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isFingerprintUpdateLoading}
                      >
                        {isFingerprintUpdateLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Image
                          </>
                        )}
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageSelect}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
