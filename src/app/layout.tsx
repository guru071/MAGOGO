'use client'

import { useEffect } from "react"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { useStore, fetchLiveRates } from "@/store/marketplace"
import { Navbar } from "@/components/marketplace/Navbar"
import { Footer } from "@/components/marketplace/Footer"
import { AuthModal } from "@/components/marketplace/AuthModal"
import ChatButton from "@/components/marketplace/ChatButton"
import { ThemeRenderer } from "@/components/marketplace/ThemeRenderer"
import { BottomNav } from "@/components/marketplace/BottomNav"
import { AppInitializer } from "@/components/marketplace/AppInitializer"
import { usePathname } from "next/navigation"
import { ThemeProvider } from "next-themes"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

function AppShell({ children }: { children: React.ReactNode }) {
  const { fetchMe } = useStore()
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  useEffect(() => {
    fetchMe()
    fetchLiveRates()
  }, [fetchMe])

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <BottomNav />
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
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-neon-pink/30 selection:text-white bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          {/* Animated Universe Background (Conditional) */}
          <ThemeRenderer />
          
          <AppInitializer />
          <main className="min-h-screen relative z-10 flex flex-col">
            <AppShell>{children}</AppShell>
            <Toaster theme="system" />
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
