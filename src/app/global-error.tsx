'use client'

import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white flex items-center justify-center min-h-screen">
        <div className="text-center max-w-lg px-6">
          <AlertTriangle className="h-16 w-16 text-amber-400 mx-auto mb-6 animate-pulse" />
          <h1 className="text-3xl font-extrabold mb-3">Something went wrong</h1>
          <p className="text-white/50 mb-8 text-sm">
            An unexpected error occurred. Our team has been notified. Please try again.
          </p>
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 mx-auto bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-neon-blue transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
