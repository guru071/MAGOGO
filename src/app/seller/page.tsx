'use client'

import { useEffect, useState } from 'react'
import { useStore, formatPrice } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Plus, DollarSign, ShoppingBag, TrendingUp, Eye, Loader2,
  Sparkles, Wallet, Store, Megaphone, Settings,
  Star, Clock, ArrowUpRight, ArrowDownRight, Users, BarChart3,
  AlertTriangle, Target, Zap, Award, Repeat, CreditCard,
  TrendingDown, Hash, UserCheck, DollarSign as DollarIcon,
  ShoppingCart, Activity, Receipt,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { SellerOnboarding } from '@/components/SellerOnboarding'

const DOW_COLORS = ['#0066CC', '#FF6600', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4'];

function ChangeBadge({ value, label }: { value: number; label: string }) {
  const isPositive = value >= 0;
  return (
    <Badge className={`${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} border-0 text-[10px] ml-1`}>
      {isPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
      {Math.abs(value).toFixed(1)}% {label}
    </Badge>
  );
}

export default function SellerDashboardPage() {
  const { user, prompts, fetchPrompts, fetchOrders, orders, selectedCurrency } = useStore()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  useEffect(() => {
    if (user?.isSeller) {
      Promise.all([
        fetchPrompts({ sellerId: user.id }),
        fetchOrders('sales'),
        fetch('/api/seller/analytics').then(r => r.json()).then(d => { if (d.success) setAnalytics(d.data); }).catch(e => { console.error('[seller] analytics error', e); toast.error('Failed to load analytics') }).finally(() => setAnalyticsLoading(false)),
        fetch('/api/orders?type=sold').then(r => r.json()).then(d => { if (d.success) setRecentOrders(d.data.slice(0, 10)); }).catch(e => { console.error('[seller] fetch orders', e); }).finally(() => setOrdersLoading(false)),
      ]).finally(() => setLoading(false))
    } else {
      Promise.resolve().then(() => setLoading(false))
    }
  }, [user])

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-700">Sign in to access seller dashboard</h2>
        <Button className="mt-4 bg-[#0066CC] text-white" onClick={() => useStore.getState().setShowAuthModal(true)}>Sign In</Button>
      </div>
    )
  }

  if (!user.isSeller) {
    return <SellerOnboarding />
  }

  const totalEarnings = orders.reduce((sum, o) => sum + o.sellerAmount, 0)
  const totalSales = orders.length
  const activeListings = prompts.length
  const totalViews = prompts.reduce((s, p) => s + p.viewCount, 0)

  const a = analytics?.summary
  const dailySales = analytics?.dailySales || []
  const topPrompts = analytics?.topPrompts || prompts.slice(0, 5).sort((a: any, b: any) => b.downloadCount - a.downloadCount)
  const paymentMethods = analytics?.paymentBreakdown || []
  const aiRecs = analytics?.recommendations
  const forecast = analytics?.forecast || []
  const anomalies = analytics?.anomalies || []
  const productHeatmap = analytics?.productHeatmap || []
  const salesVelocity = analytics?.salesVelocity || {}
  const customerInsights = analytics?.customerInsights || {}
  const pricingInsights = analytics?.pricingInsights || []
  const periodComparison = analytics?.periodComparison || {}
  const trendingKeywords = analytics?.trendingKeywords || []
  const refundBreakdown = analytics?.refundBreakdown || []

  const convRate = totalViews > 0 ? ((a?.totalSales || totalSales) / (a?.totalViews || totalViews) * 100).toFixed(1) : '0';

  const chartData = [
    ...(Array.isArray(dailySales) ? dailySales.map((d: any) => ({ ...d, predicted: null, lowerBound: null, upperBound: null })) : []),
    ...forecast.map((f: any) => ({ date: f.date, revenue: null, count: null, predicted: f.predicted, lowerBound: f.lowerBound, upperBound: f.upperBound })),
  ];

  const statsCards = [
    {
      label: 'Net Revenue',
      value: formatPrice(a?.totalRevenue || totalEarnings, selectedCurrency),
      icon: DollarSign,
      color: 'text-green-600',
      sub: a ? `${(a.totalRevenue || 0).toFixed(2)} USD` : undefined,
      badge: periodComparison.revenueChange !== undefined ? <ChangeBadge value={periodComparison.revenueChange} label="vs prev period" /> : null,
    },
    {
      label: 'Units Sold',
      value: String(a?.totalSales || totalSales),
      icon: ShoppingBag,
      color: 'text-[#FF6600]',
      sub: undefined,
      badge: periodComparison.salesChange !== undefined ? <ChangeBadge value={periodComparison.salesChange} label="vs prev period" /> : null,
    },
    {
      label: 'Impressions',
      value: String(a?.totalViews || totalViews),
      icon: Eye,
      color: 'text-amber-500',
      sub: `${convRate}% conv.`,
      badge: null,
    },
    {
      label: 'Avg. Rating',
      value: a?.avgRating ? `${a.avgRating}/5` : 'N/A',
      icon: Star,
      color: 'text-yellow-500',
      sub: `${a?.promptsCount || activeListings} listings`,
      badge: a?.repeatBuyerRate !== undefined ? (
        <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px] ml-1">
          <Repeat className="h-3 w-3 mr-0.5" />
          {a.repeatBuyerRate}% repeat
        </Badge>
      ) : null,
    },
  ]

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-[#0066CC] mx-auto" /></div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight">MAGHGO</span>
            <Badge variant="secondary" className="bg-[#FF6600] text-white hover:bg-[#FF6600] border-0 text-[10px] uppercase font-bold tracking-wider rounded-sm">Seller Central</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="text-slate-300 hidden sm:inline">Store: {user.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <Button variant="ghost" className="w-full justify-start bg-white shadow-sm border border-slate-200 text-[#0066CC] font-bold">
            <BarChart3 className="h-4 w-4 mr-3" /> Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-600 hover:bg-slate-200/50 hover:text-slate-900" asChild>
            <Link href="/seller/upload"><Sparkles className="h-4 w-4 mr-3" /> Upload Prompt</Link>
          </Button>
          <Link href="/seller/payouts">
            <Button variant="ghost" className="w-full justify-start text-slate-600 hover:bg-slate-200/50 hover:text-slate-900">
              <Wallet className="h-4 w-4 mr-3" /> Payouts
            </Button>
          </Link>
        </div>

        {/* Main */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Seller Analytics Dashboard</h1>
              <p className="text-slate-500 text-sm mt-1">Enterprise-grade business intelligence for your store.</p>
            </div>
            <Link href="/seller/upload">
              <Button className="bg-[#FF6600] hover:bg-[#E65C00] text-white shadow-md shadow-[#FF6600]/20 font-bold h-11 px-6 rounded-full">
                <Plus className="h-5 w-5 mr-2" /> New Product
              </Button>
            </Link>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map(s => (
              <Card key={s.label} className="p-5 border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className={`h-10 w-10 rounded-full ${s.color.replace('text', 'bg')}/10 flex items-center justify-center`}>
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <div className="flex items-center gap-1">
                      {s.sub && <span className="text-[10px] text-muted-foreground">{s.sub}</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <p className="font-black text-slate-900 text-2xl">{s.value}</p>
                      {s.badge}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Sales Chart with Forecast */}
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Sales Revenue & Forecast (30d actual + 14d predicted)
              </h2>
              {forecast.length > 0 && (
                <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">
                  <Target className="h-3 w-3 mr-0.5" />
                  ${forecast.reduce((s: number, f: any) => s + f.predicted, 0).toFixed(0)} projected
                </Badge>
              )}
            </div>
            <div className="p-6">
              {chartData.length === 0 || chartData.every((d: any) => !d.revenue && !d.predicted) ? (
                <div className="h-[250px] flex items-center justify-center text-sm text-slate-400">No sales data yet. List your first prompt!</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0066CC" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0066CC" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.max(1, Math.floor(chartData.length / 8))} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <RTooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(value: any, name: string) => {
                        if (name === 'revenue') return [`$${value?.toFixed(2) || '0.00'}`, 'Revenue'];
                        if (name === 'predicted') return [`$${value?.toFixed(2) || '0.00'}`, 'Forecast'];
                        if (name === 'lowerBound') return [`$${value?.toFixed(2) || '0.00'}`, 'Lower Bound'];
                        if (name === 'upperBound') return [`$${value?.toFixed(2) || '0.00'}`, 'Upper Bound'];
                        return [value, name];
                      }}
                    />
                    <Legend iconType="rect" fontSize={11} />
                    <Bar dataKey="revenue" fill="#10B981" name="revenue" radius={[3, 3, 0, 0]} maxBarSize={20} />
                    <Line dataKey="predicted" stroke="#0066CC" strokeWidth={2} strokeDasharray="6 3" name="predicted" dot={false} connectNulls />
                    <Area type="monotone" dataKey="upperBound" fill="#0066CC" fillOpacity={0.06} stroke="none" name="upperBound" connectNulls />
                    <Area type="monotone" dataKey="lowerBound" fill="#0066CC" fillOpacity={0.06} stroke="none" name="lowerBound" connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Anomaly Alerts */}
          {anomalies.length > 0 && (
            <Card className="border-amber-200 shadow-sm bg-amber-50/50 overflow-hidden">
              <div className="p-4 border-b border-amber-200 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h2 className="font-bold text-amber-800 text-sm">Anomaly Alerts — Unusual Sales Activity Detected</h2>
                <Badge className="bg-amber-200 text-amber-800 border-0 ml-auto">{anomalies.length} anomaly(ies)</Badge>
              </div>
              <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {anomalies.map((an: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl p-3 border border-amber-100 shadow-sm">
                    <p className="text-xs text-slate-400">{an.date}</p>
                    <p className="font-bold text-slate-900 text-lg">${an.revenue.toFixed(2)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Zap className="h-3 w-3 text-amber-500" />
                      <span className="text-[10px] text-amber-600 font-medium">Z-score: {an.zScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Customer Insights + Sales Velocity */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-bold text-slate-800 flex items-center gap-2"><Users className="h-5 w-5 text-purple-500" /> Customer Insights</h2>
              </div>
              <div className="p-5">
                {customerInsights.totalBuyers > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Total Buyers</p>
                      <p className="font-black text-slate-900 text-xl mt-1">{customerInsights.totalBuyers}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Repeat Buyers</p>
                      <p className="font-black text-slate-900 text-xl mt-1">{customerInsights.repeatBuyers}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Avg Spend</p>
                      <p className="font-black text-slate-900 text-xl mt-1">{formatPrice(customerInsights.avgCustomerSpend, selectedCurrency)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Top Buyer</p>
                      <p className="font-semibold text-slate-900 text-sm mt-1 truncate">{customerInsights.topBuyer?.name || 'N/A'}</p>
                      {customerInsights.topBuyer && (
                        <p className="text-[10px] text-slate-400 truncate">{formatPrice(customerInsights.topBuyer.totalSpent, selectedCurrency)}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-[100px] flex items-center justify-center text-sm text-slate-400">No customer data yet.</div>
                )}
              </div>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-bold text-slate-800 flex items-center gap-2"><Activity className="h-5 w-5 text-emerald-500" /> Sales Velocity</h2>
              </div>
              <div className="p-5">
                {salesVelocity.avgDaysToFirstSale !== null && salesVelocity.avgDaysToFirstSale !== undefined ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Avg Days to First Sale</p>
                      <p className="font-black text-slate-900 text-xl mt-1">{salesVelocity.avgDaysToFirstSale}d</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Best Selling Day</p>
                      <p className="font-black text-slate-900 text-xl mt-1">{salesVelocity.bestSellingDay}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Avg Sales/Day</p>
                      <p className="font-black text-slate-900 text-xl mt-1">{salesVelocity.avgSalesPerDay}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Products with Sales</p>
                      <p className="font-black text-slate-900 text-xl mt-1">{salesVelocity.velocityByPrompt?.length || 0}</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-[100px] flex items-center justify-center text-sm text-slate-400">Not enough data yet.</div>
                )}
              </div>
            </Card>
          </div>

          {/* Top Prompts + Payment Breakdown */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-bold text-slate-800 flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#0066CC]"/> Top Performing Prompts</h2>
              </div>
              <div className="p-6">
                {topPrompts.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No prompts yet</p>
                    <Link href="/seller/upload"><Button className="mt-4 bg-[#0066CC] text-sm h-9">Create Listing</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topPrompts.slice(0, 5).map((p: any, i: number) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/80 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-xs font-mono text-slate-400 w-5">{i + 1}</span>
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#0066CC]/10 to-[#FF6600]/10 flex items-center justify-center shrink-0">
                            <Sparkles className="h-5 w-5 text-[#0066CC]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-800 truncate">{p.title}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span>{p.isFree ? 'Free' : formatPrice(p.price, selectedCurrency)}</span>
                              <span>·</span>
                              <span><Eye className="h-3 w-3 inline mr-0.5"/>{p.views || p.viewCount || 0}</span>
                              <span>·</span>
                              <span><ShoppingBag className="h-3 w-3 inline mr-0.5"/>{p.downloads || 0}</span>
                              {p.rating > 0 && <><span>·</span><span><Star className="h-3 w-3 inline mr-0.5 text-yellow-500"/>{p.rating}</span></>}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] uppercase shrink-0 ${p.status === 'APPROVED' ? 'text-green-600 border-green-200 bg-green-50' : 'text-amber-600 border-amber-200 bg-amber-50'}`}>
                          {p.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-bold text-slate-800 flex items-center gap-2"><Wallet className="h-5 w-5 text-emerald-500" /> Revenue Breakdown</h2>
              </div>
              <div className="p-6">
                {paymentMethods.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">No payment data yet</div>
                ) : (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie data={paymentMethods} dataKey="revenue" nameKey="method" cx="50%" cy="50%" outerRadius={50} innerRadius={30}>
                          {paymentMethods.map((_: any, i: number) => <Cell key={i} fill={DOW_COLORS[i % DOW_COLORS.length]} />)}
                        </Pie>
                        <RTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    {paymentMethods.map((pm: any) => (
                      <div key={pm.method} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-sm">
                        <span className="font-medium">{pm.method}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">{pm.count} sales</span>
                          <span className="font-semibold text-emerald-600">{formatPrice(pm.revenue, selectedCurrency)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Product Heatmap Table */}
          {productHeatmap.length > 0 && (
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#0066CC]" /> Product Performance Heatmap
                </h2>
                <Badge className="bg-slate-100 text-slate-600 border-0">{productHeatmap.length} products</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Product</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Price</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Views</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Downloads</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Revenue</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Rating</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Velocity</th>
                      <th className="text-left p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Best Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productHeatmap.map((ph: any) => {
                      const promptData = prompts.find((p: any) => p.id === ph.promptId);
                      return (
                        <tr key={ph.promptId} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-medium text-slate-800 truncate max-w-[180px]">{ph.title}</td>
                          <td className="p-3 text-right text-slate-600">{promptData ? formatPrice(promptData.price, selectedCurrency) : '-'}</td>
                          <td className="p-3 text-right text-slate-600">{promptData?.viewCount || 0}</td>
                          <td className="p-3 text-right text-slate-600">{promptData?.downloadCount || 0}</td>
                          <td className="p-3 text-right font-semibold text-emerald-600">{formatPrice(ph.totalRevenue, selectedCurrency)}</td>
                          <td className="p-3 text-right">
                            {promptData && promptData.rating > 0 ? (
                              <span className="flex items-center justify-end gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                {promptData.rating}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-3 text-right">
                            {(() => {
                              const sv = salesVelocity.velocityByPrompt?.find((v: any) => v.promptId === ph.promptId);
                              return sv ? (
                                <span className="text-[11px] font-medium text-slate-600">{sv.daysToFirstSale}d</span>
                              ) : (
                                <span className="text-[11px] text-slate-400">-</span>
                              );
                            })()}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              {ph.bestDay?.slice(0, 2).map((bd: any, bi: number) => (
                                <Badge key={bi} variant="outline" className="text-[9px] border-slate-200 text-slate-500 font-normal">
                                  {bd.day} ({bd.count})
                                </Badge>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Pricing Insights Table */}
          {pricingInsights.length > 0 && (
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <Target className="h-5 w-5 text-[#FF6600]" />
                <h2 className="font-bold text-slate-800">Pricing Optimization Insights</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Product</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Your Price</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Category Avg</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Suggested Price</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Downloads</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Potential Uplift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingInsights.map((pi: any) => (
                      <tr key={pi.promptId} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-medium text-slate-800 truncate max-w-[200px]">{pi.title}</td>
                        <td className="p-3 text-right font-medium">{formatPrice(pi.currentPrice, selectedCurrency)}</td>
                        <td className="p-3 text-right text-slate-500">{pi.categoryAvg > 0 ? formatPrice(pi.categoryAvg, selectedCurrency) : 'N/A'}</td>
                        <td className="p-3 text-right">
                          {pi.suggestedPrice !== pi.currentPrice ? (
                            <span className="font-semibold text-[#0066CC]">{formatPrice(pi.suggestedPrice, selectedCurrency)}</span>
                          ) : (
                            <span className="text-slate-400">{formatPrice(pi.suggestedPrice, selectedCurrency)}</span>
                          )}
                        </td>
                        <td className="p-3 text-right text-slate-600">{pi.downloads}</td>
                        <td className="p-3 text-right">
                          {pi.potentialRevenueUplift > 0 ? (
                            <span className="font-semibold text-emerald-600">+{formatPrice(pi.potentialRevenueUplift, selectedCurrency)}</span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Optimized</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Trending Keywords */}
          {trendingKeywords.length > 0 && (
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <Hash className="h-5 w-5 text-purple-500" />
                <h2 className="font-bold text-slate-800">Trending Keywords in Your Store</h2>
              </div>
              <div className="p-6 flex flex-wrap gap-2">
                {trendingKeywords.map((kw: any, i: number) => (
                  <Badge key={i} className="bg-purple-50 text-purple-700 border border-purple-200 text-xs px-3 py-1.5 font-medium">
                    {kw.word}
                    <span className="ml-1.5 text-[10px] text-purple-400">x{kw.count}</span>
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Refund / Cancellation Breakdown */}
          {refundBreakdown.length > 0 && (
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <h2 className="font-bold text-slate-800">Refund & Cancellation Breakdown</h2>
                <Badge className="bg-red-100 text-red-700 border-0 ml-auto">{a?.refundRate || 0}% rate</Badge>
              </div>
              <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {refundBreakdown.map((rb: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-red-50/50 border border-red-100">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{rb.status}</p>
                    <p className="font-black text-slate-900 text-xl mt-1">{rb.count}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* AI Recommendations */}
          {aiRecs && (
            <Card className="border-slate-200 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden">
              <div className="p-6 border-b border-blue-100">
                <h2 className="font-bold text-slate-800 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-purple-500" /> AI-Powered Market Insights</h2>
                <p className="text-xs text-slate-500 mt-1">Trending prompts to inspire your next listing</p>
              </div>
              <div className="p-6 grid grid-cols-2 lg:grid-cols-5 gap-3">
                {Array.isArray(aiRecs) && aiRecs.slice(0, 5).map((rec: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-white border border-blue-100 text-center">
                    <p className="text-lg font-bold text-[#0066CC]">#{i + 1}</p>
                    <p className="text-xs font-medium truncate mt-1">{rec.title || rec.query || 'Trending'}</p>
                    {rec.score && <p className="text-[10px] text-slate-400 mt-1">Score: {Math.round(rec.score * 100)}%</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Orders with Fee Breakdown */}
          <Card className="border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-[#0066CC]" /> Recent Orders — Fee Breakdown
              </h2>
            </div>
            <div className="p-5">
              {ordersLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> :
               recentOrders.length === 0 ? <p className="text-center text-slate-400 py-8 text-sm">No sales yet</p> :
               <div className="overflow-x-auto">
                 <table className="w-full text-xs">
                   <thead>
                     <tr className="text-slate-500 border-b text-left">
                       <th className="pb-2 pr-2 font-medium">Order</th>
                       <th className="pb-2 pr-2 font-medium">Prompt</th>
                       <th className="pb-2 pr-2 font-medium text-right">Gross</th>
                       <th className="pb-2 pr-2 font-medium text-right">Commission</th>
                       <th className="pb-2 pr-2 font-medium text-right">GST</th>
                       <th className="pb-2 pr-2 font-medium text-right">Closing</th>
                       <th className="pb-2 pr-2 font-medium text-right">Payment</th>
                       <th className="pb-2 font-medium text-right text-emerald-600">Net</th>
                     </tr>
                   </thead>
                   <tbody>
                     {recentOrders.map((o: any) => (
                       <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                         <td className="py-2.5 pr-2 font-mono text-[10px]">{o.orderId || o.id}</td>
                         <td className="py-2.5 pr-2 max-w-[120px] truncate">{o.prompt?.title}</td>
                         <td className="py-2.5 pr-2 text-right font-medium">${(o.amount || 0).toFixed(2)}</td>
                         <td className="py-2.5 pr-2 text-right text-red-500">-${(o.commissionAmt || 0).toFixed(2)}</td>
                         <td className="py-2.5 pr-2 text-right text-amber-500">-${(o.gstAmt || 0).toFixed(2)}</td>
                         <td className="py-2.5 pr-2 text-right text-purple-500">-${(o.closingFee || 0).toFixed(2)}</td>
                         <td className="py-2.5 pr-2 text-right text-orange-500">-${(o.paymentFeeAmt || 0).toFixed(2)}</td>
                         <td className="py-2.5 text-right font-bold text-emerald-600">${(o.netAmount || 0).toFixed(2)}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
              }
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
