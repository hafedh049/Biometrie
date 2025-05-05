"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Fingerprint, Camera, Upload } from "lucide-react"
import { motion } from "framer-motion"
import { useLanguage } from "@/components/language-provider"

interface FingerprintScannerProps {
  onCapture: (fingerprintData: string) => void
  mode?: "camera" | "upload" | "scanner"
  showPreview?: boolean
}

export default function FingerprintScanner({
  onCapture,
  mode = "camera",
  showPreview = false,
}: FingerprintScannerProps) {
  const { t } = useLanguage()
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle camera scanning
  const startCameraScanning = async () => {
    if (mode !== "camera") return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setIsScanning(true)
      simulateScan()
    } catch (error) {
      console.error("Error accessing camera:", error)
    }
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        setIsScanning(true)
        simulateScan()
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Handle external scanner
  const startExternalScanning = () => {
    if (mode !== "scanner") return
    setIsScanning(true)
    simulateScan()
  }

  // Simulate fingerprint scanning process
  const simulateScan = () => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 5
        if (newProgress >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsScanning(false)
            // Use the canvas data as the fingerprint data
            const canvas = canvasRef.current
            let fingerprintData = ""
            if (canvas) {
              fingerprintData = canvas.toDataURL("image/png")
            }
            onCapture(fingerprintData)
          }, 500)
          return 100
        }
        return newProgress
      })
    }, 100)
  }

  // Trigger the appropriate scanning method based on mode
  const startScanning = () => {
    if (mode === "camera") {
      startCameraScanning()
    } else if (mode === "upload") {
      fileInputRef.current?.click()
    } else if (mode === "scanner") {
      startExternalScanning()
    }
  }

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-square bg-muted">
          {mode === "camera" && (
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${isScanning ? "opacity-100" : "opacity-0"}`}
              muted
              playsInline
            />
          )}

          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full ${mode === "upload" && isScanning ? "opacity-100" : "opacity-0"}`}
          />

          {!isScanning ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                {mode === "camera" && <Camera className="h-16 w-16 mb-4 text-muted-foreground" />}
                {mode === "upload" && <Upload className="h-16 w-16 mb-4 text-muted-foreground" />}
                {mode === "scanner" && <Fingerprint className="h-16 w-16 mb-4 text-muted-foreground" />}
              </motion.div>

              <p className="text-center text-sm text-muted-foreground mb-4">
                {mode === "camera" && t("scanFingerprintCamera")}
                {mode === "upload" && t("uploadFingerprintDescription")}
                {mode === "scanner" && t("scanFingerprintExternal")}
              </p>

              <Button onClick={startScanning}>
                {mode === "camera" && t("startScanning")}
                {mode === "upload" && t("selectFile")}
                {mode === "scanner" && t("startScanning")}
              </Button>

              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              >
                <Fingerprint className="h-24 w-24 text-primary" />
              </motion.div>

              <div className="w-48 h-2 bg-muted rounded-full mt-6 overflow-hidden">
                <motion.div className="h-full bg-primary" style={{ width: `${progress}%` }} />
              </div>

              <p className="text-white mt-4">{t("scanningFingerprint")}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
