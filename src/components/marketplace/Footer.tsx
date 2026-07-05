import Link from 'next/link'


export function Footer() {
  return (
    <footer className="hidden md:block glass-panel border-t border-white/10 mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-neon-blue to-neon-purple flex items-center justify-center overflow-hidden shadow-lg relative">
                <span className="text-white font-bold text-base mix-blend-overlay">M</span>
              </div>
              <span className="font-bold text-white tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">MAGHGO</span>
            </div>
            <p className="text-sm text-white/50">Premium AI prompt marketplace. Buy and sell expert-crafted prompts.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">Marketplace</h4>
            <div className="flex flex-col gap-2 text-sm text-white/50">
              <Link href="/browse" className="hover:text-neon-blue transition-colors">Browse Prompts</Link>
              <Link href="/browse?isFree=true" className="hover:text-neon-blue transition-colors">Free Prompts</Link>
              <Link href="/cart" className="hover:text-neon-blue transition-colors">Cart</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">Support</h4>
            <div className="flex flex-col gap-2 text-sm text-white/50">
              <a href="mailto:support@maghgo.com" className="hover:text-neon-blue transition-colors">Contact</a>
              <Link href="/" className="hover:text-neon-blue transition-colors">About</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-white/30">
          &copy; {new Date().getFullYear()} MAGHGO. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
