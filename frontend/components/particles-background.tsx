"use client"

import { useCallback, useEffect, useState } from "react"
import Particles from "react-tsparticles"
import { loadSlim } from "tsparticles-slim"
import { useTheme } from "next-themes"
import type { Engine } from "tsparticles-engine"

export default function ParticlesBackground() {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [accentColor, setAccentColor] = useState("#0ea5e9") // Default sky blue
  const [particleOpacity, setParticleOpacity] = useState(0.5)
  const [linkOpacity, setLinkOpacity] = useState(0.5)

  // Only run on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load accent color from localStorage
  useEffect(() => {
    if (mounted) {
      try {
        const savedAccentColor = localStorage.getItem("accent-color")
        if (savedAccentColor) {
          setAccentColor(savedAccentColor)
        }
      } catch (error) {
        console.error("Error loading accent color from localStorage:", error)
      }
    }
  }, [mounted])

  // Listen for custom accent color change events (for immediate updates)
  useEffect(() => {
    if (mounted) {
      const handleAccentColorChange = (e: CustomEvent) => {
        if (e.detail && e.detail.color) {
          setAccentColor(e.detail.color)
        }
      }

      // Add event listener with type assertion
      window.addEventListener("accent-color-change", handleAccentColorChange as EventListener)
      return () => window.removeEventListener("accent-color-change", handleAccentColorChange as EventListener)
    }
  }, [mounted])

  // Listen for changes to the accent color in localStorage
  useEffect(() => {
    if (mounted) {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "accent-color" && e.newValue) {
          setAccentColor(e.newValue)
        }
      }

      window.addEventListener("storage", handleStorageChange)
      return () => window.removeEventListener("storage", handleStorageChange)
    }
  }, [mounted])

  // Determine if we're in dark mode
  const isDarkTheme = mounted && (theme === "dark" || resolvedTheme === "dark")

  // Helper function to adjust color opacity
  const adjustColorOpacity = (hexColor: string, opacity: number): string => {
    // Remove the # if present
    const hex = hexColor.replace(/^#/, "")

    // Parse the hex values
    const r = Number.parseInt(hex.substring(0, 2), 16)
    const g = Number.parseInt(hex.substring(2, 4), 16)
    const b = Number.parseInt(hex.substring(4, 6), 16)

    // Return rgba color
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  // Set particle colors based on theme and accent color
  const particleColor = isDarkTheme
    ? adjustColorOpacity(accentColor, 0.7) // Lighter version for dark mode
    : adjustColorOpacity(accentColor, 0.8) // Slightly darker for light mode

  const linkColor = isDarkTheme
    ? adjustColorOpacity(accentColor, 0.5) // Lighter version for dark mode
    : adjustColorOpacity(accentColor, 0.6) // Slightly darker for light mode

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

  if (!mounted) return null

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        background: {
          color: {
            value: "transparent",
          },
        },
        fpsLimit: 120,
        interactivity: {
          events: {
            onClick: {
              enable: false, // Disabled mouse click interaction
            },
            onHover: {
              enable: false, // Disabled mouse hover interaction
            },
            resize: true, // Keep resize enabled for window resizing
          },
          modes: {
            push: {
              quantity: 4, // Number of particles to add on click
            },
            repulse: {
              distance: 100,
              duration: 0.4,
            },
          },
        },
        particles: {
          color: {
            value: particleColor,
          },
          links: {
            color: linkColor,
            distance: 150,
            enable: true,
            opacity: linkOpacity,
            width: 1,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: false,
            speed: 0.8, // Slightly reduced speed for a more subtle effect
            straight: false,
          },
          number: {
            density: {
              enable: true,
              area: 800,
            },
            value: 70, // Number of particles
          },
          opacity: {
            value: particleOpacity,
            random: true,
            anim: {
              enable: true,
              speed: 0.5,
              opacity_min: 0.1,
              sync: false,
            },
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 1, max: 5 },
            random: true,
            anim: {
              enable: true,
              speed: 2,
              size_min: 0.1,
              sync: false,
            },
          },
        },
        detectRetina: true,
      }}
      className="fixed inset-0 -z-10"
    />
  )
}
