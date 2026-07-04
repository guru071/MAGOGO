'use client'
import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, DollarSign, Landmark, Receipt, Percent, TrendingUp, BarChart3, PieChart, RefreshCw } from 'lucide-react'
import { formatPrice } from '@/store/marketplace'
import { BarChart, Bar, PieChart as RPieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { toast } from 'sonner'

const COLORS = ['#0066CC', '#FF6600', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4']
const PIE_COLORS = ['#0066CC', '#FF6600', '#F59E0B', '#10B981']

function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`
}

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
    { label: 'Commission', value: formatUSD(summary.totalCommission || 0), icon: Percent, color: 'text-[#0066CC]', bg: 'bg-blue-100' },
    { label: 'GST Collected', value: formatUSD(summary.totalGst || 0), icon: Landmark, color: 'text-[#FF6600]', bg: 'bg-orange-100' },
    { label: 'Closing Fees', value: formatUSD(summary.totalClosingFee || 0), icon: Receipt, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Payment Fees', value: formatUSD(summary.totalPaymentFee || 0), icon: TrendingUp, color: 'text-pink-600', bg: 'bg-pink-100' },
  ]

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066CC]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Platform Revenue Analytics</h2>
          <p className="text-sm text-slate-500">Fee breakdown, daily trends, and order-level revenue data</p>
        </div>
        <div className="flex items-center gap-2">
          {['7d', '30d', '90d'].map(p => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
              className={period === p ? 'bg-[#0066CC] text-white' : ''}
            >
              {p}
            </Button>
          ))}
          <Button variant="ghost" size="icon" onClick={() => fetchData(period)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryCards.map(c => (
          <Card key={c.label} className="p-4 border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full ${c.bg} flex items-center justify-center`}>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{c.label}</p>
                <p className={`font-bold text-lg ${c.color}`}>{c.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Daily Revenue Chart */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#0066CC]" /> Daily Revenue Breakdown
            </h3>
          </div>
          <div className="p-5">
            {daily.length === 0 || daily.every((d: any) => d.total === 0) ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-slate-400">No revenue data for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.max(1, Math.floor(daily.length / 10))} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value: any, name: string) => [
                      `$${Number(value).toFixed(2)}`,
                      name === 'commission' ? 'Commission' : name === 'gst' ? 'GST' : name === 'closingFee' ? 'Closing Fee' : name === 'paymentFee' ? 'Payment Fee' : name === 'total' ? 'Total' : name,
                    ]}
                  />
                  <Legend
                    formatter={(value: string) => {
                      const labels: Record<string, string> = { commission: 'Commission', gst: 'GST', closingFee: 'Closing Fee', paymentFee: 'Payment Fee' }
                      return labels[value] || value
                    }}
                  />
                  <Bar dataKey="commission" stackId="a" fill="#0066CC" />
                  <Bar dataKey="gst" stackId="a" fill="#FF6600" />
                  <Bar dataKey="closingFee" stackId="a" fill="#F59E0B" />
                  <Bar dataKey="paymentFee" stackId="a" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Fee Breakdown Pie */}
        <Card className="border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-[#FF6600]" /> Fee Distribution
            </h3>
          </div>
          <div className="p-5">
            {pieData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-slate-400">No fee data</div>
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
                      innerRadius={40}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                  </RPieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 w-full mt-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-600">{d.name}</span>
                      <span className="font-medium ml-auto">{formatUSD(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Orders with Fees */}
      <Card className="border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-purple-500" /> Recent Orders — Fee Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No orders in this period</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Order ID</th>
                  <th className="text-left p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Prompt</th>
                  <th className="text-right p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Gross</th>
                  <th className="text-right p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Commission</th>
                  <th className="text-right p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">GST</th>
                  <th className="text-right p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Closing</th>
                  <th className="text-right p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Payment</th>
                  <th className="text-right p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold text-emerald-600">Total Fees</th>
                  <th className="text-left p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-3 font-mono text-[11px] text-slate-600">{o.id}</td>
                    <td className="p-3 max-w-[150px] truncate text-slate-800">{o.prompt}</td>
                    <td className="p-3 text-right font-medium">${Number(o.amount).toFixed(2)}</td>
                    {o.fees ? (
                      <>
                        <td className="p-3 text-right text-[#0066CC]">${o.fees.commission.toFixed(2)}</td>
                        <td className="p-3 text-right text-[#FF6600]">${o.fees.gst.toFixed(2)}</td>
                        <td className="p-3 text-right text-amber-500">${o.fees.closingFee.toFixed(2)}</td>
                        <td className="p-3 text-right text-emerald-600">${o.fees.paymentFee.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-slate-900">${o.fees.total.toFixed(2)}</td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 text-right text-slate-300" colSpan={4}>No fee data</td>
                        <td className="p-3 text-right font-bold text-slate-300">-</td>
                      </>
                    )}
                    <td className="p-3">
                      <Badge className={`text-[10px] border-0 ${
                        o.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                        o.status === 'REFUNDED' ? 'bg-red-100 text-red-700' :
                        o.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
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
