"use client"

import Link from "next/link"
import { useLanguage } from "@/components/language-provider"
import ThemeToggle from "@/components/theme-toggle"
import { motion } from "framer-motion"
import AnimatedAppName from "@/components/animated-app-name"

export default function ClientHeader() {
  const { t } = useLanguage()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/client" className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <AnimatedAppName />
          </motion.div>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
