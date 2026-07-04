'use client'

import { useEffect } from "react"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { useStore } from "@/store/marketplace"
import { Navbar } from "@/components/marketplace/Navbar"
import { Footer } from "@/components/marketplace/Footer"
import { AuthModal } from "@/components/marketplace/AuthModal"
import ChatButton from "@/components/marketplace/ChatButton"
import { usePathname } from "next/navigation"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

function AppShell({ children }: { children: React.ReactNode }) {
  const { fetchMe, user } = useStore()
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  useEffect(() => {
    fetchMe()
  }, [])

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <AuthModal />
      <ChatButton />
    </div>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>MAGHGO — AI Prompt Marketplace</title>
        <meta name="description" content="Discover, buy and sell premium AI prompts for ChatGPT, Midjourney, DALL-E and more." />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <AppShell>{children}</AppShell>
        <Toaster />
      </body>
    </html>
  )
}
