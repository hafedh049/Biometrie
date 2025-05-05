"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import FingerprintScanner from "@/components/fingerprint-scanner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, Bell, Fingerprint, Lock, RefreshCw, Save, Shield, Smartphone } from "lucide-react"

export default function ClientSecurityPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    fingerprintRequired: true,
    twoFactorAuth: false,
    loginAlerts: true,
    autoLogout: 30, // minutes
    encryptAllFiles: false,
    notifyOnFileAccess: true,
  })

  // Add useEffect to load security settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("security-settings")
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setSecuritySettings(parsedSettings)
      } catch (error) {
        console.error("Failed to parse security settings from localStorage:", error)
      }
    }
  }, [])

  const handleToggleSetting = (setting: string, value: boolean) => {
    setSecuritySettings((prev) => ({
      ...prev,
      [setting]: value,
    }))
  }

  // Update the handleSaveSettings function to save security settings to localStorage
  const handleSaveSettings = () => {
    setIsLoading(true)

    // Save security settings to localStorage
    localStorage.setItem("security-settings", JSON.stringify(securitySettings))

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Settings Saved",
        description: "Your security settings have been updated successfully.",
      })
    }, 1000)
  }

  const handleFingerprintCapture = (fingerprintData: string) => {
    setScannerOpen(false)

    // Simulate processing
    toast({
      title: "Processing",
      description: "Updating your fingerprint...",
    })

    setTimeout(() => {
      toast({
        title: "Success",
        description: "Your fingerprint has been updated successfully.",
      })
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Fingerprint Security</h1>
        <Button onClick={handleSaveSettings} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="fingerprint" className="space-y-6">
        <TabsList>
          <TabsTrigger value="fingerprint">Fingerprint</TabsTrigger>
          <TabsTrigger value="encryption">Encryption</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="fingerprint" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fingerprint Authentication</CardTitle>
              <CardDescription>Manage your fingerprint security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="fingerprintRequired">Require Fingerprint for Login</Label>
                  <p className="text-sm text-muted-foreground">
                    Always require fingerprint authentication when logging in
                  </p>
                </div>
                <Switch
                  id="fingerprintRequired"
                  checked={securitySettings.fingerprintRequired}
                  onCheckedChange={(checked) => handleToggleSetting("fingerprintRequired", checked)}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Current Fingerprint</Label>
                    <p className="text-sm text-muted-foreground">Update or manage your registered fingerprint</p>
                  </div>
                  <Button onClick={() => setScannerOpen(true)}>
                    <Fingerprint className="mr-2 h-4 w-4" />
                    Update Fingerprint
                  </Button>
                </div>

                <div className="rounded-md border p-4">
                  <div className="flex items-center gap-3">
                    <Fingerprint className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">Fingerprint Status</p>
                      <p className="text-sm text-muted-foreground">
                        {user?.hasFingerprint ? "Registered on April 14, 2023" : "Not registered"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security with two-factor authentication
                  </p>
                </div>
                <Switch
                  id="twoFactorAuth"
                  checked={securitySettings.twoFactorAuth}
                  onCheckedChange={(checked) => handleToggleSetting("twoFactorAuth", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encryption" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>File Encryption</CardTitle>
              <CardDescription>Manage how your files are encrypted</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="encryptAllFiles">Encrypt All Files by Default</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically encrypt all files you upload with your fingerprint
                  </p>
                </div>
                <Switch
                  id="encryptAllFiles"
                  checked={securitySettings.encryptAllFiles}
                  onCheckedChange={(checked) => handleToggleSetting("encryptAllFiles", checked)}
                />
              </div>

              <Separator />

              <div className="rounded-md border p-4 bg-amber-50 dark:bg-amber-950/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-500">Important Security Information</p>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                      Files encrypted with your fingerprint can only be decrypted by you. If you lose access to your
                      fingerprint, you will not be able to recover your encrypted files.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium">Encryption Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-md border p-3">
                    <div className="flex flex-col items-center gap-1">
                      <Shield className="h-8 w-8 text-primary" />
                      <p className="text-xl font-bold">8</p>
                      <p className="text-xs text-muted-foreground">Encrypted Files</p>
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="flex flex-col items-center gap-1">
                      <Lock className="h-8 w-8 text-amber-500" />
                      <p className="text-xl font-bold">4</p>
                      <p className="text-xs text-muted-foreground">Unencrypted Files</p>
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="flex flex-col items-center gap-1">
                      <Fingerprint className="h-8 w-8 text-green-500" />
                      <p className="text-xl font-bold">12</p>
                      <p className="text-xs text-muted-foreground">Total Files</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>Manage how you access your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoLogout">Auto Logout</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically log out after {securitySettings.autoLogout} minutes of inactivity
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (securitySettings.autoLogout > 5) {
                        setSecuritySettings((prev) => ({
                          ...prev,
                          autoLogout: prev.autoLogout - 5,
                        }))
                      }
                    }}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center">{securitySettings.autoLogout}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSecuritySettings((prev) => ({
                        ...prev,
                        autoLogout: prev.autoLogout + 5,
                      }))
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-lg font-medium">Trusted Devices</h3>
                <div className="space-y-2">
                  <div className="rounded-md border p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Current Device</p>
                        <p className="text-xs text-muted-foreground">Last used: Today</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Remove
                    </Button>
                  </div>
                  <div className="rounded-md border p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">iPhone 13</p>
                        <p className="text-xs text-muted-foreground">Last used: 3 days ago</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Notifications</CardTitle>
              <CardDescription>Manage your security notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="loginAlerts">Login Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications when someone logs into your account
                  </p>
                </div>
                <Switch
                  id="loginAlerts"
                  checked={securitySettings.loginAlerts}
                  onCheckedChange={(checked) => handleToggleSetting("loginAlerts", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifyOnFileAccess">File Access Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications when your encrypted files are accessed
                  </p>
                </div>
                <Switch
                  id="notifyOnFileAccess"
                  checked={securitySettings.notifyOnFileAccess}
                  onCheckedChange={(checked) => handleToggleSetting("notifyOnFileAccess", checked)}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-lg font-medium">Recent Security Alerts</h3>
                <div className="space-y-2">
                  <div className="rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">New login from Chrome on Windows</p>
                        <p className="text-xs text-muted-foreground">Today, 10:30 AM</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Encrypted file accessed: Personal Report 2023.pdf</p>
                        <p className="text-xs text-muted-foreground">Yesterday, 3:45 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fingerprint Scanner Dialog */}
      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Fingerprint</DialogTitle>
            <DialogDescription>Scan your fingerprint to update your biometric authentication.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <FingerprintScanner onCapture={handleFingerprintCapture} mode="scanner" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScannerOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
