import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Rocket, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 relative z-10">
      <div className="glass-panel-heavy border border-white/10 rounded-3xl p-12 max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-neon-blue/20 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10">
          <Rocket className="h-20 w-20 text-neon-blue mx-auto mb-6 drop-shadow-[0_0_15px_rgba(0,210,255,0.6)] animate-bounce" style={{ animationDuration: '3s' }} />
          
          <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            404
          </h1>
          
          <h2 className="text-2xl font-bold text-white mb-4">
            Lost in Space
          </h2>
          
          <p className="text-white/60 mb-8 max-w-sm mx-auto">
            The page you're looking for has drifted off into the cosmos. It might have been moved or deleted.
          </p>
          
          <Link href="/">
            <Button className="bg-neon-blue hover:bg-neon-blue/80 text-black font-extrabold h-12 px-8 rounded-full shadow-[0_0_20px_rgba(0,210,255,0.5)] transition-all flex items-center gap-2 mx-auto">
              <ArrowLeft className="h-5 w-5" />
              Return to Earth
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
