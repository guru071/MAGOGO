'use client'

import { useEffect } from 'react'
import { useStore, formatPrice } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { User, Package, Heart, Settings, LogOut, Wallet, TrendingUp, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function AccountPage() {
  const { user, fetchMe, logout } = useStore()
  const router = useRouter()

  useEffect(() => { fetchMe() }, [])

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center glass-panel border-white/10 rounded-3xl mt-20">
        <User className="h-16 w-16 text-white/20 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white">Sign in to view your profile</h2>
        <p className="text-white/50 mt-2 mb-8">Manage your orders, wishlist, and more</p>
        <Button className="bg-neon-blue hover:bg-neon-blue/80 text-black font-bold h-12 px-8 rounded-full shadow-[0_0_15px_rgba(0,210,255,0.5)] transition-all" onClick={() => useStore.getState().setShowAuthModal(true)}>
          Sign In
        </Button>
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out')
    router.push('/')
  }

  const stats = [
    { label: 'Total Spent', value: formatPrice(user.totalSpent || 0), icon: TrendingUp, color: 'text-green-600' },
    { label: 'Member Since', value: new Date().getFullYear().toString(), icon: User, color: 'text-blue-600' },
  ]

  return (
    <div className="min-h-screen pb-12 relative z-10">
      <div className="pt-20 pb-16 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-6 glass-panel-heavy border-white/10 p-8 rounded-3xl shadow-2xl">
            <Avatar className="h-24 w-24 ring-4 ring-neon-blue/30 shadow-[0_0_15px_rgba(0,210,255,0.4)]">
              <AvatarFallback className="bg-gradient-to-br from-neon-blue to-neon-purple text-white text-3xl font-black">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{user.name}</h1>
              <p className="text-base font-medium text-white/60 mt-2">{user.email}</p>
              {user.isSeller && <span className="inline-flex mt-3 items-center px-3 py-1 rounded-full text-xs font-bold bg-neon-blue/20 text-neon-blue border border-neon-blue/30 shadow-[0_0_10px_rgba(0,210,255,0.3)]">VERIFIED SELLER</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8">
        <div className="grid grid-cols-2 gap-6 mb-10">
          {stats.map(s => (
            <Card key={s.label} className="p-6 neon-border glass-panel border-white/10 rounded-3xl">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl bg-white/5 ${s.color}`}>
                  <s.icon className="h-8 w-8 drop-shadow-[0_0_10px_currentColor]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">{s.label}</p>
                  <p className="text-3xl font-black text-white">{s.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/account/orders">
          <Card className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer glass-panel neon-border border-white/10 rounded-3xl group h-full">
            <div className="flex flex-col gap-4">
              <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-blue transition-colors">
                <Package className="h-6 w-6 text-neon-blue group-hover:text-black" />
              </div>
              <div><p className="font-bold text-white text-lg">My Orders</p><p className="text-sm text-white/50 mt-1">View your purchase history</p></div>
            </div>
          </Card>
        </Link>
        <Link href="/account/wishlist">
          <Card className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer glass-panel neon-border border-white/10 rounded-3xl group h-full">
            <div className="flex flex-col gap-4">
              <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-pink transition-colors">
                <Heart className="h-6 w-6 text-neon-pink group-hover:text-white" />
              </div>
              <div><p className="font-bold text-white text-lg">Wishlist</p><p className="text-sm text-white/50 mt-1">Saved prompts</p></div>
            </div>
          </Card>
        </Link>
        {user.isSeller && (
          <Link href="/seller">
            <Card className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer glass-panel neon-border border-white/10 rounded-3xl group h-full">
              <div className="flex flex-col gap-4">
                <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-purple transition-colors">
                  <ShoppingBag className="h-6 w-6 text-neon-purple group-hover:text-white" />
                </div>
                <div><p className="font-bold text-white text-lg">Seller Dashboard</p><p className="text-sm text-white/50 mt-1">Manage your prompts & earnings</p></div>
              </div>
            </Card>
          </Link>
        )}
        <Link href="/account/settings">
          <Card className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer glass-panel neon-border border-white/10 rounded-3xl group h-full">
            <div className="flex flex-col gap-4">
              <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white transition-colors">
                <Settings className="h-6 w-6 text-white/70 group-hover:text-black" />
              </div>
              <div><p className="font-bold text-white text-lg">Settings</p><p className="text-sm text-white/50 mt-1">Manage profile & payouts</p></div>
            </div>
          </Card>
        </Link>
        <Card className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer glass-panel border-neon-pink/30 bg-neon-pink/10 rounded-3xl group h-full" onClick={handleLogout}>
          <div className="flex flex-col gap-4">
            <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-pink transition-colors shadow-[0_0_15px_rgba(255,0,128,0.2)]">
              <LogOut className="h-6 w-6 text-neon-pink group-hover:text-white" />
            </div>
            <div><p className="font-bold text-neon-pink text-lg">Sign Out</p><p className="text-sm text-neon-pink/70 mt-1">Log out of your account</p></div>
          </div>
        </Card>
      </div>
      </div>
    </div>
  )
}
