"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export default function ThemeToggle() {
  const { t } = useLanguage()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Initialize theme state on mount
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      // Check for stored preference first
      const savedTheme = localStorage.getItem("theme")

      // If no saved preference, check system preference
      if (savedTheme) {
        // Set initial state based on saved preference
        const initialIsDark = savedTheme === "dark"
        setIsDarkMode(initialIsDark)

        // Apply the theme to the document
        if (initialIsDark) {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
      } else {
        // No saved preference, check system preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        setIsDarkMode(prefersDark)

        // Apply the theme to the document and save it
        if (prefersDark) {
          document.documentElement.classList.add("dark")
          localStorage.setItem("theme", "dark")
        } else {
          document.documentElement.classList.remove("dark")
          localStorage.setItem("theme", "light")
        }
      }
    }

    setMounted(true)
  }, [])

  // Update the toggleTheme function to be more explicit about saving to localStorage
  const toggleTheme = () => {
    const newIsDarkMode = !isDarkMode
    setIsDarkMode(newIsDarkMode)

    // Update the DOM
    if (newIsDarkMode) {
      document.documentElement.classList.add("dark")
      // Explicitly save to localStorage
      localStorage.setItem("theme", "dark")
      console.log("Theme saved to localStorage: dark")
    } else {
      document.documentElement.classList.remove("dark")
      // Explicitly save to localStorage
      localStorage.setItem("theme", "light")
      console.log("Theme saved to localStorage: light")
    }
  }

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="outline" size="icon">
        <span className="h-[1.2rem] w-[1.2rem]"></span>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDarkMode ? t("lightMode") : t("darkMode")}
    >
      {isDarkMode ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
    </Button>
  )
}
