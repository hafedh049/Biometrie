"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

// Split each app name into two parts for different colors
const appNames = [
  { first: "Frost", second: "Lock" },
  { first: "Cryp", second: "Titan" },
  { first: "Glacier", second: "Guard" },
  { first: "Zero", second: "Vault" },
  { first: "Arctic", second: "Crypt" },
  { first: "Ice", second: "node" },
  { first: "Freeze", second: "Safe" },
  { first: "Frozn", second: "Disk" },
  { first: "NØCT", second: "CRYPT" },
  { first: "SubZero", second: "Sec" },
  { first: "Cipher", second: "Shroud" },
  { first: "Obsidian", second: "Vault" },
  { first: "Silent", second: "Sector" },
  { first: "Phantom", second: "Block" },
  { first: "Encro", second: "Cryptex" },
  { first: "Cold", second: "Partition" },
  { first: "Cryptex", second: "Core" },
  { first: "Deep", second: "Crypt" },
  { first: "Iron", second: "Byte" },
  { first: "Disk", second: "Reaper" },
  { first: "Crypt", second: "Forge" },
  { first: "Shadow", second: "Sector" },
  { first: "Fr0st", second: "🔐" },
  { first: "Crypt", second: "øx" },
  { first: "BLX", second: "KLOCK" },
  { first: "VΞN", second: "CRYPT" },
]

export default function AnimatedAppName() {
  const [currentNameIndex, setCurrentNameIndex] = useState(0)

  // Effect for changing names every 4 seconds
  useEffect(() => {
    const nameChangeInterval = setInterval(() => {
      setCurrentNameIndex((prevIndex) => (prevIndex + 1) % appNames.length)
    }, 4000)

    return () => clearInterval(nameChangeInterval)
  }, [])

  const currentName = appNames[currentNameIndex]

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentName.first + currentName.second}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center"
        >
          {/* First part of the name in black */}
          <span className="text-2xl font-bold tracking-tight text-foreground">{currentName.first}</span>

          {/* Second part of the name in blue */}
          <span className="text-2xl font-bold tracking-tight text-primary">{currentName.second}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
