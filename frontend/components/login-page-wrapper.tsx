"use client"

import dynamic from "next/dynamic"

// Use dynamic import with SSR disabled to ensure the component only renders on client
const LoginPage = dynamic(() => import("@/components/login-page"), {
  ssr: false,
  loading: () => <div className="min-h-screen flex items-center justify-center">Loading...</div>,
})

export default function LoginPageWrapper() {
  return <LoginPage />
}
