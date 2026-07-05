'use client'

import { useEffect, useState } from 'react'
import { useStore, formatPrice } from '@/store/marketplace'
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
  const [editingPrompt, setEditingPrompt] = useState<any>(null)
  const [editPrice, setEditPrice] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchPrompts = async () => {
    try {
      const res = await fetch('/api/seller/prompts')
      const json = await res.json()
      if (json.success) setPrompts(json.data)
    } catch (e) {
      toast.error('Failed to load your prompts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.isSeller) {
      fetchPrompts()
    } else {
      setLoading(false)
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
    } catch (e) {
      toast.error('An error occurred while deleting')
    }
  }

  const handleEditPrice = async () => {
    if (!editingPrompt) return
    const priceNum = parseFloat(editPrice)
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Please enter a valid positive price')
      return
    }
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/seller/prompts/${editingPrompt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: priceNum })
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Price updated successfully')
        setPrompts(prompts.map(p => p.id === editingPrompt.id ? { ...p, price: priceNum, isFree: priceNum === 0 } : p))
        setEditingPrompt(null)
      } else {
        toast.error(json.error || 'Failed to update price')
      }
    } catch (e) {
      toast.error('An error occurred while updating')
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return <div className="p-8 flex justify-center text-neon-blue">Loading...</div>
  }

  if (!user?.isSeller) {
    return <div className="p-8 text-center text-white">Please onboard as a seller first.</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Prompts</h1>
          <p className="text-white/60">Manage all your uploaded prompts and view their status.</p>
        </div>
        <Link href="/seller/upload">
          <Button className="bg-neon-pink hover:bg-neon-pink/80 text-black font-bold">
            <PlusCircle className="w-4 h-4 mr-2" /> Upload New
          </Button>
        </Link>
      </div>

      {prompts.length === 0 ? (
        <Card className="glass-panel border-white/10 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <PlusCircle className="w-8 h-8 text-white/40" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">No Prompts Yet</h3>
          <p className="text-white/50 mb-6">You haven't uploaded any prompts for sale yet.</p>
          <Link href="/seller/upload">
            <Button className="bg-neon-blue hover:bg-neon-blue/80 text-black font-bold">
              Start Selling
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map((prompt) => (
            <Card key={prompt.id} className="glass-panel border-white/10 p-6 flex flex-col hover:border-neon-blue/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <Badge variant="outline" className={`
                  ${prompt.status === 'APPROVED' ? 'border-emerald-500/50 text-emerald-400' : ''}
                  ${prompt.status === 'PENDING' ? 'border-yellow-500/50 text-yellow-400' : ''}
                  ${prompt.status === 'REJECTED' ? 'border-red-500/50 text-red-400' : ''}
                `}>
                  {prompt.status}
                </Badge>
                <span className="font-bold text-neon-blue text-lg">
                  {prompt.isFree ? 'FREE' : formatPrice(prompt.price, selectedCurrency)}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{prompt.title}</h3>
              <p className="text-sm text-white/60 mb-6 line-clamp-2 flex-grow">{prompt.description}</p>
              
              <div className="flex justify-between items-center text-sm text-white/50 mb-4 pb-4 border-b border-white/5">
                <span>{prompt.viewCount} views</span>
                <span>{prompt._count?.orders || 0} sales</span>
              </div>

              <div className="flex justify-between items-center mt-auto">
                {prompt.status === 'APPROVED' && (
                  <Link href={`/prompt/${prompt.id}`} target="_blank">
                    <Button variant="ghost" size="sm" className="text-neon-blue hover:text-neon-blue hover:bg-neon-blue/10">
                      <ExternalLink className="w-4 h-4 mr-2" /> View Listing
                    </Button>
                  </Link>
                )}
                
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 ml-auto mr-2" onClick={() => { setEditingPrompt(prompt); setEditPrice(prompt.price?.toString() || '0'); }}>
                  <Edit className="w-4 h-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/20">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass-panel border-white/10 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center text-red-400">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Delete Prompt?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-white/70">
                        Are you sure you want to delete <strong>{prompt.title}</strong>? It will be immediately removed from the marketplace. This action cannot be undone, though previous sales records will be preserved for your financial history.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-white">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(prompt.id)} className="bg-red-500 text-white hover:bg-red-600">
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
        <DialogContent className="glass-panel border-white/10 text-white bg-black/90 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Price</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-white/70 mb-2 block">New Price (USD)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-neon-blue focus:ring-neon-blue"
              placeholder="e.g. 5.99"
            />
            <p className="text-xs text-white/50 mt-2">Set to 0 to make it FREE.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingPrompt(null)} className="text-white/70 hover:text-white">Cancel</Button>
            <Button onClick={handleEditPrice} disabled={isUpdating} className="bg-neon-blue text-black font-bold hover:bg-neon-blue/80">
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
