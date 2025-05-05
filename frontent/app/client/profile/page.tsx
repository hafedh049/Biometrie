"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/auth-context"
import { Avatar } from "@/components/ui/Avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { User, Mail, Phone, Shield, Calendar, Clock, Edit2, Save, X, CheckCircle2 } from "lucide-react"

// Animation variants
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

export default function ProfilePage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    phone: "+1 (555) 123-4567", // Placeholder
    role: user?.role || "client",
    accountStatus: user?.account_status || "active",
    createdAt: "January 15, 2023", // Placeholder
    lastLogin: "Today at 9:45 AM", // Placeholder
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Success toast
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
        variant: "default",
      })

      setIsEditing(false)
    } catch (error) {
      // Error toast
      toast({
        title: "Update failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      username: user?.username || "",
      email: user?.email || "",
      phone: "+1 (555) 123-4567", // Placeholder
      role: user?.role || "client",
      accountStatus: user?.account_status || "active",
      createdAt: "January 15, 2023", // Placeholder
      lastLogin: "Today at 9:45 AM", // Placeholder
    })
    setIsEditing(false)
  }

  // Get first letter of username for avatar
  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "text-green-500"
      case "inactive":
        return "text-yellow-500"
      case "suspended":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold mb-6">{t("profile")}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Summary Card */}
          <motion.div variants={item} className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <CardTitle>{t("profileSummary")}</CardTitle>
                <CardDescription>{t("yourPersonalInformation")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center">
                <div className="mb-4">
                  <Avatar className="h-24 w-24 text-2xl">{getInitial(formData.username)}</Avatar>
                </div>
                <h3 className="text-xl font-semibold mb-1">{formData.username}</h3>
                <p className="text-muted-foreground mb-2">{formData.email}</p>
                <div className="flex items-center gap-1 mb-4">
                  <Shield className="h-4 w-4" />
                  <span className="capitalize">{formData.role}</span>
                  <span className="mx-2">•</span>
                  <span className={getStatusColor(formData.accountStatus)}>
                    <CheckCircle2 className="h-4 w-4 inline mr-1" />
                    <span className="capitalize">{formData.accountStatus}</span>
                  </span>
                </div>

                <Separator className="my-4" />

                <div className="w-full text-left space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Member since:</span>
                    <span className="text-sm ml-auto">{formData.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Last login:</span>
                    <span className="text-sm ml-auto">{formData.lastLogin}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Profile Details */}
          <motion.div variants={item} className="lg:col-span-2">
            <Tabs defaultValue="account" className="h-full">
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="account" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{t("userDetails")}</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>{t("security")}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="account" className="h-full">
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle>{t("userDetails")}</CardTitle>
                      <CardDescription>{t("editProfileDescription")}</CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1"
                      >
                        <Edit2 className="h-4 w-4" />
                        {t("editUser")}
                      </Button>
                    ) : null}
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">
                          <User className="h-4 w-4 inline mr-2" />
                          {t("username")}
                        </Label>
                        <Input
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          disabled={!isEditing || isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">
                          <Mail className="h-4 w-4 inline mr-2" />
                          {t("email")}
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing || isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          <Phone className="h-4 w-4 inline mr-2" />
                          {t("phoneNumber")}
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing || isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">
                          <Shield className="h-4 w-4 inline mr-2" />
                          {t("role")}
                        </Label>
                        <Input id="role" value={formData.role} disabled={true} className="capitalize" />
                      </div>
                    </div>
                  </CardContent>
                  {isEditing && (
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                        <X className="h-4 w-4 mr-2" />
                        {t("cancel")}
                      </Button>
                      <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            {t("saving")}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {t("save")}
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="security" className="h-full">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>{t("securitySettings")}</CardTitle>
                    <CardDescription>{t("securitySettingsDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Password Change Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium">{t("changePassword")}</h3>
                            <p className="text-sm text-muted-foreground">{t("changePasswordDescription")}</p>
                          </div>
                          <Button variant="outline">{t("changePassword")}</Button>
                        </div>
                      </div>

                      <Separator />

                      {/* Two-Factor Authentication */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium">{t("twoFactorAuth")}</h3>
                            <p className="text-sm text-muted-foreground">{t("twoFactorAuthDescription")}</p>
                          </div>
                          <Button variant="outline">{t("enable", "Enable")}</Button>
                        </div>
                      </div>

                      <Separator />

                      {/* Active Sessions */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium">{t("lastLogin")}</h3>
                          <p className="text-sm text-muted-foreground">{t("loginAlertsDescription")}</p>
                        </div>

                        <Card className="bg-muted/50">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-2 rounded-full">
                                  <CheckCircle2 className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{t("currentSession", "Current Session")}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {t("lastActive", "Last active")}: {t("justNow", "Just now")}
                                  </p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" className="text-destructive">
                                {t("logout")}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
