"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { translations } from "@/lib/translations"

type Language = "en" | "fr"
type TranslationKey = keyof typeof translations.en

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useLocalStorage<Language>("language", "en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
  }

  const t = (key: TranslationKey) => {
    return translations[language][key] || translations.en[key] || key
  }

  if (!mounted) {
    return <>{children}</>
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    // Instead of throwing an error, return a default value
    return {
      language: "en" as Language,
      setLanguage: () => {},
      t: (key: TranslationKey) => {
        // Return the English translation or the key itself
        return translations.en[key] || key
      },
    }
  }
  return context
}
