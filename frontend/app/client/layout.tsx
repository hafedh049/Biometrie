import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./client-layout"

export const metadata: Metadata = {
  title: "Client Dashboard - FingerScanner",
  description: "Client dashboard for FingerScanner",
}

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout children={children} />
}
