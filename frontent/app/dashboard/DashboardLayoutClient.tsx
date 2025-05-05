"use client"

import type React from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar"
import { AdminAuthGuard } from "@/components/auth-guard"
import { cn } from "@/lib/utils"

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage("dashboard-sidebar-collapsed", false)

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <div className="flex flex-1">
          <div className={cn("sticky top-16 h-[calc(100vh-4rem)]", sidebarCollapsed ? "w-[70px]" : "w-[240px]")}>
            <DashboardSidebar isCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
          </div>
          <main className={cn("flex-1 overflow-y-auto p-6 md:p-8 pt-6 transition-all duration-300")}>{children}</main>
        </div>
      </div>
    </AdminAuthGuard>
  )
}
