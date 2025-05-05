"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { Users, HardDrive, Layers, Home, Settings, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"

interface DashboardSidebarProps {
  isCollapsed: boolean
  toggleSidebar: () => void
}

export default function DashboardSidebar({ isCollapsed, toggleSidebar }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { t } = useLanguage()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  const routes = [
    {
      label: t("dashboard"),
      icon: Home,
      href: "/dashboard",
    },
    {
      label: t("users"),
      icon: Users,
      href: "/dashboard/users",
    },
    {
      label: t("devices"),
      icon: HardDrive,
      href: "/dashboard/devices",
    },
    {
      label: t("partitions"),
      icon: Layers,
      href: "/dashboard/partitions",
    },
    {
      label: t("settings"),
      icon: Settings,
      href: "/dashboard/settings",
    },
  ]

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-card/50 relative transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[70px]" : "w-[240px]",
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-3 z-10 h-6 w-6 rounded-full border shadow-md bg-background"
        onClick={toggleSidebar}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      <div className="flex-1 p-4">
        <div className="flex flex-col gap-2">
          {routes.map((route) => (
            <Button
              key={route.href}
              variant={pathname === route.href ? "default" : "ghost"}
              className={cn(
                "transition-all",
                pathname === route.href && "bg-primary text-primary-foreground",
                isCollapsed ? "justify-center w-10 h-10 p-0 mx-auto" : "justify-start gap-2",
              )}
              asChild
            >
              <Link href={route.href}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-2")}
                >
                  <route.icon className="h-5 w-5" />
                  {!isCollapsed && <span>{route.label}</span>}
                </motion.div>
              </Link>
            </Button>
          ))}
        </div>
        <div className="mt-auto pt-4">
          <Button
            variant="ghost"
            className={cn(
              "w-full transition-all",
              isCollapsed ? "justify-center w-10 h-10 p-0 mx-auto" : "justify-start gap-2",
            )}
            onClick={handleLogout}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-2")}
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span>{t("logout")}</span>}
            </motion.div>
          </Button>
        </div>
      </div>
    </div>
  )
}
