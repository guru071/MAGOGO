'use client'

import { useState, useEffect } from 'react'
import { useStore, formatPrice, getSymbol } from '@/store/marketplace'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import { ShoppingCart, ExternalLink, TrendingUp as TrendingUpIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function SellerSalesHistoryPage() {
  const { user, selectedCurrency } = useStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (user?.isSeller) {
      fetch('/api/orders?type=sold')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setOrders(data.data)
          }
        })
        .finally(() => setLoading(false))
    } else {
      queueMicrotask(() => setLoading(false))
    }
  }, [user])

  if (loading) {
    return <div className="p-8 flex justify-center text-[#2874F0]">Loading...</div>
  }

  if (!user?.isSeller) {
    return <div className="p-8 text-center text-foreground">Please onboard as a seller first.</div>
  }

  // Process data for charts
  const processChartData = () => {
    if (!orders || orders.length === 0) return [];
    
    // Group by date
    const dailyData: Record<string, number> = {};
    const dailySales: Record<string, number> = {};
    
    // Sort orders oldest to newest for chart
    const sortedOrders = [...orders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    sortedOrders.forEach(order => {
      const date = format(new Date(order.createdAt), 'MMM dd');
      dailyData[date] = (dailyData[date] || 0) + (order.sellerAmount || 0);
      dailySales[date] = (dailySales[date] || 0) + 1;
    });

    return Object.keys(dailyData).map(date => ({
      date,
      revenue: Number(dailyData[date].toFixed(2)),
      sales: dailySales[date]
    }));
  };

  const chartData = processChartData();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Sales History</h1>
        <p className="text-muted-foreground">A complete record of all your prompt sales and earnings.</p>
      </div>

      {orders.length === 0 ? (
        <Card className="bg-card border-border p-12 text-center flex flex-col items-center rounded-sm">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <ShoppingCart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium text-foreground mb-2">No Sales Yet</h3>
          <p className="text-muted-foreground mb-6">Keep promoting your prompts to get your first sale!</p>
          <Link href="/seller/prompts">
            <Button className="bg-[#2874F0] text-white font-bold rounded-sm">Manage Prompts</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {chartData.length > 0 && (
            <Card className="bg-card border-border p-6 rounded-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><TrendingUpIcon className="h-5 w-5 text-[#2874F0]" /> Earnings Trend</h3>
                  <p className="text-sm text-muted-foreground">Your revenue over time</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-black text-[#388E3C]">{formatPrice(orders.reduce((sum, o) => sum + o.sellerAmount, 0), selectedCurrency)}</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#388E3C" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#388E3C" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="#878787" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#878787" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${getSymbol(selectedCurrency)}${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #F0F0F0', borderRadius: '8px', color: '#212121' }}
                      itemStyle={{ color: '#388E3C', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#388E3C" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <div className="bg-card border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="bg-muted text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Prompt</th>
                  <th className="px-6 py-4">Buyer</th>
                  <th className="px-6 py-4 text-right">Gross Amount</th>
                  <th className="px-6 py-4 text-right">Platform Fee</th>
                  <th className="px-6 py-4 text-right">Net Earning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {order.orderId}
                    </td>
                    <td className="px-6 py-4">
                      {order.prompt ? (
                        <div className="flex items-center">
                          <span className="font-medium truncate max-w-[200px]" title={order.prompt.title}>
                            {order.prompt.title}
                          </span>
                          <Link href={`/prompt/${order.prompt.id}`} target="_blank" className="ml-2 text-[#2874F0] hover:text-foreground">
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Deleted Prompt</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {order.buyer?.name || 'Anonymous User'}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {formatPrice(order.amount, selectedCurrency)}
                    </td>
                    <td className="px-6 py-4 text-right text-[#E53935]">
                      -{formatPrice(order.totalFees || order.platformFee, selectedCurrency)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#388E3C]">
                      +{formatPrice(order.sellerAmount, selectedCurrency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}
    </div>
  )
}
