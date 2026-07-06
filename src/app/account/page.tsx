'use client'

import { useEffect } from 'react'
import { useStore, formatPrice } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { User, Package, Heart, Settings, LogOut, TrendingUp, ShoppingBag, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function AccountPage() {
  const { user, fetchMe, logout } = useStore()
  const router = useRouter()

  useEffect(() => { fetchMe() }, [fetchMe])

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center mt-20">
        <div className="bg-card border-border rounded-sm p-8">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground">Sign in to view your profile</h2>
          <p className="text-muted-foreground mt-2 mb-8">Manage your orders, wishlist, and more</p>
          <Button className="bg-[#2874F0] hover:bg-[#2874F0]/90 text-white font-bold h-12 px-8 rounded-sm transition-all" onClick={() => useStore.getState().setShowAuthModal(true)}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out')
    router.push('/')
  }

  const stats = [
    { label: 'Total Spent', value: formatPrice(user.totalSpent || 0), icon: TrendingUp, color: 'text-[#388E3C]' },
    { label: 'Member Since', value: new Date().getFullYear().toString(), icon: User, color: 'text-[#2874F0]' },
  ]

  return (
    <div className="min-h-screen pb-12 relative z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-8">
        <div className="flex items-center gap-6 bg-card border-border rounded-sm p-6 shadow-sm">
          <Avatar className="h-20 w-20 ring-2 ring-[#2874F0]/30">
            <AvatarFallback className="bg-[#2874F0] text-white text-3xl font-black">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{user.name}</h1>
            <p className="text-base text-muted-foreground mt-1">{user.email}</p>
            {user.isSeller && <span className="inline-flex mt-2 items-center px-3 py-1 rounded-sm text-xs font-bold bg-[#2874F0]/10 text-[#2874F0] border border-[#2874F0]/20">VERIFIED SELLER</span>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-4 mb-8">
          {stats.map(s => (
            <Card key={s.label} className="p-5 bg-card border-border rounded-sm">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-sm bg-muted ${s.color}`}>
                  <s.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-2xl font-black text-foreground">{s.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/account/orders">
          <Card className="p-5 hover:shadow-md transition-all duration-300 cursor-pointer bg-card border-border rounded-sm group h-full">
            <div className="flex flex-col gap-4">
              <div className="h-12 w-12 rounded-sm bg-muted flex items-center justify-center">
                <Package className="h-6 w-6 text-[#2874F0]" />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="font-bold text-foreground text-lg">My Orders</p><p className="text-sm text-muted-foreground mt-1">View your purchase history</p></div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/account/wishlist">
          <Card className="p-5 hover:shadow-md transition-all duration-300 cursor-pointer bg-card border-border rounded-sm group h-full">
            <div className="flex flex-col gap-4">
              <div className="h-12 w-12 rounded-sm bg-muted flex items-center justify-center">
                <Heart className="h-6 w-6 text-[#FF9F00]" />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="font-bold text-foreground text-lg">Wishlist</p><p className="text-sm text-muted-foreground mt-1">Saved prompts</p></div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </Card>
        </Link>
        {user.isSeller && (
          <Link href="/seller">
            <Card className="p-5 hover:shadow-md transition-all duration-300 cursor-pointer bg-card border-border rounded-sm group h-full">
              <div className="flex flex-col gap-4">
                <div className="h-12 w-12 rounded-sm bg-muted flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-[#2874F0]" />
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="font-bold text-foreground text-lg">Seller Dashboard</p><p className="text-sm text-muted-foreground mt-1">Manage your prompts & earnings</p></div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </Card>
          </Link>
        )}
        <Link href="/account/settings">
          <Card className="p-5 hover:shadow-md transition-all duration-300 cursor-pointer bg-card border-border rounded-sm group h-full">
            <div className="flex flex-col gap-4">
              <div className="h-12 w-12 rounded-sm bg-muted flex items-center justify-center">
                <Settings className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="font-bold text-foreground text-lg">Settings</p><p className="text-sm text-muted-foreground mt-1">Manage profile & payouts</p></div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </Card>
        </Link>
        <Card className="p-5 hover:shadow-md transition-all duration-300 cursor-pointer bg-card border-[#FF9F00]/30 rounded-sm group h-full" onClick={handleLogout}>
          <div className="flex flex-col gap-4">
            <div className="h-12 w-12 rounded-sm bg-[#FF9F00]/10 flex items-center justify-center">
              <LogOut className="h-6 w-6 text-[#FF9F00]" />
            </div>
            <div><p className="font-bold text-[#FF9F00] text-lg">Sign Out</p><p className="text-sm text-muted-foreground mt-1">Log out of your account</p></div>
          </div>
        </Card>
      </div>
      </div>
    </div>
  )
}
