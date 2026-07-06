'use client'

import { useEffect, useState } from 'react'
import { useStore, formatPrice } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Plus, DollarSign, ShoppingBag, TrendingUp, Eye, Loader2,
  Sparkles, Wallet,
  Star, ArrowUpRight, ArrowDownRight, Users, BarChart3,
  AlertTriangle, Target, Zap, Repeat,
  TrendingDown, Hash, Activity, Receipt,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  ComposedChart, Line, Area, Bar,
  XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts'

interface DailySale { date: string; revenue: number; count: number }
interface Forecast { date: string; predicted: number; lowerBound: number; upperBound: number }
interface Anomaly { date: string; revenue: number; zScore: number }
interface TopPrompt { id: string; title: string; price: number; isFree: boolean; status: string; views: number; downloads: number; rating: number; viewCount: number }
interface PaymentMethod { method: string; revenue: number; count: number }
interface ProductHeatmap { promptId: string; title: string; totalRevenue: number; bestDay: { day: string; count: number }[] }
interface VelocityByPrompt { promptId: string; daysToFirstSale: number }
interface PricingInsight { promptId: string; title: string; currentPrice: number; categoryAvg: number; suggestedPrice: number; downloads: number; potentialRevenueUplift: number }
interface TrendKeyword { word: string; count: number }
interface RefundBreakdown { status: string; count: number }
interface AiRec { title?: string; query?: string; score?: number }
interface CustomerInsights { totalBuyers: number; repeatBuyers: number; avgCustomerSpend: number; topBuyer?: { name: string; totalSpent: number } }
interface SalesVelocity { avgDaysToFirstSale: number | null; bestSellingDay: string; avgSalesPerDay: number; velocityByPrompt?: VelocityByPrompt[] }
interface PeriodComparison { revenueChange: number; salesChange: number }
interface AnalyticsSummary { totalRevenue?: number; totalSales?: number; totalViews?: number; avgRating?: number; promptsCount?: number; repeatBuyerRate?: number; refundRate?: number }
interface AnalyticsData {
  summary?: AnalyticsSummary
  dailySales?: DailySale[]
  topPrompts?: TopPrompt[]
  paymentBreakdown?: PaymentMethod[]
  recommendations?: AiRec[]
  forecast?: Forecast[]
  anomalies?: Anomaly[]
  productHeatmap?: ProductHeatmap[]
  salesVelocity?: SalesVelocity
  customerInsights?: CustomerInsights
  pricingInsights?: PricingInsight[]
  periodComparison?: PeriodComparison
  trendingKeywords?: TrendKeyword[]
  refundBreakdown?: RefundBreakdown[]
}

import { SellerOnboarding } from '@/components/SellerOnboarding'

const DOW_COLORS = ['#2874F0', '#FF9F00', '#388E3C', '#FB641B', '#7B1FA2', '#06B6D4', '#a855f7'];

