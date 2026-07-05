'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Grid, ShoppingCart, Heart, User } from 'lucide-react'
import { useStore } from '@/store/marketplace'

export function BottomNav() {
  const pathname = usePathname()
  const { cart } = useStore()
  
  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Categories', href: '/categories', icon: Grid },
    { name: 'Cart', href: '/cart', icon: ShoppingCart, badge: cart.length > 0 ? cart.length : null },
    { name: 'Wishlist', href: '/account/wishlist', icon: Heart },
    { name: 'Profile', href: '/wallet', icon: User },
  ]

  // Don't show bottom nav on admin pages
  if (pathname?.startsWith('/admin')) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/10 bg-black/80 backdrop-blur-xl pb-safe">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-full gap-1 transition-all duration-300 ${isActive ? 'text-neon-blue' : 'text-white/50 hover:text-white/80'}`}
            >
              <div className="relative">
                <Icon className={`h-6 w-6 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,210,255,0.8)]' : ''}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 bg-neon-pink text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(255,0,128,0.8)]">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
