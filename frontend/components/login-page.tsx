"use client"

import { CardFooter } from "@/components/ui/card"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Fingerprint, Upload, ImageIcon, Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import ThemeToggle from "@/components/theme-toggle"
import LanguageToggle from "@/components/language-toggle"
import AnimatedAppName from "@/components/animated-app-name"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const { login, loginWithFingerprint, user, isLoading } = useAuth()
  const [loginMethod, setLoginMethod] = useState<"credentials" | "fingerprint">("credentials")
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fingerprintScanning, setFingerprintScanning] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Only render the component after it's mounted on the client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        router.push("/dashboard")
      } else {
        router.push("/client")
      }
    }
  }, [user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      })
      return
    }

    const success = await login(email, password)

    if (success) {
      toast({
        title: t("loginSuccess"),
        description: "Welcome back!",
      })
    } else {
      toast({
        title: t("loginFailed"),
        description: "Invalid email or password",
        variant: "destructive",
      })
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)

      // Process the file
      await handleFingerprintLogin("upload", file)

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleFingerprintLogin = async (method: "upload" | "scanner", file?: File) => {
    setFingerprintScanning(true)

    try {
      let fingerprintData = "mock-fingerprint-data"

      // If we have a file, read it as base64
      if (method === "upload" && file) {
        fingerprintData = await readFileAsBase64(file)
      }

      const success = await loginWithFingerprint(fingerprintData)

      if (success) {
        toast({
          title: t("loginSuccess"),
          description: "Fingerprint verified successfully",
        })
      } else {
        toast({
          title: t("loginFailed"),
          description: "Fingerprint verification failed",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t("loginFailed"),
        description: "Fingerprint verification failed",
        variant: "destructive",
      })
    } finally {
      setFingerprintScanning(false)
      setSelectedFile(null)
    }
  }

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result)
        } else {
          reject(new Error("Failed to read file as base64"))
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  // Don't render anything until mounted
  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-sm bg-gradient-to-br from-background/90 via-background/80 to-background/70 border border-primary/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(var(--primary-rgb),0.1)] transition-all duration-300 rounded-xl overflow-hidden animate-in fade-in-50 slide-in-from-bottom-5">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center flex justify-center">
              <AnimatedAppName />
            </CardTitle>
            <CardDescription className="text-center">{t("welcome")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="credentials" className="w-full" onValueChange={(value) => setLoginMethod(value as any)}>
              <TabsList className="grid w-full grid-cols-2 mb-4 h-auto">
                <TabsTrigger value="credentials" className="whitespace-normal py-3 px-2 h-auto">
                  {t("login")}
                </TabsTrigger>
                <TabsTrigger value="fingerprint" className="whitespace-normal py-3 px-2 h-auto">
                  {t("loginWithFingerprint")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="credentials">
                <form onSubmit={handleLogin}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("email")}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">{t("password")}</Label>
                        <Button variant="link" size="sm" className="px-0 text-xs">
                          {t("forgotPassword")}
                        </Button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="********"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        >
                          <Fingerprint className="mr-2 h-4 w-4" />
                        </motion.div>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          {t("login")}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="fingerprint">
                <div className="space-y-4">
                  <p className="text-sm text-center text-muted-foreground">{t("loginWithFingerprint")}</p>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      className="flex flex-col items-center justify-center h-24 space-y-2 p-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={fingerprintScanning || isLoading}
                    >
                      {selectedFile ? <ImageIcon className="h-8 w-8" /> : <Upload className="h-8 w-8" />}
                      <span className="text-xs text-center whitespace-normal px-1">
                        {selectedFile ? selectedFile.name.substring(0, 15) + "..." : t("uploadFingerprint")}
                      </span>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={fingerprintScanning || isLoading}
                      />
                    </Button>
                  </div>
                  {(fingerprintScanning || isLoading) && (
                    <div className="flex justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                      >
                        <Fingerprint className="h-16 w-16 text-primary" />
                      </motion.div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            {/* Footer content can be added here if needed */}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
