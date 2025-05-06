import type React from "react"
import type { Metadata } from "next"
import DashboardLayoutClient from "./DashboardLayoutClient"

export const metadata: Metadata = {
  title: "Dashboard - FingerScanner",
  description: "Admin dashboard for FingerScanner",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutClient children={children} />
}
