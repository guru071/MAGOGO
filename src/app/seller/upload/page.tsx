'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { enableRazorpayProtections, disableRazorpayProtections } from '@/lib/razorpay-client'
import { useStore, formatPrice, CURRENCIES, getSymbol, getRate } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Sparkles, ArrowLeft, ImagePlus, X } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'

export default function UploadPromptPage() {
  const router = useRouter()
  const { user, fetchPrompts, selectedCurrency } = useStore()
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [categoriesList, setCategoriesList] = useState<{id: string, name: string}[]>([])
  const [estimate, setEstimate] = useState<{ netAmount: number, commissionRate: number, totalFees: number } | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    promptText: '',
    categoryId: '',
    recommendedAI: '',
    tags: '',
    price: '0',
    isFree: false,
  })

  const handleChange = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const [paymentMethod, setPaymentMethod] = useState<'razorpay'>('razorpay')

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(json => {
        if (json.success) setCategoriesList(json.data)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    const fetchEstimate = async () => {
      const p = parseFloat(form.price)
      if (form.isFree || isNaN(p) || p <= 0) {
        setEstimate(null)
        return
      }
      try {
        const res = await fetch('/api/fees/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: p,
            promptLength: form.promptText.length,
            categoryId: form.categoryId
          })
        })
        const json = await res.json()
        if (json.success) setEstimate(json.data)
      } catch (e) {
        console.error(e)
      }
    }
    const timer = setTimeout(fetchEstimate, 500)
    return () => clearTimeout(timer)
  }, [form.price, form.isFree, form.promptText, form.categoryId])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', imageFile)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (json.success) return json.url
      toast.error(json.error || 'Failed to upload image')
      return null
    } catch (e) {
      console.error('[upload] image upload error', e)
      toast.error('Failed to upload image')
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const submitToAPI = async (imageUrl: string | null, razorpayData?: any) => {
    // Convert local currency price to USD for storage
    const localPrice = parseFloat(form.price) || 0
    const curObj = CURRENCIES.find(c => c.code === selectedCurrency)
    const usdPrice = curObj && curObj.rate > 0 ? localPrice / curObj.rate : localPrice
    
    const payload = {
      ...form,
      price: Math.round(usdPrice * 100) / 100, // store in USD, rounded to 2 decimals
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      recommendedAI: [form.recommendedAI],
      sampleImages: imageUrl ? [imageUrl] : [],
      ...razorpayData
    }
    const res = await fetch('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (json.success) {
      toast.success('Prompt submitted for review!')
      fetchPrompts()
      router.push('/seller')
    } else {
      toast.error(json.error || 'Failed to upload')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { toast.error('Please sign in first'); return }
    if (!user.isSeller) { toast.error('Become a seller first'); return }
    
    setLoading(true)
    
    // Minimum price validation (0.06 USD ~ 5 INR)
    if (!form.isFree && parseFloat(form.price) < 0.06) {
      toast.error('Minimum selling price is $0.06 USD')
      setLoading(false)
      return
    }

    const imageUrl = await uploadImage()

    if (!form.isFree && user.role !== 'ADMIN' && estimate && estimate.totalFees > 0 && paymentMethod === 'razorpay') {
      try {
        const feeRes = await fetch('/api/razorpay/upload-fee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parseFloat(form.price),
            promptLength: form.promptText.length,
            categoryId: form.categoryId
          })
        })
        const feeData = await feeRes.json()
        if (!feeData.success) throw new Error(feeData.error)

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: Math.round(feeData.feeUsd * 8350), 
          currency: 'INR',
          name: 'Maghgo',
          description: 'Prompt Listing Fee',
          order_id: feeData.orderId,
          handler: async function (response: any) {
            disableRazorpayProtections();
            await submitToAPI(imageUrl, {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            })
            setLoading(false)
          },
          prefill: { name: user?.name, email: user?.email },
          theme: { color: '#2874F0' },
          modal: {
            ondismiss: function() {
              disableRazorpayProtections();
              setLoading(false);
            }
          }
        }
        
        const rzp = new (window as any).Razorpay(options)
        rzp.on('payment.failed', function (response: any) {
          disableRazorpayProtections();
          toast.error(response.error.description || 'Payment failed')
          setLoading(false)
        })
        enableRazorpayProtections();
        rzp.open()
        return // exit function, submitToAPI will run in handler
      } catch (e: any) {
        toast.error(e.message || 'Failed to initiate Razorpay checkout')
        setLoading(false)
        return
      }
    }

    try {
      await submitToAPI(imageUrl)
    } catch (e) {
      console.error('[upload] prompt creation error', e)
      toast.error('Failed to upload prompt')
    } finally {
      setLoading(false)
    }
  }

  const needsListingFee = !form.isFree && user?.role !== 'ADMIN' && estimate !== null

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Link href="/seller" className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary transition-all mb-6">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Dashboard
      </Link>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-8">Upload New Prompt</h1>

      <Card className="bg-card border-border rounded-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title" className="text-foreground ml-1 font-bold">Title</Label>
            <Input id="title" value={form.title} onChange={e => handleChange('title', e.target.value)} required placeholder="e.g., Ultra-Realistic Portrait Photography" className="mt-1.5 bg-card border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-11" />
          </div>
          <div>
            <Label htmlFor="description" className="text-foreground ml-1 font-bold">Description</Label>
            <Textarea id="description" value={form.description} onChange={e => handleChange('description', e.target.value)} required rows={3} placeholder="Describe what this prompt does..." className="mt-1.5 bg-card border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-sm" />
          </div>
          <div>
            <Label htmlFor="promptText" className="text-foreground ml-1 font-bold">Prompt Text</Label>
            <Textarea id="promptText" value={form.promptText} onChange={e => handleChange('promptText', e.target.value)} required rows={5} placeholder="Paste the actual prompt text here..." className="mt-1.5 bg-card border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-sm font-mono text-sm" />
          </div>
          <div>
            <Label htmlFor="categoryId" className="text-foreground ml-1 font-bold">Category</Label>
            <select
              id="categoryId"
              value={form.categoryId}
              onChange={e => handleChange('categoryId', e.target.value)}
              required
              className="mt-1.5 flex h-11 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>Select a category</option>
              {categoriesList.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recommendedAI" className="text-foreground ml-1 font-bold">AI Tool</Label>
              <Input id="recommendedAI" value={form.recommendedAI} onChange={e => handleChange('recommendedAI', e.target.value)} placeholder="e.g., Midjourney v6" className="mt-1.5 bg-card border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-11" />
            </div>
            <div>
              <Label htmlFor="tags" className="text-foreground ml-1 font-bold">Tags (comma-separated)</Label>
              <Input id="tags" value={form.tags} onChange={e => handleChange('tags', e.target.value)} placeholder="photo, portrait, realistic" className="mt-1.5 bg-card border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-11" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price" className="text-foreground ml-1 font-bold">Price ({getSymbol(selectedCurrency)} {selectedCurrency})</Label>
              <Input id="price" type="number" min="0" step="0.01" value={form.price} onChange={e => handleChange('price', e.target.value)} disabled={form.isFree} className="mt-1.5 bg-card border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-11 disabled:bg-muted" />
              {!form.isFree && parseFloat(form.price) > 0 && selectedCurrency !== 'USD' && (
                <p className="text-xs text-muted-foreground mt-1 ml-1">≈ {getSymbol('USD')}{(parseFloat(form.price) / getRate(selectedCurrency)).toFixed(2)} USD</p>
              )}
            </div>
            <div className="flex items-end pb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFree} onChange={e => handleChange('isFree', e.target.checked)} className="rounded border-input bg-card text-primary focus:ring-primary w-5 h-5" />
                <span className="text-sm font-bold text-foreground">Free prompt</span>
              </label>
            </div>
          </div>

          {needsListingFee && (
            <div className="p-5 rounded-sm border bg-card border-primary/30 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-foreground uppercase tracking-widest">Listing Fee</span>
                  <span className="text-xl font-black text-primary">
                    {formatPrice(estimate?.totalFees || 0, selectedCurrency)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Pay via Razorpay (UPI, Cards, NetBanking)</p>
              </div>
            </div>
          )}

          {user?.role === 'ADMIN' && (
            <div className="p-3 rounded-sm bg-brand-green/10 border border-brand-green/30">
              <span className="text-sm font-bold text-brand-green">Admin Bypass: No listing fee required.</span>
            </div>
          )}
          <div>
            <Label className="text-foreground ml-1 font-bold">Prompt Image</Label>
            <div className="mt-1.5">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-40 w-60 object-cover rounded-sm border border-border shadow-sm" />
                  <button type="button" onClick={clearImage} className="absolute -top-2 -right-2 h-7 w-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-sm" aria-label="Clear image">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 w-60 border-2 border-dashed border-input bg-card rounded-sm cursor-pointer hover:border-primary hover:bg-muted transition-colors">
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  <span className="text-xs font-bold text-muted-foreground mt-2">Click to upload (max 5MB)</span>
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </label>
              )}
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={loading || uploadingImage} 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold h-14 rounded-sm mt-4 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
            <Sparkles className="h-5 w-5 mr-2" /> {needsListingFee ? 'Pay & Submit Prompt' : 'Submit Prompt'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
