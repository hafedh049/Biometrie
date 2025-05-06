"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { RefreshCw, Save, SettingsIcon, User, Circle, Lock, Fingerprint, Upload, ImageIcon, X } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import UserService from "@/services/user-service"
import AuthService from "@/services/auth-service"

export default function ClientSettingsPage() {
  const { t, language, setLanguage } = useLanguage()
  const { resolvedTheme, setTheme } = useTheme()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false)
  const [isFingerprintUpdating, setIsFingerprintUpdating] = useState(false)
  const [fingerprintUpdateSuccess, setFingerprintUpdateSuccess] = useState(false)
  const [fingerprintImage, setFingerprintImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use real user data
  const [profileData, setProfileData] = useState({
    username: user?.username || "",
    email: user?.email || "",
  })

  // Mock settings data
  const [settings, setSettings] = useState({
    // General
    language: language,
    theme: "light",
    autoLogout: 30,
    accentColor: "#0ea5e9", // Default accent color - sky blue

    // Notifications
    emailNotifications: true,
    loginAlerts: true,
    fileAccessAlerts: true,
    updateAlerts: true,
  })

  // Function to refresh profile data from current user
  const refreshProfileData = () => {
    // Get the latest user data from auth service
    const currentUser = AuthService.getCurrentUser()

    if (currentUser) {
      setProfileData({
        username: currentUser.username || "",
        email: currentUser.email || "",
      })
    } else if (user) {
      // Fallback to context user if getCurrentUser fails
      setProfileData({
        username: user.username || "",
        email: user.email || "",
      })
    }
  }

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || "",
        email: user.email || "",
      })
    }
  }, [user])

  // Refresh profile data when sheet is opened
  useEffect(() => {
    if (isProfileSheetOpen) {
      refreshProfileData()
      // Reset fingerprint image when opening the sheet
      setFingerprintImage(null)
      setFingerprintUpdateSuccess(false)
    }
  }, [isProfileSheetOpen])

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

  const saveAccentColor = (color: string) => {
    // Update the state
    updateSetting("general", "accentColor", color)

    // Save to localStorage immediately
    try {
      localStorage.setItem("accent-color", color)
      console.log(`Accent color saved to localStorage: ${color}`)

      // Dispatch a custom event to notify other components
      const event = new CustomEvent("accent-color-change", { detail: { color } })
      window.dispatchEvent(event)
    } catch (error) {
      console.error("Failed to save accent color to localStorage:", error)
    }
  }

  // Update the handleSaveSettings function to save settings to localStorage
  const handleSaveSettings = () => {
    setIsLoading(true)

    // Save settings to localStorage
    localStorage.setItem("client-settings", JSON.stringify(settings))

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: t("operationSuccess"),
        description: "Settings have been saved successfully.",
      })
    }, 1000)
  }

  // Handle profile save
  const handleSaveProfile = async () => {
    setIsLoading(true)

    try {
      if (!user?.user_id) {
        throw new Error("User ID not found")
      }

      // Prepare the user data to update
      const userData = {
        username: profileData.username,
      }

      // Call the API to update the user profile
      await UserService.updateUser(user.user_id, userData)

      // If there's a fingerprint image, update it too
      if (fingerprintImage) {
        await handleFingerprintUpdate(fingerprintImage)
      }

      // Close the sheet
      setIsProfileSheetOpen(false)

      toast({
        title: t("operationSuccess"),
        description: "Profile updated successfully.",
      })

      // Force a page refresh to update the user data throughout the app
      window.location.reload()
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update the useEffect to load settings from localStorage on component mount
  useEffect(() => {
    // Set theme to light on component mount
    setTheme("light")

    // Load settings from localStorage
    const savedSettings = localStorage.getItem("client-settings")
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
  }, [setTheme, setLanguage])

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

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }))
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

  // Handle fingerprint update
  const handleFingerprintUpdate = async (fingerprintData: string) => {
    setIsFingerprintUpdating(true)
    setFingerprintUpdateSuccess(false)

    try {
      if (!user?.user_id) {
        throw new Error("User ID not found")
      }

      // Make sure the fingerprint data is in the correct format
      // The backend expects a base64 string, possibly with a data URL prefix
      // We'll send it as is since the backend handles data URLs

      // Call the API to update the user's fingerprint
      const response = await AuthService.updateFingerprint({
        fingerprint: fingerprintData,
      })

      console.log("Fingerprint update response:", response)
      setFingerprintUpdateSuccess(true)

      toast({
        title: t("operationSuccess"),
        description: "Fingerprint updated successfully.",
      })

      // Update the user object in localStorage to reflect that they now have a fingerprint
      const currentUser = AuthService.getCurrentUser()
      if (currentUser) {
        currentUser.hasFingerprint = true
        localStorage.setItem("user", JSON.stringify(currentUser))
      }

      return response
    } catch (error) {
      console.error("Error updating fingerprint:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update fingerprint",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsFingerprintUpdating(false)
    }
  }

  // Handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      })
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setFingerprintImage(result)
    }
    reader.readAsDataURL(file)
  }

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Clear selected image
  const clearSelectedImage = () => {
    setFingerprintImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

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

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-1 w-full">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span className="sm:inline">{t("general")}</span>
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
                    {" "}
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
                        onValueChange={(value) => updateSetting("general", "autoLogout", value[0])}
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
                      {[
                        // Blues
                        { name: "Sky", value: "#0ea5e9", darkValue: "#0284c7" },
                        { name: "Blue", value: "#3b82f6", darkValue: "#2563eb" },
                        { name: "Light Blue", value: "#38bdf8", darkValue: "#0369a1" },
                        { name: "Azure", value: "#2dd4bf", darkValue: "#0d9488" },
                        { name: "Cobalt", value: "#2563eb", darkValue: "#1d4ed8" },
                        { name: "Navy", value: "#1e40af", darkValue: "#1e3a8a" },
                        { name: "Indigo", value: "#6366f1", darkValue: "#4f46e5" },

                        // Purples
                        { name: "Purple", value: "#8b5cf6", darkValue: "#7c3aed" },
                        { name: "Violet", value: "#7c3aed", darkValue: "#6d28d9" },
                        { name: "Lavender", value: "#a78bfa", darkValue: "#8b5cf6" },
                        { name: "Orchid", value: "#c084fc", darkValue: "#a855f7" },
                        { name: "Magenta", value: "#e879f9", darkValue: "#d946ef" },
                        { name: "Fuchsia", value: "#d946ef", darkValue: "#c026d3" },
                        { name: "Plum", value: "#9333ea", darkValue: "#7e22ce" },

                        // Pinks & Reds
                        { name: "Pink", value: "#ec4899", darkValue: "#db2777" },
                        { name: "Hot Pink", value: "#f472b6", darkValue: "#db2777" },
                        { name: "Rose", value: "#f43f5e", darkValue: "#e11d48" },
                        { name: "Crimson", value: "#dc2626", darkValue: "#b91c1c" },
                        { name: "Red", value: "#ef4444", darkValue: "#dc2626" },
                        { name: "Ruby", value: "#be123c", darkValue: "#9f1239" },
                        { name: "Scarlet", value: "#f87171", darkValue: "#ef4444" },

                        // Oranges & Yellows
                        { name: "Orange", value: "#f97316", darkValue: "#ea580c" },
                        { name: "Tangerine", value: "#fb923c", darkValue: "#f97316" },
                        { name: "Amber", value: "#f59e0b", darkValue: "#d97706" },
                        { name: "Gold", value: "#eab308", darkValue: "#ca8a04" },
                        { name: "Yellow", value: "#facc15", darkValue: "#eab308" },
                        { name: "Lemon", value: "#fde047", darkValue: "#facc15" },
                        { name: "Mustard", value: "#ca8a04", darkValue: "#a16207" },

                        // Greens
                        { name: "Lime", value: "#84cc16", darkValue: "#65a30d" },
                        { name: "Green", value: "#10b981", darkValue: "#059669" },
                        { name: "Emerald", value: "#059669", darkValue: "#047857" },
                        { name: "Teal", value: "#14b8a6", darkValue: "#0d9488" },
                        { name: "Mint", value: "#4ade80", darkValue: "#22c55e" },
                        { name: "Jade", value: "#34d399", darkValue: "#10b981" },
                        { name: "Forest", value: "#16a34a", darkValue: "#15803d" },
                        { name: "Olive", value: "#65a30d", darkValue: "#4d7c0f" },

                        // Cyans & Teals
                        { name: "Cyan", value: "#06b6d4", darkValue: "#0891b2" },
                        { name: "Aqua", value: "#22d3ee", darkValue: "#06b6d4" },
                        { name: "Turquoise", value: "#2dd4bf", darkValue: "#14b8a6" },
                        { name: "Aquamarine", value: "#5eead4", darkValue: "#2dd4bf" },

                        // Neutrals
                        { name: "Slate", value: "#64748b", darkValue: "#475569" },
                        { name: "Gray", value: "#6b7280", darkValue: "#4b5563" },
                        { name: "Stone", value: "#78716c", darkValue: "#57534e" },
                        { name: "Zinc", value: "#71717a", darkValue: "#52525b" },
                        { name: "Neutral", value: "#737373", darkValue: "#525252" },
                        { name: "Charcoal", value: "#404040", darkValue: "#262626" },

                        // Browns & Earthy Tones
                        { name: "Brown", value: "#a16207", darkValue: "#854d0e" },
                        { name: "Chocolate", value: "#854d0e", darkValue: "#713f12" },
                        { name: "Copper", value: "#c2410c", darkValue: "#9a3412" },
                        { name: "Sienna", value: "#9a3412", darkValue: "#7c2d12" },
                        { name: "Umber", value: "#7c2d12", darkValue: "#601a1a" },
                        { name: "Mahogany", value: "#7f1d1d", darkValue: "#601a1a" },

                        // Specialty Colors
                        { name: "Peach", value: "#fb923c", darkValue: "#f97316" },
                        { name: "Salmon", value: "#f87171", darkValue: "#ef4444" },
                        { name: "Mauve", value: "#d8b4fe", darkValue: "#c084fc" },
                        { name: "Periwinkle", value: "#818cf8", darkValue: "#6366f1" },
                        { name: "Cerulean", value: "#0ea5e9", darkValue: "#0284c7" },
                        { name: "Sapphire", value: "#1d4ed8", darkValue: "#1e40af" },
                      ].map((color) => (
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
                  {/* User Profile Settings with Sheet */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t("editProfile")}</Label>
                      <p className="text-sm text-muted-foreground">{t("editProfileDescription")}</p>
                    </div>
                    <Sheet open={isProfileSheetOpen} onOpenChange={setIsProfileSheetOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline">
                          <User className="mr-2 h-4 w-4" />
                          {t("editProfile")}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="h-[85vh] sm:h-[65vh] flex flex-col p-0">
                        <SheetHeader className="px-6 pt-6 pb-2">
                          <SheetTitle>{t("editProfile")}</SheetTitle>
                          <SheetDescription>{t("editProfileDescription")}</SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto px-6 py-4">
                          <div className="grid gap-6">
                            <div className="grid gap-2">
                              <Label htmlFor="username">{t("username")}</Label>
                              <Input
                                id="username"
                                value={profileData.username}
                                onChange={(e) => handleProfileChange("username", e.target.value)}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="email">{t("email")}</Label>
                              <div className="relative">
                                <Input id="email" value={profileData.email} readOnly className="pr-10 bg-muted" />
                                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              </div>
                              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                            </div>

                            <Separator />

                            <div className="grid gap-2">
                              <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                  <Fingerprint className="h-4 w-4" />
                                  Fingerprint Authentication
                                </Label>
                                {fingerprintUpdateSuccess && (
                                  <span className="text-sm text-green-600 flex items-center gap-1">
                                    <Circle className="h-2 w-2 fill-green-600" /> Updated
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {user?.hasFingerprint
                                  ? "Upload an image of your fingerprint to update your authentication credentials"
                                  : "Upload an image of your fingerprint to enable fingerprint authentication"}
                              </p>

                              {/* Hidden file input */}
                              <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                              />

                              {/* Image preview or upload button */}
                              {fingerprintImage ? (
                                <div className="relative max-w-xs mx-auto">
                                  <div className="relative border rounded-md overflow-hidden aspect-square">
                                    <img
                                      src={fingerprintImage || "/placeholder.svg"}
                                      alt="Fingerprint preview"
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={clearSelectedImage}
                                      className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70 transition-colors"
                                      aria-label="Remove image"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <p className="text-xs text-center mt-2 text-muted-foreground">
                                    Click the image to change it
                                  </p>
                                  <div className="absolute inset-0 cursor-pointer" onClick={triggerFileInput}></div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 max-w-xs mx-auto">
                                  <div className="mb-3 bg-primary-foreground bg-opacity-10 p-3 rounded-full">
                                    <ImageIcon className="h-6 w-6 text-primary" />
                                  </div>
                                  <p className="text-sm font-medium mb-1">Upload fingerprint image</p>
                                  <p className="text-xs text-muted-foreground text-center mb-3">
                                    JPG, PNG or GIF (max. 5MB)
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={triggerFileInput}
                                    className="flex items-center gap-2"
                                  >
                                    <Upload className="h-4 w-4" />
                                    Select Image
                                  </Button>
                                </div>
                              )}

                              {isFingerprintUpdating && (
                                <div className="text-center mt-2">
                                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                    <RefreshCw className="h-3 w-3 animate-spin" /> Processing...
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Add some padding at the bottom for better scrolling experience */}
                            <div className="h-6"></div>
                          </div>
                        </div>

                        <SheetFooter className="px-6 py-4 border-t">
                          <Button onClick={handleSaveProfile} disabled={isLoading || isFingerprintUpdating}>
                            {isLoading || isFingerprintUpdating ? (
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
                        </SheetFooter>
                      </SheetContent>
                    </Sheet>
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
