'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Printer, CheckCircle2 } from 'lucide-react'
import { formatUSD } from '@/store/marketplace'

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setOrder(d.data)
        else setError(d.error || 'Failed to load invoice')
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Skeleton className="h-12 w-1/3 mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold text-accent mb-4">Invoice Not Found</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.push('/')} className="bg-primary text-primary-foreground rounded-sm cursor-pointer">Return Home</Button>
      </div>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto">
        
        {/* Controls - Hidden in print */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="flex gap-3">
            <Button onClick={handlePrint} className="bg-primary text-primary-foreground rounded-sm cursor-pointer">
              <Printer className="h-4 w-4 mr-2" /> Print Invoice
            </Button>
          </div>
        </div>

        {/* Printable Invoice Card */}
        <Card className="p-8 sm:p-12 bg-card border-border rounded-sm print:shadow-none print:border-0 print:p-0">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-border pb-8 mb-8">
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">INVOICE</h1>
              <p className="text-muted-foreground mt-2 font-mono">#{order.orderId}</p>
              <div className="flex items-center gap-2 mt-4 text-brand-green font-medium">
                <CheckCircle2 className="h-5 w-5" />
                Payment Successful
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-primary tracking-tighter">MAGHGO</div>
              <p className="text-muted-foreground mt-1 text-sm">123 Marketplace Ave, Suite 100</p>
              <p className="text-muted-foreground text-sm">San Francisco, CA 94107</p>
              <p className="text-muted-foreground text-sm mt-4 font-medium">
                Date: {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Billing Info */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Billed To</h3>
              <p className="text-foreground font-bold">{order.buyer?.name || 'Customer'}</p>
              <p className="text-muted-foreground">{order.buyer?.email}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Seller Details</h3>
              <p className="text-foreground font-bold">{order.prompt?.seller?.name || 'Third-Party Seller'}</p>
              <p className="text-muted-foreground">{order.prompt?.seller?.email}</p>
            </div>
          </div>

          {/* Line Items */}
          <div className="border border-border rounded-sm overflow-hidden mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="py-4 px-6 font-bold text-foreground">Description</th>
                  <th className="py-4 px-6 font-bold text-foreground w-32 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-5 px-6">
                    <p className="font-bold text-foreground">{order.prompt?.title || 'AI Prompt'}</p>
                    <p className="text-sm text-muted-foreground mt-1">Digital Goods - Instant Access</p>
                  </td>
                  <td className="py-5 px-6 text-right font-medium text-foreground">
                    {formatUSD(order.amount)}
                  </td>
                </tr>
                {order.couponCode && (
                  <tr>
                    <td className="py-4 px-6 text-muted-foreground">
                      Coupon applied: <span className="font-mono bg-muted px-1 py-0.5 rounded text-xs">{order.couponCode}</span>
                    </td>
                    <td className="py-4 px-6 text-right text-brand-green font-medium text-xs">
                      Discount included
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-1/2 min-w-[250px] space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium">{formatUSD(order.amount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Platform Fee & Taxes</span>
                <span className="font-medium">Included</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-lg font-black text-foreground">
                <span>Total Paid</span>
                <span>{formatUSD(order.amount)} {order.currency}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-xs pt-1">
                <span>Payment Method</span>
                <span className="uppercase">{order.paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border mt-16 pt-8 text-center text-muted-foreground text-sm">
            <p className="font-medium text-foreground">Thank you for your purchase!</p>
            <p className="mt-1">If you have any questions about this invoice, please contact support@maghgo.com</p>
          </div>
          
        </Card>
      </div>
    </div>
  )
}
