'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Sparkles, ArrowLeft, ImagePlus, X } from 'lucide-react'
import Link from 'next/link'

export default function UploadPromptPage() {
  const router = useRouter()
  const { user, categories, fetchCategories, fetchPrompts } = useStore()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { toast.error('Please sign in first'); return }
    if (!user.isSeller) { toast.error('Become a seller first'); return }
    const imageUrl = await uploadImage()
    setLoading(true)
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price) || 0,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        recommendedAI: [form.recommendedAI],
        sampleImages: imageUrl ? [imageUrl] : []
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
    } catch (e) {
      console.error('[upload] prompt creation error', e)
      toast.error('Failed to upload prompt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/seller" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0066CC] mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">Upload New Prompt</h1>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={e => handleChange('title', e.target.value)} required placeholder="e.g., Ultra-Realistic Portrait Photography" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={e => handleChange('description', e.target.value)} required rows={3} placeholder="Describe what this prompt does..." />
          </div>
          <div>
            <Label htmlFor="promptText">Prompt Text</Label>
            <Textarea id="promptText" value={form.promptText} onChange={e => handleChange('promptText', e.target.value)} required rows={5} placeholder="Paste the actual prompt text here..." className="font-mono text-sm" />
          </div>
          <div>
            <Label htmlFor="categoryId">Category</Label>
            <select
              id="categoryId"
              value={form.categoryId}
              onChange={e => handleChange('categoryId', e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>Select a category</option>
              {categoriesList.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recommendedAI">AI Tool</Label>
              <Input id="recommendedAI" value={form.recommendedAI} onChange={e => handleChange('recommendedAI', e.target.value)} placeholder="e.g., Midjourney v6" />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input id="tags" value={form.tags} onChange={e => handleChange('tags', e.target.value)} placeholder="photo, portrait, realistic" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (USD)</Label>
              <Input id="price" type="number" min="0" step="0.99" value={form.price} onChange={e => handleChange('price', e.target.value)} disabled={form.isFree} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFree} onChange={e => handleChange('isFree', e.target.checked)} className="rounded border-slate-300" />
                <span className="text-sm font-medium text-slate-700">Free prompt</span>
              </label>
            </div>
          </div>
          {estimate && !form.isFree && user?.role !== 'ADMIN' && (
            <div className={`p-4 rounded-lg border ${user?.currentBalance! < estimate.totalFees ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-medium ${user?.currentBalance! < estimate.totalFees ? 'text-red-800' : 'text-blue-800'}`}>Upfront Listing Fee</span>
                <span className={`text-lg font-bold ${user?.currentBalance! < estimate.totalFees ? 'text-red-700' : 'text-blue-700'}`}>
                  ${estimate.totalFees.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Your Wallet Balance:</span>
                <span className={`font-semibold ${user?.currentBalance! < estimate.totalFees ? 'text-red-600' : 'text-slate-700'}`}>
                  ${(user?.currentBalance || 0).toFixed(2)}
                </span>
              </div>
              {user?.currentBalance! < estimate.totalFees && (
                <p className="text-xs text-red-600 mt-2 font-medium">
                  Insufficient balance. You must add funds to your wallet to upload this prompt.
                </p>
              )}
              {user?.currentBalance! >= estimate.totalFees && (
                <p className="text-xs text-blue-600 mt-2">
                  This fee will be deducted from your wallet immediately. You keep 100% of all future sales!
                </p>
              )}
            </div>
          )}
          {user?.role === 'ADMIN' && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-sm font-medium text-emerald-800">Admin Bypass: No listing fee required.</span>
            </div>
          )}
          <div>
            <Label>Prompt Image</Label>
            <div className="mt-1">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-40 w-60 object-cover rounded-lg border" />
                  <button type="button" onClick={clearImage} className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 w-60 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-[#0066CC] transition-colors">
                  <ImagePlus className="h-8 w-8 text-slate-400" />
                  <span className="text-sm text-slate-500 mt-1">Click to upload (max 5MB)</span>
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </label>
              )}
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={
              loading || 
              uploadingImage || 
              (!form.isFree && user?.role !== 'ADMIN' && estimate !== null && (user?.currentBalance || 0) < estimate.totalFees)
            } 
            className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white font-semibold h-11 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Sparkles className="h-4 w-4 mr-2" /> Submit Prompt
          </Button>
        </form>
      </Card>
    </div>
  )
}
