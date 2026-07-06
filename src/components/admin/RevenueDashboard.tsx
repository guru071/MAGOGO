'use client'
import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, DollarSign, Landmark, Receipt, Percent, TrendingUp, BarChart3, PieChart, RefreshCw } from 'lucide-react'
import { formatPrice, formatUSD } from '@/store/marketplace'
import { BarChart, Bar, PieChart as RPieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { toast } from 'sonner'

const COLORS = ['neon-blue', '#ff0080', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4']
const PIE_COLORS = ['neon-blue', '#ff0080', '#F59E0B', '#10B981']

export default function RevenueDashboard() {
  const [period, setPeriod] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  const fetchData = async (p: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/revenue?period=${p}`)
      const j = await res.json()
      if (j.success) {
        setData(j.data)
      } else {
        toast.error(j.error || 'Failed to load revenue data')
      }
    } catch (e: any) { 
      toast.error('Failed to load revenue data')
      console.error('[RevenueDashboard]', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(period)
  }, [period])

  const summary = data?.summary || {}
  const daily = data?.daily || []
  const orders = data?.orders || []

  const pieData = [
    { name: 'Commission', value: summary.totalCommission || 0 },
    { name: 'GST', value: summary.totalGst || 0 },
    { name: 'Closing Fee', value: summary.totalClosingFee || 0 },
    { name: 'Payment Fee', value: summary.totalPaymentFee || 0 },
  ].filter(d => d.value > 0)

  const summaryCards = [
    { label: 'Total Revenue', value: formatUSD(summary.totalRevenue || 0), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Commission', value: formatUSD(summary.totalCommission || 0), icon: Percent, color: 'text-neon-blue', bg: 'bg-blue-100' },
    { label: 'GST Collected', value: formatUSD(summary.totalGst || 0), icon: Landmark, color: 'text-neon-pink', bg: 'bg-orange-100' },
    { label: 'Closing Fees', value: formatUSD(summary.totalClosingFee || 0), icon: Receipt, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Payment Fees', value: formatUSD(summary.totalPaymentFee || 0), icon: TrendingUp, color: 'text-pink-600', bg: 'bg-pink-100' },
  ]

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neon-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Platform Revenue Analytics</h2>
          <p className="text-sm text-white/60">Fee breakdown, daily trends, and order-level revenue data</p>
        </div>
        <div className="flex items-center gap-2">
          {['7d', '30d', '90d'].map(p => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
              className={period === p ? 'bg-neon-blue text-black font-extrabold border-0 shadow-[0_0_15px_rgba(0,210,255,0.4)]' : 'bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white'}
            >
              {p}
            </Button>
          ))}
          <Button variant="ghost" size="icon" onClick={() => fetchData(period)} className="text-white/70 hover:text-white hover:bg-white/10">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryCards.map(c => (
          <Card key={c.label} className="glass-panel p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)] border-white/10">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${c.bg.replace('100', '500/20')} flex items-center justify-center border border-${c.color.replace('text-', '')}/30`}>
                <c.icon className={`h-5 w-5 ${c.color.replace('600', '400')} drop-shadow-[0_0_5px_currentColor]`} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/50 font-bold">{c.label}</p>
                <p className={`font-black text-lg ${c.color.replace('600', '400')}`}>{c.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Daily Revenue Chart */}
        <Card className="glass-panel lg:col-span-2 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <div className="p-5 border-b border-white/10 bg-black/40 rounded-t-2xl">
            <h3 className="font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-neon-blue drop-shadow-[0_0_5px_rgba(0,210,255,0.8)]" /> Daily Revenue Breakdown
            </h3>
          </div>
          <div className="p-5">
            {daily.length === 0 || daily.every((d: any) => d.total === 0) ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-white/40">No revenue data for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#ffffff66' }} interval={Math.max(1, Math.floor(daily.length / 10))} />
                  <YAxis tick={{ fontSize: 10, fill: '#ffffff66' }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', backdropFilter: 'blur(10px)' }}
                    formatter={(value: any, name: string) => [
                      formatUSD(Number(value)),
                      name === 'commission' ? 'Commission' : name === 'gst' ? 'GST' : name === 'closingFee' ? 'Closing Fee' : name === 'paymentFee' ? 'Payment Fee' : name === 'total' ? 'Total' : name,
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ color: '#ffffffb3', fontSize: 12 }}
                    formatter={(value: string) => {
                      const labels: Record<string, string> = { commission: 'Commission', gst: 'GST', closingFee: 'Closing Fee', paymentFee: 'Payment Fee' }
                      return labels[value] || value
                    }}
                  />
                  <Bar dataKey="commission" stackId="a" fill="#00d2ff" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="gst" stackId="a" fill="#ff0080" />
                  <Bar dataKey="closingFee" stackId="a" fill="#F59E0B" />
                  <Bar dataKey="paymentFee" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Fee Breakdown Pie */}
        <Card className="glass-panel shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <div className="p-5 border-b border-white/10 bg-black/40 rounded-t-2xl">
            <h3 className="font-bold text-white flex items-center gap-2">
              <PieChart className="h-5 w-5 text-neon-pink drop-shadow-[0_0_5px_rgba(255,102,0,0.8)]" /> Fee Distribution
            </h3>
          </div>
          <div className="p-5">
            {pieData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-white/40">No fee data</div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <RPieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={45}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      stroke="rgba(255,255,255,0.1)"
                    >
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, backdropFilter: 'blur(10px)' }} formatter={(value: any) => formatUSD(Number(value))} />
                  </RPieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-3 w-full mt-4">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex flex-col gap-1 text-xs p-2 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full shrink-0 shadow-[0_0_5px_currentColor]" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-white/70 font-medium">{d.name}</span>
                      </div>
                      <span className="font-black text-white pl-3.5">{formatUSD(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Orders with Fees */}
      <Card className="glass-panel shadow-[0_0_20px_rgba(0,0,0,0.3)]">
        <div className="p-5 border-b border-white/10 bg-black/40 rounded-t-2xl">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Receipt className="h-5 w-5 text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.8)]" /> Recent Orders — Fee Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-white/40">No orders in this period</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-black/30 border-b border-white/10">
                  <th className="text-left p-4 text-[10px] uppercase tracking-wider text-white/50 font-bold">Order ID</th>
                  <th className="text-left p-4 text-[10px] uppercase tracking-wider text-white/50 font-bold">Prompt</th>
                  <th className="text-right p-4 text-[10px] uppercase tracking-wider text-white/50 font-bold">Gross</th>
                  <th className="text-right p-4 text-[10px] uppercase tracking-wider text-white/50 font-bold">Commission</th>
                  <th className="text-right p-4 text-[10px] uppercase tracking-wider text-white/50 font-bold">GST</th>
                  <th className="text-right p-4 text-[10px] uppercase tracking-wider text-white/50 font-bold">Closing</th>
                  <th className="text-right p-4 text-[10px] uppercase tracking-wider text-white/50 font-bold">Payment</th>
                  <th className="text-right p-4 text-[10px] uppercase tracking-wider text-neon-blue font-bold">Total Fees</th>
                  <th className="text-left p-4 text-[10px] uppercase tracking-wider text-white/50 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-[11px] text-white/60">{o.id}</td>
                    <td className="p-4 max-w-[150px] truncate text-white/90 font-medium">{o.prompt}</td>
                    <td className="p-4 text-right font-bold text-white">{formatUSD(Number(o.amount))}</td>
                    {o.fees ? (
                      <>
                        <td className="p-4 text-right text-neon-blue font-medium">{formatUSD(o.fees.commission)}</td>
                        <td className="p-4 text-right text-neon-pink font-medium">{formatUSD(o.fees.gst)}</td>
                        <td className="p-4 text-right text-amber-400 font-medium">{formatUSD(o.fees.closingFee)}</td>
                        <td className="p-4 text-right text-emerald-400 font-medium">{formatUSD(o.fees.paymentFee)}</td>
                        <td className="p-4 text-right font-black text-white bg-white/5">{formatUSD(o.fees.total)}</td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 text-right text-white/20" colSpan={4}>No fee data</td>
                        <td className="p-4 text-right font-bold text-white/20">-</td>
                      </>
                    )}
                    <td className="p-4">
                      <Badge className={`text-[10px] border-0 px-2 py-1 ${
                        o.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' :
                        o.status === 'REFUNDED' ? 'bg-red-500/20 text-red-300' :
                        o.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-white/10 text-white/60'
                      }`}>{o.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
