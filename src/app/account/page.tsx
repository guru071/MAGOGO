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
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <User className="h-16 w-16 text-slate-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Sign in to view your profile</h2>
        <p className="text-slate-500 mt-2 mb-6">Manage your orders, wishlist, and more</p>
        <Button className="bg-[#0066CC] text-white" onClick={() => useStore.getState().setShowAuthModal(true)}>
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
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="bg-white border-b border-slate-100 pt-12 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#0066CC]/[0.03] blur-3xl -z-10" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-[#0066CC] to-[#FF6600] text-white text-2xl font-bold">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{user.name}</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">{user.email}</p>
              {user.isSeller && <span className="inline-flex mt-2 items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">VERIFIED SELLER</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8">
        <div className="grid grid-cols-2 gap-4 mb-8">
          {stats.map(s => (
            <Card key={s.label} className="p-6 border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-slate-50 ${s.color}`}>
                  <s.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{s.label}</p>
                  <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/account/orders">
          <Card className="p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-slate-100 rounded-2xl group h-full">
            <div className="flex flex-col gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-[#0066CC] transition-colors">
                <Package className="h-5 w-5 text-[#0066CC] group-hover:text-white" />
              </div>
              <div><p className="font-bold text-slate-800">My Orders</p><p className="text-xs text-slate-500 mt-1">View your purchase history</p></div>
            </div>
          </Card>
        </Link>
        <Link href="/account/wishlist">
          <Card className="p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-slate-100 rounded-2xl group h-full">
            <div className="flex flex-col gap-4">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-500 transition-colors">
                <Heart className="h-5 w-5 text-red-500 group-hover:text-white" />
              </div>
              <div><p className="font-bold text-slate-800">Wishlist</p><p className="text-xs text-slate-500 mt-1">Saved prompts</p></div>
            </div>
          </Card>
        </Link>
        {user.isSeller && (
          <Link href="/seller">
            <Card className="p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-slate-100 rounded-2xl group h-full">
              <div className="flex flex-col gap-4">
                <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-[#FF6600] transition-colors">
                  <ShoppingBag className="h-5 w-5 text-[#FF6600] group-hover:text-white" />
                </div>
                <div><p className="font-bold text-slate-800">Seller Dashboard</p><p className="text-xs text-slate-500 mt-1">Manage your prompts & earnings</p></div>
              </div>
            </Card>
          </Link>
        )}
        <Link href="/account/settings">
          <Card className="p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-slate-100 rounded-2xl group h-full">
            <div className="flex flex-col gap-4">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                <Settings className="h-5 w-5 text-slate-600 group-hover:text-white" />
              </div>
              <div><p className="font-bold text-slate-800">Settings</p><p className="text-xs text-slate-500 mt-1">Manage profile & payouts</p></div>
            </div>
          </Card>
        </Link>
        <Card className="p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-red-100 bg-red-50/30 rounded-2xl group h-full" onClick={handleLogout}>
          <div className="flex flex-col gap-4">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center group-hover:bg-red-600 transition-colors shadow-sm">
              <LogOut className="h-5 w-5 text-red-500 group-hover:text-white" />
            </div>
            <div><p className="font-bold text-red-600">Sign Out</p><p className="text-xs text-red-400 mt-1">Log out of your account</p></div>
          </div>
        </Card>
      </div>
      </div>
    </div>
  )
}
