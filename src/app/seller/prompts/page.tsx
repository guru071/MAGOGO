'use client'

import { useState, useEffect } from 'react'
import { useStore, formatPrice, CURRENCIES, getSymbol, getRate } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Trash2, ExternalLink, PlusCircle, AlertTriangle, Edit } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export default function SellerPromptsPage() {
  const { user, selectedCurrency } = useStore()
  const [prompts, setPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPrompt, setEditingPrompt] = useState<any | null>(null)
  const [editPrice, setEditPrice] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState(false)
  const fetchPrompts = async () => {
    try {
      const res = await fetch('/api/seller/prompts')
      const json = await res.json()
      if (json.success) setPrompts(json.data)
    } catch { 
      toast.error('Failed to load your prompts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.isSeller) {
      queueMicrotask(() => fetchPrompts())
    } else {
      queueMicrotask(() => setLoading(false))
    }
  }, [user])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/seller/prompts/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast.success('Prompt deleted successfully')
        setPrompts(prompts.filter(p => p.id !== id))
      } else {
        toast.error(json.error || 'Failed to delete prompt')
      }
    } catch { 
      toast.error('An error occurred while deleting')
    }
  }

  const handleEditPrice = async () => {
    if (!editingPrompt) return
    const localPriceNum = parseFloat(editPrice)
    if (isNaN(localPriceNum) || localPriceNum < 0) {
      toast.error('Please enter a valid positive price')
      return
    }
    
    // Convert back to USD for saving
    const curObj = CURRENCIES.find(c => c.code === selectedCurrency)
    const usdPrice = curObj && curObj.rate > 0 ? localPriceNum / curObj.rate : localPriceNum
    const finalUsdPrice = Math.round(usdPrice * 100) / 100

    setIsUpdating(true)
    try {
      const res = await fetch(`/api/seller/prompts/${editingPrompt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: finalUsdPrice })
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Price updated successfully')
        setPrompts(prompts.map(p => p.id === editingPrompt.id ? { ...p, price: finalUsdPrice, isFree: finalUsdPrice === 0 } : p))
        setEditingPrompt(null)
      } else {
        toast.error(json.error || 'Failed to update price')
      }
    } catch { 
      toast.error('An error occurred while updating')
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return <div className="p-8 flex justify-center text-[#2874F0]">Loading...</div>
  }

  if (!user?.isSeller) {
    return <div className="p-8 text-center text-foreground">Please onboard as a seller first.</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Prompts</h1>
          <p className="text-muted-foreground">Manage all your uploaded prompts and view their status.</p>
        </div>
        <Link href="/seller/upload">
          <Button className="bg-[#FF9F00] hover:bg-[#FF9F00]/90 text-white font-bold rounded-sm">
            <PlusCircle className="w-4 h-4 mr-2" /> Upload New
          </Button>
        </Link>
      </div>

      {prompts.length === 0 ? (
        <Card className="bg-card border-border p-12 text-center flex flex-col items-center rounded-sm">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <PlusCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium text-foreground mb-2">No Prompts Yet</h3>
          <p className="text-muted-foreground mb-6">You haven't uploaded any prompts for sale yet.</p>
          <Link href="/seller/upload">
            <Button className="bg-[#2874F0] hover:bg-[#2874F0]/90 text-white font-bold rounded-sm">
              Start Selling
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map((prompt) => (
            <Card key={prompt.id} className="bg-card border-border p-6 flex flex-col hover:border-[#2874F0]/30 transition-colors rounded-sm">
              <div className="flex justify-between items-start mb-4">
                <Badge variant="outline" className={`
                  ${prompt.status === 'APPROVED' ? 'border-[#388E3C]/50 text-[#388E3C]' : ''}
                  ${prompt.status === 'PENDING' ? 'border-[#FF9F00]/50 text-[#FF9F00]' : ''}
                  ${prompt.status === 'REJECTED' ? 'border-[#E53935]/50 text-[#E53935]' : ''}
                `}>
                  {prompt.status}
                </Badge>
                <span className="font-bold text-[#2874F0] text-lg">
                  {prompt.isFree ? 'FREE' : formatPrice(prompt.price, selectedCurrency)}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1">{prompt.title}</h3>
              <p className="text-sm text-muted-foreground mb-6 line-clamp-2 flex-grow">{prompt.description}</p>
              
              <div className="flex justify-between items-center text-sm text-muted-foreground mb-4 pb-4 border-b border-border">
                <span>{prompt.viewCount} views</span>
                <span>{prompt._count?.orders || 0} sales</span>
              </div>

              <div className="flex justify-between items-center mt-auto">
                {prompt.status === 'APPROVED' && (
                  <Link href={`/prompt/${prompt.id}`} target="_blank">
                    <Button variant="ghost" size="sm" className="text-[#2874F0] hover:text-[#2874F0] hover:bg-[#2874F0]/10">
                      <ExternalLink className="w-4 h-4 mr-2" /> View Listing
                    </Button>
                  </Link>
                )}
                
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted ml-auto mr-2" onClick={() => { 
                  setEditingPrompt(prompt); 
                  const curObj = CURRENCIES.find(c => c.code === selectedCurrency);
                  const localPrice = curObj ? prompt.price * curObj.rate : prompt.price;
                  setEditPrice(localPrice.toFixed(2)); 
                }}>
                  <Edit className="w-4 h-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-[#E53935] hover:text-[#E53935] hover:bg-[#E53935]/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border text-foreground">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center text-[#E53935]">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Delete Prompt?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        Are you sure you want to delete <strong>{prompt.title}</strong>? It will be immediately removed from the marketplace. This action cannot be undone, though previous sales records will be preserved for your financial history.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-card border-border hover:bg-muted hover:text-foreground text-foreground">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(prompt.id)} className="bg-[#E53935] text-white hover:bg-[#E53935]/90">
                        Delete Permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Price Dialog */}
      <Dialog open={!!editingPrompt} onOpenChange={(open) => !open && setEditingPrompt(null)}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Price</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-foreground mb-2 block">New Price ({getSymbol(selectedCurrency)} {selectedCurrency})</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              className="bg-card border-input text-foreground placeholder:text-muted-foreground focus:border-[#2874F0] focus:ring-[#2874F0]"
              placeholder={`e.g. ${(5.99 * getRate(selectedCurrency)).toFixed(2)}`}
            />
            {parseFloat(editPrice) > 0 && selectedCurrency !== 'USD' && (
              <p className="text-xs text-muted-foreground mt-1 ml-1">≈ {getSymbol('USD')}{(parseFloat(editPrice) / getRate(selectedCurrency)).toFixed(2)} USD</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">Set to 0 to make it FREE.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingPrompt(null)} className="text-muted-foreground hover:text-foreground">Cancel</Button>
            <Button onClick={handleEditPrice} disabled={isUpdating} className="bg-[#2874F0] text-white font-bold hover:bg-[#2874F0]/90 rounded-sm">
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
