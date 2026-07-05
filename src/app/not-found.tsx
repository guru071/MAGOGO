'use client'

import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 relative z-10">
      <div className="text-center max-w-lg">
        <div className="text-[120px] md:text-[180px] font-black leading-none bg-gradient-to-br from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,210,255,0.3)] select-none">
          404
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2 mb-3">Page Not Found</h1>
        <p className="text-white/50 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-neon-blue text-black px-6 py-3 rounded-full font-bold hover:bg-neon-blue/80 transition-all shadow-[0_0_15px_rgba(0,210,255,0.4)]"
          >
            <Home className="h-4 w-4" /> Go Home
          </Link>
          <Link
            href="/browse"
            className="flex items-center justify-center gap-2 bg-white/10 text-white px-6 py-3 rounded-full font-bold hover:bg-white/20 transition-all border border-white/10"
          >
            <Search className="h-4 w-4" /> Browse Prompts
          </Link>
        </div>
      </div>
    </div>
  )
}
