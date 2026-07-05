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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#F0F0F0] shadow-[0_-2px_8px_rgba(0,0,0,0.06)] pb-safe">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-full gap-1 transition-colors ${isActive ? 'text-[#2874F0]' : 'text-[#878787]'}`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-[#FF6161] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
