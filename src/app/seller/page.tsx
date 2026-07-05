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
import dynamic from 'next/dynamic'

const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const ComposedChart = dynamic(() => import('recharts').then(m => m.ComposedChart), { ssr: false })
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const RTooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false })
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false })
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false })
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false })
const Legend = dynamic(() => import('recharts').then(m => m.Legend), { ssr: false })

import { SellerOnboarding } from '@/components/SellerOnboarding'

const DOW_COLORS = ['#00d2ff', '#ff0080', '#00ffaa', '#8a2be2', '#f59e0b', '#06B6D4', '#a855f7'];

function ChangeBadge({ value, label }: { value: number; label: string }) {
  const isPositive = value >= 0;
  return (
    <Badge className={`${isPositive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30'} text-[10px] ml-1`}>
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
      <div className="max-w-4xl mx-auto px-4 py-20 text-center glass-panel border-white/10 rounded-3xl mt-12 relative z-10">
        <h2 className="text-2xl font-bold text-white">Sign in to access seller dashboard</h2>
        <Button className="mt-6 bg-neon-blue hover:bg-neon-blue/80 text-black font-bold h-12 px-8 rounded-full shadow-[0_0_15px_rgba(0,210,255,0.5)] transition-all" onClick={() => useStore.getState().setShowAuthModal(true)}>Sign In</Button>
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
      color: 'text-emerald-400',
      sub: a ? `${(a.totalRevenue || 0).toFixed(2)} USD` : undefined,
      badge: periodComparison.revenueChange !== undefined ? <ChangeBadge value={periodComparison.revenueChange} label="vs prev period" /> : null,
    },
    {
      label: 'Units Sold',
      value: String(a?.totalSales || totalSales),
      icon: ShoppingBag,
      color: 'text-neon-pink',
      sub: undefined,
      badge: periodComparison.salesChange !== undefined ? <ChangeBadge value={periodComparison.salesChange} label="vs prev period" /> : null,
    },
    {
      label: 'Impressions',
      value: String(a?.totalViews || totalViews),
      icon: Eye,
      color: 'text-amber-400',
      sub: `${convRate}% conv.`,
      badge: null,
    },
    {
      label: 'Avg. Rating',
      value: a?.avgRating ? `${a.avgRating}/5` : 'N/A',
      icon: Star,
      color: 'text-amber-400',
      sub: `${a?.promptsCount || activeListings} listings`,
      badge: a?.repeatBuyerRate !== undefined ? (
        <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] ml-1">
          <Repeat className="h-3 w-3 mr-0.5" />
          {a.repeatBuyerRate}% repeat
        </Badge>
      ) : null,
    },
  ]

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-20 text-center relative z-10"><Loader2 className="h-8 w-8 animate-spin text-neon-blue mx-auto" /></div>
  }

  return (
    <div className="min-h-screen relative z-10">
      <div className="bg-black/60 backdrop-blur-xl text-white border-b border-white/10 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-extrabold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">MAGHGO</span>
            <Badge variant="secondary" className="bg-neon-pink text-white hover:bg-neon-pink/80 border-0 text-[10px] uppercase font-bold tracking-wider rounded-full shadow-[0_0_10px_rgba(255,0,128,0.4)]">Seller Central</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="text-white/60 hidden sm:inline">Store: {user.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <Button variant="ghost" className="w-full justify-start glass-panel-heavy border border-neon-blue/30 text-neon-blue font-bold shadow-[0_0_10px_rgba(0,210,255,0.2)] rounded-xl">
            <BarChart3 className="h-4 w-4 mr-3" /> Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white/60 hover:bg-white/5 hover:text-white rounded-xl" asChild>
            <Link href="/seller/upload"><Sparkles className="h-4 w-4 mr-3" /> Upload Prompt</Link>
          </Button>
          <Link href="/seller/payouts">
            <Button variant="ghost" className="w-full justify-start text-white/60 hover:bg-white/5 hover:text-white rounded-xl">
              <Wallet className="h-4 w-4 mr-3" /> Payouts
            </Button>
          </Link>
          <Link href="/seller/wallet">
            <Button variant="ghost" className="w-full justify-start text-white/60 hover:bg-white/5 hover:text-white rounded-xl">
              <Wallet className="h-4 w-4 mr-3" /> Wallet
            </Button>
          </Link>
        </div>

        {/* Main */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex items-center justify-between glass-panel-heavy border border-white/10 p-6 rounded-3xl">
            <div>
              <h1 className="text-2xl font-extrabold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Seller Analytics Dashboard</h1>
              <p className="text-white/50 text-sm mt-1">Enterprise-grade business intelligence for your store.</p>
            </div>
            <Link href="/seller/upload">
              <Button className="bg-neon-pink hover:bg-neon-pink/80 text-white shadow-md shadow-[rgba(255,0,128,0.3)] font-bold h-11 px-6 rounded-full">
                <Plus className="h-5 w-5 mr-2" /> New Product
              </Button>
            </Link>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map(s => (
              <Card key={s.label} className="p-5 glass-panel border-white/10 rounded-3xl hover:bg-white/5 transition-all">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                      <s.icon className={`h-5 w-5 ${s.color} drop-shadow-[0_0_5px_currentColor]`} />
                    </div>
                    <div className="flex items-center gap-1">
                      {s.sub && <span className="text-[10px] text-white/40">{s.sub}</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/50 uppercase tracking-widest">{s.label}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <p className="font-black text-white text-2xl">{s.value}</p>
                      {s.badge}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Sales Chart with Forecast */}
          <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-black/40 flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]" />
                Sales Revenue & Forecast (30d actual + 14d predicted)
              </h2>
              {forecast.length > 0 && (
                <Badge className="bg-neon-blue/20 text-neon-blue border border-neon-blue/30 text-[10px]">
                  <Target className="h-3 w-3 mr-0.5" />
                  ${forecast.reduce((s: number, f: any) => s + f.predicted, 0).toFixed(0)} projected
                </Badge>
              )}
            </div>
            <div className="p-6">
              {chartData.length === 0 || chartData.every((d: any) => !d.revenue && !d.predicted) ? (
                <div className="h-[250px] flex items-center justify-center text-sm text-white/40">No sales data yet. List your first prompt!</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#00d2ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} interval={Math.max(1, Math.floor(chartData.length / 8))} />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                    <RTooltip
                      contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white' }}
                      formatter={(value: any, name: string) => {
                        if (name === 'revenue') return [`$${value?.toFixed(2) || '0.00'}`, 'Revenue'];
                        if (name === 'predicted') return [`$${value?.toFixed(2) || '0.00'}`, 'Forecast'];
                        if (name === 'lowerBound') return [`$${value?.toFixed(2) || '0.00'}`, 'Lower Bound'];
                        if (name === 'upperBound') return [`$${value?.toFixed(2) || '0.00'}`, 'Upper Bound'];
                        return [value, name];
                      }}
                    />
                    <Legend iconType="rect" fontSize={11} />
                    <Bar dataKey="revenue" fill="#00ffaa" name="revenue" radius={[3, 3, 0, 0]} maxBarSize={20} />
                    <Line dataKey="predicted" stroke="#00d2ff" strokeWidth={2} strokeDasharray="6 3" name="predicted" dot={false} connectNulls />
                    <Area type="monotone" dataKey="upperBound" fill="#00d2ff" fillOpacity={0.06} stroke="none" name="upperBound" connectNulls />
                    <Area type="monotone" dataKey="lowerBound" fill="#00d2ff" fillOpacity={0.06} stroke="none" name="lowerBound" connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Anomaly Alerts */}
          {anomalies.length > 0 && (
            <Card className="glass-panel border-amber-400/30 rounded-3xl overflow-hidden">
              <div className="p-4 border-b border-amber-400/20 bg-amber-500/10 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                <h2 className="font-bold text-white text-sm">Anomaly Alerts — Unusual Sales Activity Detected</h2>
                <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 ml-auto">{anomalies.length} anomaly(ies)</Badge>
              </div>
              <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {anomalies.map((an: any, i: number) => (
                  <div key={i} className="glass-panel border border-white/10 rounded-xl p-3">
                    <p className="text-xs text-white/40">{an.date}</p>
                    <p className="font-bold text-white text-lg">${an.revenue.toFixed(2)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Zap className="h-3 w-3 text-amber-400" />
                      <span className="text-[10px] text-amber-400 font-medium">Z-score: {an.zScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Customer Insights + Sales Velocity */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden">
              <div className="p-5 border-b border-white/10 bg-black/40">
                <h2 className="font-bold text-white flex items-center gap-2"><Users className="h-5 w-5 text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]" /> Customer Insights</h2>
              </div>
              <div className="p-5">
                {customerInsights.totalBuyers > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl glass-panel border border-white/10">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Total Buyers</p>
                      <p className="font-black text-white text-xl mt-1">{customerInsights.totalBuyers}</p>
                    </div>
                    <div className="p-3 rounded-xl glass-panel border border-white/10">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Repeat Buyers</p>
                      <p className="font-black text-white text-xl mt-1">{customerInsights.repeatBuyers}</p>
                    </div>
                    <div className="p-3 rounded-xl glass-panel border border-white/10">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Avg Spend</p>
                      <p className="font-black text-white text-xl mt-1">{formatPrice(customerInsights.avgCustomerSpend, selectedCurrency)}</p>
                    </div>
                    <div className="p-3 rounded-xl glass-panel border border-white/10">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Top Buyer</p>
                      <p className="font-semibold text-white text-sm mt-1 truncate">{customerInsights.topBuyer?.name || 'N/A'}</p>
                      {customerInsights.topBuyer && (
                        <p className="text-[10px] text-white/40 truncate">{formatPrice(customerInsights.topBuyer.totalSpent, selectedCurrency)}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-[100px] flex items-center justify-center text-sm text-white/40">No customer data yet.</div>
                )}
              </div>
            </Card>

            <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden">
              <div className="p-5 border-b border-white/10 bg-black/40">
                <h2 className="font-bold text-white flex items-center gap-2"><Activity className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]" /> Sales Velocity</h2>
              </div>
              <div className="p-5">
                {salesVelocity.avgDaysToFirstSale !== null && salesVelocity.avgDaysToFirstSale !== undefined ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl glass-panel border border-white/10">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Avg Days to First Sale</p>
                      <p className="font-black text-white text-xl mt-1">{salesVelocity.avgDaysToFirstSale}d</p>
                    </div>
                    <div className="p-3 rounded-xl glass-panel border border-white/10">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Best Selling Day</p>
                      <p className="font-black text-white text-xl mt-1">{salesVelocity.bestSellingDay}</p>
                    </div>
                    <div className="p-3 rounded-xl glass-panel border border-white/10">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Avg Sales/Day</p>
                      <p className="font-black text-white text-xl mt-1">{salesVelocity.avgSalesPerDay}</p>
                    </div>
                    <div className="p-3 rounded-xl glass-panel border border-white/10">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Products with Sales</p>
                      <p className="font-black text-white text-xl mt-1">{salesVelocity.velocityByPrompt?.length || 0}</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-[100px] flex items-center justify-center text-sm text-white/40">Not enough data yet.</div>
                )}
              </div>
            </Card>
          </div>

          {/* Top Prompts + Payment Breakdown */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-white/10 bg-black/40">
                <h2 className="font-bold text-white flex items-center gap-2"><Sparkles className="h-5 w-5 text-neon-blue drop-shadow-[0_0_5px_rgba(0,210,255,0.5)]"/> Top Performing Prompts</h2>
              </div>
              <div className="p-6">
                {topPrompts.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-10 w-10 text-white/20 mx-auto mb-3" />
                    <p className="text-white/50 text-sm">No prompts yet</p>
                    <Link href="/seller/upload"><Button className="mt-4 bg-neon-blue text-black text-sm h-9 font-bold rounded-full">Create Listing</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topPrompts.slice(0, 5).map((p: any, i: number) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-xl glass-panel border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-xs font-mono text-white/30 w-5">{i + 1}</span>
                          <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <Sparkles className="h-5 w-5 text-neon-blue/50" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-white truncate">{p.title}</p>
                            <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
                              <span>{p.isFree ? 'Free' : formatPrice(p.price, selectedCurrency)}</span>
                              <span>·</span>
                              <span><Eye className="h-3 w-3 inline mr-0.5"/>{p.views || p.viewCount || 0}</span>
                              <span>·</span>
                              <span><ShoppingBag className="h-3 w-3 inline mr-0.5"/>{p.downloads || 0}</span>
                              {p.rating > 0 && <><span>·</span><span><Star className="h-3 w-3 inline mr-0.5 text-amber-400"/>{p.rating}</span></>}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] uppercase shrink-0 ${p.status === 'APPROVED' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/20' : 'text-amber-400 border-amber-500/30 bg-amber-500/20'}`}>
                          {p.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-white/10 bg-black/40">
                <h2 className="font-bold text-white flex items-center gap-2"><Wallet className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]" /> Revenue Breakdown</h2>
              </div>
              <div className="p-6">
                {paymentMethods.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-sm text-white/40">No payment data yet</div>
                ) : (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie data={paymentMethods} dataKey="revenue" nameKey="method" cx="50%" cy="50%" outerRadius={50} innerRadius={30}>
                          {paymentMethods.map((_: any, i: number) => <Cell key={i} fill={DOW_COLORS[i % DOW_COLORS.length]} />)}
                        </Pie>
                        <RTooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    {paymentMethods.map((pm: any) => (
                      <div key={pm.method} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 text-sm transition-colors">
                        <span className="font-bold text-white">{pm.method}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-white/40">{pm.count} sales</span>
                          <span className="font-bold text-emerald-400">{formatPrice(pm.revenue, selectedCurrency)}</span>
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
            <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-white/10 bg-black/40 flex items-center justify-between">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-neon-blue drop-shadow-[0_0_5px_rgba(0,210,255,0.5)]" /> Product Performance Heatmap
                </h2>
                <Badge className="bg-white/10 text-white/70 border border-white/20">{productHeatmap.length} products</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/40 border-b border-white/10">
                      <th className="text-left p-3 text-[10px] uppercase tracking-widest text-white/50 font-bold">Product</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-white/50 font-bold">Price</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-white/50 font-bold">Views</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-white/50 font-bold">Downloads</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-white/50 font-bold">Revenue</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-white/50 font-bold">Rating</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-white/50 font-bold">Velocity</th>
                      <th className="text-left p-3 text-[10px] uppercase tracking-widest text-white/50 font-bold">Best Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productHeatmap.map((ph: any) => {
                      const promptData = prompts.find((p: any) => p.id === ph.promptId);
                      return (
                        <tr key={ph.promptId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-3 font-bold text-white truncate max-w-[180px]">{ph.title}</td>
                          <td className="p-3 text-right text-white/70">{promptData ? formatPrice(promptData.price, selectedCurrency) : '-'}</td>
                          <td className="p-3 text-right text-white/70">{promptData?.viewCount || 0}</td>
                          <td className="p-3 text-right text-white/70">{promptData?.downloadCount || 0}</td>
                          <td className="p-3 text-right font-bold text-emerald-400">{formatPrice(ph.totalRevenue, selectedCurrency)}</td>
                          <td className="p-3 text-right">
                            {promptData && promptData.rating > 0 ? (
                              <span className="flex items-center justify-end gap-1">
                                <Star className="h-3 w-3 text-amber-400" />
                                <span className="text-white">{promptData.rating}</span>
                              </span>
                            ) : <span className="text-white/30">-</span>}
                          </td>
                          <td className="p-3 text-right">
                            {(() => {
                              const sv = salesVelocity.velocityByPrompt?.find((v: any) => v.promptId === ph.promptId);
                              return sv ? (
                                <span className="text-[11px] font-bold text-white/70">{sv.daysToFirstSale}d</span>
                              ) : (
                                <span className="text-[11px] text-white/30">-</span>
                              );
                            })()}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              {ph.bestDay?.slice(0, 2).map((bd: any, bi: number) => (
                                <Badge key={bi} variant="outline" className="text-[9px] border-white/20 text-white/50 font-normal bg-white/5">
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
            <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-white/10 bg-black/40 flex items-center gap-2">
                <Target className="h-5 w-5 text-neon-pink drop-shadow-[0_0_5px_rgba(255,0,128,0.5)]" />
                <h2 className="font-bold text-white">Pricing Optimization Insights</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/40 border-b border-white/10">
                      <th className="text-left p-3 text-[10px] uppercase tracking-widest text-white/50 font-bold">Product</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-white/50 font-bold">Your Price</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-white/50 font-bold">Category Avg</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-white/50 font-bold">Suggested Price</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-white/50 font-bold">Downloads</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-white/50 font-bold">Potential Uplift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingInsights.map((pi: any) => (
                      <tr key={pi.promptId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-3 font-bold text-white truncate max-w-[200px]">{pi.title}</td>
                        <td className="p-3 text-right font-bold text-white">{formatPrice(pi.currentPrice, selectedCurrency)}</td>
                        <td className="p-3 text-right text-white/50">{pi.categoryAvg > 0 ? formatPrice(pi.categoryAvg, selectedCurrency) : 'N/A'}</td>
                        <td className="p-3 text-right">
                          {pi.suggestedPrice !== pi.currentPrice ? (
                            <span className="font-bold text-neon-blue drop-shadow-[0_0_5px_rgba(0,210,255,0.4)]">{formatPrice(pi.suggestedPrice, selectedCurrency)}</span>
                          ) : (
                            <span className="text-white/40">{formatPrice(pi.suggestedPrice, selectedCurrency)}</span>
                          )}
                        </td>
                        <td className="p-3 text-right text-white/70">{pi.downloads}</td>
                        <td className="p-3 text-right">
                          {pi.potentialRevenueUplift > 0 ? (
                            <span className="font-bold text-emerald-400">+{formatPrice(pi.potentialRevenueUplift, selectedCurrency)}</span>
                          ) : (
                            <span className="text-white/40 text-[11px]">Optimized</span>
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
            <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-white/10 bg-black/40 flex items-center gap-2">
                <Hash className="h-5 w-5 text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]" />
                <h2 className="font-bold text-white">Trending Keywords in Your Store</h2>
              </div>
              <div className="p-6 flex flex-wrap gap-2">
                {trendingKeywords.map((kw: any, i: number) => (
                  <Badge key={i} className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs px-3 py-1.5 font-bold">
                    {kw.word}
                    <span className="ml-1.5 text-[10px] text-purple-400/60">x{kw.count}</span>
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Refund / Cancellation Breakdown */}
          {refundBreakdown.length > 0 && (
            <Card className="glass-panel border-neon-pink/30 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-neon-pink/20 bg-neon-pink/5 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-neon-pink drop-shadow-[0_0_5px_rgba(255,0,128,0.5)]" />
                <h2 className="font-bold text-white">Refund & Cancellation Breakdown</h2>
                <Badge className="bg-neon-pink/20 text-neon-pink border border-neon-pink/30 ml-auto">{a?.refundRate || 0}% rate</Badge>
              </div>
              <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {refundBreakdown.map((rb: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl glass-panel border border-white/10">
                    <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{rb.status}</p>
                    <p className="font-black text-white text-xl mt-1">{rb.count}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* AI Recommendations */}
          {aiRecs && (
            <Card className="glass-panel-heavy border-neon-blue/20 rounded-3xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/5 to-purple-500/5 opacity-50" />
              <div className="relative z-10 p-6 border-b border-white/10">
                <h2 className="font-bold text-white flex items-center gap-2"><TrendingUp className="h-5 w-5 text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]" /> AI-Powered Market Insights</h2>
                <p className="text-xs text-white/50 mt-1">Trending prompts to inspire your next listing</p>
              </div>
              <div className="relative z-10 p-6 grid grid-cols-2 lg:grid-cols-5 gap-3">
                {Array.isArray(aiRecs) && aiRecs.slice(0, 5).map((rec: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl glass-panel border border-white/10 text-center hover:bg-white/5 transition-all">
                    <p className="text-lg font-black text-neon-blue drop-shadow-[0_0_5px_rgba(0,210,255,0.5)]">#{i + 1}</p>
                    <p className="text-xs font-bold text-white truncate mt-1">{rec.title || rec.query || 'Trending'}</p>
                    {rec.score && <p className="text-[10px] text-white/40 mt-1">Score: {Math.round(rec.score * 100)}%</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Orders with Fee Breakdown */}
          <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-white/10 bg-black/40">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-neon-blue drop-shadow-[0_0_5px_rgba(0,210,255,0.5)]" /> Recent Orders — Fee Breakdown
              </h2>
            </div>
            <div className="p-5">
              {ordersLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto text-neon-blue" /> :
               recentOrders.length === 0 ? <p className="text-center text-white/40 py-8 text-sm">No sales yet</p> :
               <div className="overflow-x-auto">
                 <table className="w-full text-xs">
                   <thead>
                     <tr className="text-white/50 border-b border-white/10 text-left">
                       <th className="pb-2 pr-2 font-bold uppercase tracking-widest text-[10px]">Order</th>
                       <th className="pb-2 pr-2 font-bold uppercase tracking-widest text-[10px]">Prompt</th>
                       <th className="pb-2 pr-2 font-bold uppercase tracking-widest text-[10px] text-right">Gross</th>
                       <th className="pb-2 pr-2 font-bold uppercase tracking-widest text-[10px] text-right">Commission</th>
                       <th className="pb-2 pr-2 font-bold uppercase tracking-widest text-[10px] text-right">GST</th>
                       <th className="pb-2 pr-2 font-bold uppercase tracking-widest text-[10px] text-right">Closing</th>
                       <th className="pb-2 pr-2 font-bold uppercase tracking-widest text-[10px] text-right">Payment</th>
                       <th className="pb-2 font-bold uppercase tracking-widest text-[10px] text-right text-emerald-400">Net</th>
                     </tr>
                   </thead>
                   <tbody>
                     {recentOrders.map((o: any) => (
                       <tr key={o.id} className="border-b border-white/5 hover:bg-white/5">
                         <td className="py-2.5 pr-2 font-mono text-[10px] text-white/60">{o.orderId || o.id}</td>
                         <td className="py-2.5 pr-2 max-w-[120px] truncate text-white">{o.prompt?.title}</td>
                         <td className="py-2.5 pr-2 text-right font-bold text-white">${(o.amount || 0).toFixed(2)}</td>
                         <td className="py-2.5 pr-2 text-right text-neon-pink">-${(o.commissionAmt || 0).toFixed(2)}</td>
                         <td className="py-2.5 pr-2 text-right text-amber-400">-${(o.gstAmt || 0).toFixed(2)}</td>
                         <td className="py-2.5 pr-2 text-right text-purple-400">-${(o.closingFee || 0).toFixed(2)}</td>
                         <td className="py-2.5 pr-2 text-right text-neon-pink/70">-${(o.paymentFeeAmt || 0).toFixed(2)}</td>
                         <td className="py-2.5 text-right font-black text-emerald-400">${(o.netAmount || 0).toFixed(2)}</td>
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
