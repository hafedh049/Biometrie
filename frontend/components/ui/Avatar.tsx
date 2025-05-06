import * as React from "react"

import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  username?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(({ className, children, username, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      {children ||
        (username && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-medium">
            {username.charAt(0).toUpperCase()}
          </span>
        ))}
    </div>
  )
})
Avatar.displayName = "Avatar"

const AvatarFallback = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn("absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-medium", className)}
        {...props}
      >
        {children}
      </span>
    )
  },
)
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarFallback }
