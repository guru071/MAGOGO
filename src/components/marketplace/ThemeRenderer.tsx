'use client'

import { useStore } from '@/store/marketplace'
import { UniverseBackground } from '@/components/marketplace/UniverseBackground'

export function ThemeRenderer() {
  const { themeStyle } = useStore()

  if (themeStyle !== 'universe') {
    return null;
  }

  return (
    <>
      <UniverseBackground />
      <div className="fixed inset-0 z-[-2] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neon-purple/20 via-transparent to-transparent animate-gradient-xy pointer-events-none"></div>
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-neon-blue/10 blur-[120px] animate-pulse-glow pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-neon-pink/10 blur-[120px] animate-pulse-glow pointer-events-none" style={{animationDelay: '2s'}}></div>
    </>
  )
}