function ChangeBadge({ value, label }: { value: number; label: string }) {
  const isPositive = value >= 0;
  return (
    <Badge className={`${isPositive ? 'bg-brand-green/10 text-brand-green border border-brand-green/20' : 'bg-destructive/10 text-destructive border border-destructive/20'} text-[10px] ml-1`}>
      {isPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
      {Math.abs(value).toFixed(1)}% {label}
    </Badge>
  );
}

export default function SellerDashboardPage() {
  const { user, prompts, fetchPrompts, fetchOrders, orders, selectedCurrency } = useStore()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  useEffect(() => {
    if (user?.isSeller) {
      Promise.all([
        fetchPrompts({ sellerId: user.id }),
        fetchOrders('sales'),
        fetch('/api/seller/analytics').then(r => r.json()).then(d => { if (d.success) setAnalytics(d.data); }).catch(e => { console.error('[seller] analytics error', e); toast.error('Failed to load analytics') }),
        fetch('/api/orders?type=sold').then(r => r.json()).then(d => { if (d.success) setRecentOrders(d.data.slice(0, 10)); }).catch(e => { console.error('[seller] fetch orders', e); }).finally(() => setOrdersLoading(false)),
      ]).finally(() => setLoading(false))
    } else {
      Promise.resolve().then(() => setLoading(false))
    }
  }, [user, fetchPrompts, fetchOrders])

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center mt-12">
        <div className="bg-card border-border rounded-sm p-8">
          <h2 className="text-2xl font-bold text-foreground">Sign in to access seller dashboard</h2>
          <Button className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-8 rounded-sm transition-all cursor-pointer" onClick={() => useStore.getState().setShowAuthModal(true)}>Sign In</Button>
        </div>
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
  const topPrompts = analytics?.topPrompts || prompts.slice(0, 5).sort((a, b) => b.downloadCount - a.downloadCount)
  const paymentMethods = analytics?.paymentBreakdown || []
  const aiRecs = analytics?.recommendations
  const forecast = analytics?.forecast || []
  const anomalies = analytics?.anomalies || []
  const productHeatmap = analytics?.productHeatmap || []
  const salesVelocity = analytics?.salesVelocity || {} as SalesVelocity
  const customerInsights = analytics?.customerInsights || {} as CustomerInsights
  const pricingInsights = analytics?.pricingInsights || []
  const periodComparison = analytics?.periodComparison || {} as PeriodComparison
  const trendingKeywords = analytics?.trendingKeywords || []
  const refundBreakdown = analytics?.refundBreakdown || []

  const convRate = totalViews > 0 ? ((a?.totalSales || totalSales) / (a?.totalViews || totalViews) * 100).toFixed(1) : '0';

  const chartData = [
    ...(Array.isArray(dailySales) ? dailySales.map((d: DailySale) => ({ ...d, predicted: null, lowerBound: null, upperBound: null })) : []),
    ...forecast.map((f: Forecast) => ({ date: f.date, revenue: null, count: null, predicted: f.predicted, lowerBound: f.lowerBound, upperBound: f.upperBound })),
  ];

  const statsCards = [
    {
      label: 'Net Revenue',
      value: formatPrice(a?.totalRevenue || totalEarnings, selectedCurrency),
      icon: DollarSign,
      color: 'text-brand-green',
      sub: a ? `${formatPrice(a.totalRevenue || 0, selectedCurrency)}` : undefined,
      badge: periodComparison.revenueChange !== undefined ? <ChangeBadge value={periodComparison.revenueChange} label="vs prev period" /> : null,
    },
    {
      label: 'Units Sold',
      value: String(a?.totalSales || totalSales),
      icon: ShoppingBag,
      color: 'text-accent',
      sub: undefined,
      badge: periodComparison.salesChange !== undefined ? <ChangeBadge value={periodComparison.salesChange} label="vs prev period" /> : null,
    },
    {
      label: 'Impressions',
      value: String(a?.totalViews || totalViews),
      icon: Eye,
      color: 'text-accent',
      sub: `${convRate}% conv.`,
      badge: null,
    },
    {
      label: 'Avg. Rating',
      value: a?.avgRating ? `${a.avgRating}/5` : 'N/A',
      icon: Star,
      color: 'text-accent',
      sub: `${a?.promptsCount || activeListings} listings`,
      badge: a?.repeatBuyerRate !== undefined ? (
        <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] ml-1">
          <Repeat className="h-3 w-3 mr-0.5" />
          {a.repeatBuyerRate}% repeat
        </Badge>
      ) : null,
    },
  ]

    if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
  }

  return (
    <div className="min-h-screen relative z-10">
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-extrabold tracking-tight text-foreground">MAGHGO</span>
            <Badge variant="secondary" className="bg-accent/10 text-accent hover:bg-accent/20 border-0 text-[10px] uppercase font-bold tracking-wider rounded-sm">Seller Central</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="text-muted-foreground hidden sm:inline">Store: {user.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <Button variant="ghost" className="w-full justify-start bg-card border border-primary/30 text-primary font-bold rounded-sm">
            <BarChart3 className="h-4 w-4 mr-3" /> Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-muted hover:text-foreground rounded-sm" asChild>
            <Link href="/seller/upload"><Sparkles className="h-4 w-4 mr-3" /> Upload Prompt</Link>
          </Button>
          <Link href="/seller/payouts">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-muted hover:text-foreground rounded-sm">
              <Wallet className="h-4 w-4 mr-3" /> Payouts
            </Button>
          </Link>
        </div>

        {/* Main */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex items-center justify-between bg-card border-border p-6 rounded-sm">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">Seller Analytics Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-1">Business intelligence for your store.</p>
            </div>
            <Link href="/seller/upload">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold h-11 px-6 rounded-sm cursor-pointer">
                <Plus className="h-5 w-5 mr-2" /> New Product
              </Button>
            </Link>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map(s => (
              <Card key={s.label} className="p-5 bg-card border-border rounded-sm transition-all">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-sm bg-muted flex items-center justify-center">
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <div className="flex items-center gap-1">
                      {s.sub && <span className="text-[10px] text-muted-foreground">{s.sub}</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <p className="font-black text-foreground text-2xl">{s.value}</p>
                      {s.badge}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Sales Chart with Forecast */}
          <Card className="bg-card border-border rounded-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted flex items-center justify-between">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#388E3C]" />
                Sales Revenue & Forecast (30d actual + 14d predicted)
              </h2>
              {forecast.length > 0 && (
                <Badge className="bg-[#2874F0]/10 text-[#2874F0] border border-[#2874F0]/20 text-[10px]">
                  <Target className="h-3 w-3 mr-0.5" />
                  {formatPrice(forecast.reduce((s: number, f: Forecast) => s + f.predicted, 0), selectedCurrency)} projected
                </Badge>
              )}
            </div>
            <div className="p-6">
              {chartData.length === 0 || chartData.every((d) => !d.revenue && !d.predicted) ? (
                <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">No sales data yet. List your first prompt!</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2874F0" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2874F0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={Math.max(1, Math.floor(chartData.length / 8))} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <RTooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                      formatter={(value: number, name: string) => {
                        if (name === 'revenue') return [formatPrice(value, selectedCurrency), 'Revenue'];
                        if (name === 'predicted') return [formatPrice(value, selectedCurrency), 'Forecast'];
                        if (name === 'lowerBound') return [formatPrice(value, selectedCurrency), 'Lower Bound'];
                        if (name === 'upperBound') return [formatPrice(value, selectedCurrency), 'Upper Bound'];
                        return [value, name];
                      }}
                    />
                    <Legend iconType="rect" fontSize={11} />
                    <Bar dataKey="revenue" fill="var(--color-brand-green)" name="revenue" radius={[3, 3, 0, 0]} maxBarSize={20} />
                    <Line dataKey="predicted" stroke="var(--color-brand-blue)" strokeWidth={2} strokeDasharray="6 3" name="predicted" dot={false} connectNulls />
                    <Area type="monotone" dataKey="upperBound" fill="var(--color-brand-blue)" fillOpacity={0.06} stroke="none" name="upperBound" connectNulls />
                    <Area type="monotone" dataKey="lowerBound" fill="var(--color-brand-blue)" fillOpacity={0.06} stroke="none" name="lowerBound" connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Anomaly Alerts */}
          {anomalies.length > 0 && (
            <Card className="bg-card border-accent/30 rounded-sm overflow-hidden">
              <div className="p-4 border-b border-accent/20 bg-accent/5 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-accent" />
                <h2 className="font-bold text-foreground text-sm">Anomaly Alerts — Unusual Sales Activity Detected</h2>
                <Badge className="bg-accent/10 text-accent border border-accent/20 ml-auto">{anomalies.length} anomaly(ies)</Badge>
              </div>
              <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {anomalies.map((an: Anomaly, i: number) => (
                  <div key={i} className="bg-card border-border rounded-sm p-3">
                    <p className="text-xs text-muted-foreground">{an.date}</p>
                    <p className="font-bold text-foreground text-lg">{formatPrice(an.revenue, selectedCurrency)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Zap className="h-3 w-3 text-accent" />
                      <span className="text-[10px] text-accent font-medium">Z-score: {an.zScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Customer Insights + Sales Velocity */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="bg-card border-border rounded-sm overflow-hidden">
              <div className="p-5 border-b border-border bg-muted">
                <h2 className="font-bold text-foreground flex items-center gap-2"><Users className="h-5 w-5 text-purple-400" /> Customer Insights</h2>
              </div>
              <div className="p-5">
                {customerInsights.totalBuyers > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-sm bg-card border-border">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total Buyers</p>
                      <p className="font-black text-foreground text-xl mt-1">{customerInsights.totalBuyers}</p>
                    </div>
                    <div className="p-3 rounded-sm bg-card border-border">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Repeat Buyers</p>
                      <p className="font-black text-foreground text-xl mt-1">{customerInsights.repeatBuyers}</p>
                    </div>
                    <div className="p-3 rounded-sm bg-card border-border">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Avg Spend</p>
                      <p className="font-black text-foreground text-xl mt-1">{formatPrice(customerInsights.avgCustomerSpend, selectedCurrency)}</p>
                    </div>
                    <div className="p-3 rounded-sm bg-card border-border">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Top Buyer</p>
                      <p className="font-semibold text-foreground text-sm mt-1 truncate">{customerInsights.topBuyer?.name || 'N/A'}</p>
                      {customerInsights.topBuyer && (
                        <p className="text-[10px] text-muted-foreground truncate">{formatPrice(customerInsights.topBuyer.totalSpent, selectedCurrency)}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-[100px] flex items-center justify-center text-sm text-muted-foreground">No customer data yet.</div>
                )}
              </div>
            </Card>

            <Card className="bg-card border-border rounded-sm overflow-hidden">
              <div className="p-5 border-b border-border bg-muted">
                <h2 className="font-bold text-foreground flex items-center gap-2"><Activity className="h-5 w-5 text-brand-green" /> Sales Velocity</h2>
              </div>
              <div className="p-5">
                {salesVelocity.avgDaysToFirstSale !== null && salesVelocity.avgDaysToFirstSale !== undefined ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-sm bg-card border-border">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Avg Days to First Sale</p>
                      <p className="font-black text-foreground text-xl mt-1">{salesVelocity.avgDaysToFirstSale}d</p>
                    </div>
                    <div className="p-3 rounded-sm bg-card border-border">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Best Selling Day</p>
                      <p className="font-black text-foreground text-xl mt-1">{salesVelocity.bestSellingDay}</p>
                    </div>
                    <div className="p-3 rounded-sm bg-card border-border">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Avg Sales/Day</p>
                      <p className="font-black text-foreground text-xl mt-1">{salesVelocity.avgSalesPerDay}</p>
                    </div>
                    <div className="p-3 rounded-sm bg-card border-border">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Products with Sales</p>
                      <p className="font-black text-foreground text-xl mt-1">{salesVelocity.velocityByPrompt?.length || 0}</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-[100px] flex items-center justify-center text-sm text-muted-foreground">Not enough data yet.</div>
                )}
              </div>
            </Card>
          </div>

          {/* Top Prompts + Payment Breakdown */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="bg-card border-border rounded-sm overflow-hidden">
              <div className="p-6 border-b border-border bg-muted">
                <h2 className="font-bold text-foreground flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/> Top Performing Prompts</h2>
              </div>
              <div className="p-6">
                {topPrompts.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No prompts yet</p>
                    <Link href="/seller/upload"><Button className="mt-4 bg-primary text-primary-foreground text-sm h-9 font-bold rounded-sm cursor-pointer">Create Listing</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topPrompts.slice(0, 5).map((p, i: number) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-sm bg-card border-border hover:border-primary/20 hover:bg-muted transition-all">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}</span>
                          <div className="h-10 w-10 rounded-sm bg-muted border-border flex items-center justify-center shrink-0">
                            <Sparkles className="h-5 w-5 text-primary/50" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-foreground truncate">{p.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span>{p.isFree ? 'Free' : formatPrice(p.price, selectedCurrency)}</span>
                              <span>·</span>
                              <span><Eye className="h-3 w-3 inline mr-0.5"/>{(p as any).views || (p as any).viewCount || 0}</span>
                              <span>·</span>
                              <span><ShoppingBag className="h-3 w-3 inline mr-0.5"/>{(p as any).downloads || (p as any).downloadCount || 0}</span>
                              {p.rating > 0 && <><span>·</span><span><Star className="h-3 w-3 inline mr-0.5 text-accent"/>{p.rating}</span></>}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] uppercase shrink-0 ${p.status === 'APPROVED' ? 'text-brand-green border-brand-green/20 bg-brand-green/10' : 'text-accent border-accent/20 bg-accent/10'}`}>
                          {p.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="bg-card border-border rounded-sm overflow-hidden">
              <div className="p-6 border-b border-border bg-muted">
                <h2 className="font-bold text-foreground flex items-center gap-2"><Wallet className="h-5 w-5 text-brand-green" /> Revenue Breakdown</h2>
              </div>
              <div className="p-6">
                {paymentMethods.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No payment data yet</div>
                ) : (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie data={paymentMethods} dataKey="revenue" nameKey="method" cx="50%" cy="50%" outerRadius={50} innerRadius={30}>
                          {paymentMethods.map((_: PaymentMethod, i: number) => <Cell key={i} fill={DOW_COLORS[i % DOW_COLORS.length]} />)}
                        </Pie>
                        <RTooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    {paymentMethods.map((pm: PaymentMethod) => (
                      <div key={pm.method} className="flex items-center justify-between p-2 rounded-sm hover:bg-muted text-sm transition-colors">
                        <span className="font-bold text-foreground">{pm.method}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{pm.count} sales</span>
                          <span className="font-bold text-brand-green">{formatPrice(pm.revenue, selectedCurrency)}</span>
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
            <Card className="bg-card border-border rounded-sm overflow-hidden">
              <div className="p-6 border-b border-border bg-muted flex items-center justify-between">
                <h2 className="font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" /> Product Performance Heatmap
                </h2>
                <Badge className="bg-muted text-muted-foreground border-border">{productHeatmap.length} products</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Product</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Price</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Views</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Downloads</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Revenue</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Rating</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Velocity</th>
                      <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Best Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productHeatmap.map((ph: ProductHeatmap) => {
                      const promptData = prompts.find((p) => p.id === ph.promptId);
                      return (
                        <tr key={ph.promptId} className="border-b border-border hover:bg-muted transition-colors">
                          <td className="p-3 font-bold text-foreground truncate max-w-[180px]">{ph.title}</td>
                          <td className="p-3 text-right text-muted-foreground">{promptData ? formatPrice(promptData.price, selectedCurrency) : '-'}</td>
                          <td className="p-3 text-right text-muted-foreground">{promptData?.viewCount || 0}</td>
                          <td className="p-3 text-right text-muted-foreground">{promptData?.downloadCount || 0}</td>
                          <td className="p-3 text-right font-bold text-brand-green">{formatPrice(ph.totalRevenue, selectedCurrency)}</td>
                          <td className="p-3 text-right">
                            {promptData && promptData.rating > 0 ? (
                              <span className="flex items-center justify-end gap-1">
                                <Star className="h-3 w-3 text-accent" />
                                <span className="text-foreground">{promptData.rating}</span>
                              </span>
                            ) : <span className="text-muted-foreground">-</span>}
                          </td>
                          <td className="p-3 text-right">
                            {(() => {
                              const sv = salesVelocity.velocityByPrompt?.find((v: VelocityByPrompt) => v.promptId === ph.promptId);
                              return sv ? (
                                <span className="text-[11px] font-bold text-muted-foreground">{sv.daysToFirstSale}d</span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">-</span>
                              );
                            })()}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              {ph.bestDay?.slice(0, 2).map((bd: { day: string; count: number }, bi: number) => (
                                <Badge key={bi} variant="outline" className="text-[9px] border-border text-muted-foreground font-normal bg-card">
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
            <Card className="bg-card border-border rounded-sm overflow-hidden">
              <div className="p-6 border-b border-border bg-muted flex items-center gap-2">
                <Target className="h-5 w-5 text-accent" />
                <h2 className="font-bold text-foreground">Pricing Optimization Insights</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Product</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Your Price</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Category Avg</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Suggested Price</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Downloads</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Potential Uplift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingInsights.map((pi: PricingInsight) => (
                      <tr key={pi.promptId} className="border-b border-border hover:bg-muted transition-colors">
                        <td className="p-3 font-bold text-foreground truncate max-w-[200px]">{pi.title}</td>
                        <td className="p-3 text-right font-bold text-foreground">{formatPrice(pi.currentPrice, selectedCurrency)}</td>
                        <td className="p-3 text-right text-muted-foreground">{pi.categoryAvg > 0 ? formatPrice(pi.categoryAvg, selectedCurrency) : 'N/A'}</td>
                        <td className="p-3 text-right">
                          {pi.suggestedPrice !== pi.currentPrice ? (
                            <span className="font-bold text-primary">{formatPrice(pi.suggestedPrice, selectedCurrency)}</span>
                          ) : (
                            <span className="text-muted-foreground">{formatPrice(pi.suggestedPrice, selectedCurrency)}</span>
                          )}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">{pi.downloads}</td>
                        <td className="p-3 text-right">
                          {pi.potentialRevenueUplift > 0 ? (
                            <span className="font-bold text-brand-green">+{formatPrice(pi.potentialRevenueUplift, selectedCurrency)}</span>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">Optimized</span>
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
            <Card className="bg-card border-border rounded-sm overflow-hidden">
              <div className="p-6 border-b border-border bg-muted flex items-center gap-2">
                <Hash className="h-5 w-5 text-purple-400" />
                <h2 className="font-bold text-foreground">Trending Keywords in Your Store</h2>
              </div>
              <div className="p-6 flex flex-wrap gap-2">
                {trendingKeywords.map((kw: TrendKeyword, i: number) => (
                  <Badge key={i} className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs px-3 py-1.5 font-bold">
                    {kw.word}
                    <span className="ml-1.5 text-[10px] text-purple-400/60">x{kw.count}</span>
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Refund / Cancellation Breakdown */}
          {refundBreakdown.length > 0 && (
            <Card className="bg-card border-accent/30 rounded-sm overflow-hidden">
              <div className="p-6 border-b border-accent/20 bg-accent/5 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-accent" />
                <h2 className="font-bold text-foreground">Refund & Cancellation Breakdown</h2>
                <Badge className="bg-accent/10 text-accent border border-accent/20 ml-auto">{a?.refundRate || 0}% rate</Badge>
              </div>
              <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {refundBreakdown.map((rb: RefundBreakdown, i: number) => (
                  <div key={i} className="p-3 rounded-sm bg-card border-border">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{rb.status}</p>
                    <p className="font-black text-foreground text-xl mt-1">{rb.count}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* AI Recommendations */}
          {aiRecs && (
            <Card className="bg-card border-primary/20 rounded-sm overflow-hidden relative">
              <div className="relative z-10 p-6 border-b border-border">
                <h2 className="font-bold text-foreground flex items-center gap-2"><TrendingUp className="h-5 w-5 text-purple-400" /> AI-Powered Market Insights</h2>
                <p className="text-xs text-muted-foreground mt-1">Trending prompts to inspire your next listing</p>
              </div>
              <div className="relative z-10 p-6 grid grid-cols-2 lg:grid-cols-5 gap-3">
                {Array.isArray(aiRecs) && aiRecs.slice(0, 5).map((rec: AiRec, i: number) => (
                  <div key={i} className="p-3 rounded-sm bg-card border-border text-center hover:bg-muted transition-all">
                    <p className="text-lg font-black text-primary">#{i + 1}</p>
                    <p className="text-xs font-bold text-foreground truncate mt-1">{rec.title || rec.query || 'Trending'}</p>
                    {rec.score && <p className="text-[10px] text-muted-foreground mt-1">Score: {Math.round(rec.score * 100)}%</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Orders with Fee Breakdown */}
          <Card className="bg-card border-border rounded-sm overflow-hidden">
            <div className="p-5 border-b border-border bg-muted">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" /> Recent Orders — Fee Breakdown
              </h2>
            </div>
            <div className="p-5">
              {ordersLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /> :
               recentOrders.length === 0 ? <p className="text-center text-muted-foreground py-8 text-sm">No sales yet</p> :
               <div className="overflow-x-auto">
                 <table className="w-full text-xs">
                   <thead>
                     <tr className="text-muted-foreground border-b border-border text-left">
                       <th className="pb-2 pr-2 font-bold uppercase tracking-widest text-[10px]">Order</th>
                       <th className="pb-2 pr-2 font-bold uppercase tracking-widest text-[10px]">Prompt</th>
                       <th className="pb-2 pr-2 font-bold uppercase tracking-widest text-[10px] text-right">Gross</th>
                       <th className="pb-2 pr-2 font-bold uppercase tracking-widest text-[10px] text-right">Commission</th>
                       <th className="pb-2 pr-2 font-bold uppercase tracking-widest text-[10px] text-right">GST</th>
                       <th className="pb-2 pr-2 font-bold uppercase tracking-widest text-[10px] text-right">Closing</th>
                       <th className="pb-2 pr-2 font-bold uppercase tracking-widest text-[10px] text-right">Payment</th>
                        <th className="pb-2 font-bold uppercase tracking-widest text-[10px] text-right text-brand-green">Net</th>
                     </tr>
                   </thead>
                   <tbody>
                     {recentOrders.map((o: any) => (
                       <tr key={o.id} className="border-b border-border hover:bg-muted">
                         <td className="py-2.5 pr-2 font-mono text-[10px] text-muted-foreground">{o.orderId || o.id}</td>
                         <td className="py-2.5 pr-2 max-w-[120px] truncate text-foreground">{o.prompt?.title}</td>
                         <td className="py-2.5 pr-2 text-right font-bold text-foreground">{formatPrice(o.amount || 0, selectedCurrency)}</td>
                          <td className="py-2.5 pr-2 text-right text-accent">-{formatPrice(o.commissionAmt || 0, selectedCurrency)}</td>
                          <td className="py-2.5 pr-2 text-right text-accent">-{formatPrice(o.gstAmt || 0, selectedCurrency)}</td>
                          <td className="py-2.5 pr-2 text-right text-purple-400">-{formatPrice(o.closingFee || 0, selectedCurrency)}</td>
                          <td className="py-2.5 pr-2 text-right text-accent/70">-{formatPrice(o.paymentFeeAmt || 0, selectedCurrency)}</td>
                          <td className="py-2.5 text-right font-black text-brand-green">{formatPrice(o.netAmount || 0, selectedCurrency)}</td>
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
