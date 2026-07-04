'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore, formatPrice, CURRENCIES, PAYMENT_METHODS } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, CreditCard, Lock, ShoppingBag, Smartphone } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, user, selectedCurrency, setSelectedCurrency, createOrder, setShowAuthModal, fetchMe } = useStore()
  const [paymentMethod, setPaymentMethod] = useState('WALLET')
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const [playStorePackage, setPlayStorePackage] = useState('')
  const [playStoreProductId, setPlayStoreProductId] = useState('')
  const [playStorePurchaseToken, setPlayStorePurchaseToken] = useState('')

  useEffect(() => {
    if (!user) fetchMe()
  }, [])

  const total = cart.reduce((sum, p) => sum + p.price, 0)
  const platformFee = total * 0.1
  const grandTotal = total + platformFee

  const handleCheckout = async () => {
    if (!user) { setShowAuthModal(true); return }
    setLoading(true)
    try {
      if (paymentMethod === 'PLAY_STORE') {
        if (!playStorePackage || !playStoreProductId || !playStorePurchaseToken) {
          toast.error('Please fill in all Play Store purchase details')
          setLoading(false); return
        }
        const res = await fetch('/api/orders/verify-play', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageName: playStorePackage,
            productId: playStoreProductId,
            purchaseToken: playStorePurchaseToken,
            promptIds: cart.map(p => p.id),
          }),
        })
        const json = await res.json()
        if (!json.success) { toast.error(json.error || 'Play Store verification failed'); setLoading(false); return }
        toast.success('Play Store purchase verified! Prompt unlocked.')
        useStore.getState().clearCart()
        router.push('/account/orders')
        setLoading(false)
        return
      }
      for (const prompt of cart) {
        await createOrder(prompt.id, paymentMethod, code || undefined, selectedCurrency)
      }
      toast.success('Order placed successfully!')
      router.push('/account/orders')
    } catch (err: any) {
      toast.error(err.message || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-slate-200 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-700">Nothing to checkout</h2>
        <p className="text-slate-500 mt-2 mb-6">Add items to your cart first</p>
        <Link href="/browse"><Button className="bg-[#0066CC] text-white">Browse Prompts</Button></Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">Checkout</h1>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#0066CC]" /> Payment Method
            </h3>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
              {PAYMENT_METHODS.map(m => (
                <div key={m.value} className="flex items-center space-x-3 border rounded-lg p-3 hover:border-[#0066CC]/30 transition-colors">
                  <RadioGroupItem value={m.value} id={m.value} />
                  <Label htmlFor={m.value} className="flex-1 cursor-pointer">
                    <span className="text-sm font-medium text-slate-800">{m.label}</span>
                    <p className="text-xs text-slate-400">{m.desc}</p>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {paymentMethod === 'PLAY_STORE' && (
              <div className="mt-4 space-y-3 border-t pt-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Smartphone className="h-4 w-4 text-green-600" /> Play Store Purchase Details
                </div>
                <Input placeholder="Package Name (e.g. com.example.app)" value={playStorePackage} onChange={e => setPlayStorePackage(e.target.value)} />
                <Input placeholder="Product ID (e.g. prompt_01)" value={playStoreProductId} onChange={e => setPlayStoreProductId(e.target.value)} />
                <Input placeholder="Purchase Token from Play Billing" value={playStorePurchaseToken} onChange={e => setPlayStorePurchaseToken(e.target.value)} />
                <p className="text-xs text-slate-400">Enter the purchase token received from the Google Play Billing library after a successful in-app purchase.</p>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-slate-800 mb-3">Currency</h3>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.flag} {c.code} - {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-6 sticky top-24">
            <h3 className="font-bold text-slate-800 mb-4">Order Summary</h3>
            <div className="space-y-3">
              {cart.map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 truncate max-w-[180px]">{p.title}</span>
                  <span className="font-medium">{formatPrice(p.price, selectedCurrency)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span><span>{formatPrice(total, selectedCurrency)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Fee</span><span>{formatPrice(platformFee, selectedCurrency)}</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between font-bold text-slate-900 text-lg">
              <span>Total</span><span>{formatPrice(grandTotal, selectedCurrency)}</span>
            </div>

            <Button onClick={handleCheckout} disabled={loading || cart.length === 0}
              className="w-full mt-6 bg-[#FF6600] hover:bg-[#E65C00] text-white font-semibold h-12 shadow-lg shadow-[#FF6600]/20">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? 'Processing...' : `Pay ${formatPrice(grandTotal, selectedCurrency)}`}
            </Button>

            <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-slate-400">
              <Lock className="h-3 w-3" /> {paymentMethod === 'PLAY_STORE' ? 'Verified by Google Play' : 'Secured by Razorpay'}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
