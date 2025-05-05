"use client"

import { useState } from "react"
import type React from "react"
import ClientHeader from "@/components/client/client-header"
import ClientSidebar from "@/components/client/client-sidebar"
import { ClientAuthGuard } from "@/components/auth-guard"
import { cn } from "@/lib/utils"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <ClientAuthGuard>
      <div className="flex min-h-screen flex-col">
        <ClientHeader />
        <div className="flex flex-1">
          <div className={cn("sticky top-16 h-[calc(100vh-4rem)]", sidebarCollapsed ? "w-[70px]" : "w-[240px]")}>
            <ClientSidebar isCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          </div>
          <main className={cn("flex-1 overflow-y-auto p-6 md:p-8 pt-6 transition-all duration-300")}>{children}</main>
        </div>
      </div>
    </ClientAuthGuard>
  )
}
