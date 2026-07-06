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
    { name: 'Profile', href: '/account', icon: User },
  ]

  if (pathname?.startsWith('/admin')) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-2px_8px_rgba(0,0,0,0.06)] pb-safe" aria-label="Bottom navigation">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-full gap-0.5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              aria-label={item.name}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-brand-red text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center" aria-label={`${item.badge} items`}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
