'use client'
import { useEffect, useState, useMemo } from 'react'
import { useStore, formatPrice, CURRENCIES } from '@/store/marketplace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, RefreshCw, History, TrendingUp, TrendingDown, PieChart, Download, Search, Filter, DollarSign, CreditCard, Calendar, FileText, CheckCircle, Clock, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { AreaChart, Area, PieChart as RPieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip } from 'recharts'
import Script from 'next/script'
import { enableRazorpayProtections, disableRazorpayProtections } from '@/lib/razorpay-client'

type TxType = 'SALE' | 'DEPOSIT' | 'WITHDRAWAL' | 'REFUND' | 'FEE'

interface Tx {
  id: string
  amount: number
  type: string
  description: string | null
  status: string
  createdAt: string
  category?: TxType
  reference?: string
}

const CATEGORY_STYLES: Record<TxType, { label: string; bg: string; text: string; icon: any }> = {
  SALE: { label: 'SALE', bg: 'bg-emerald-500/20 border-emerald-500/30', text: 'text-emerald-400', icon: ArrowDownLeft },
  DEPOSIT: { label: 'DEPOSIT', bg: 'bg-neon-blue/20 border-neon-blue/30', text: 'text-neon-blue', icon: ArrowDownLeft },
  WITHDRAWAL: { label: 'WITHDRAWAL', bg: 'bg-neon-pink/20 border-neon-pink/30', text: 'text-neon-pink', icon: ArrowUpRight },
  REFUND: { label: 'REFUND', bg: 'bg-purple-500/20 border-purple-500/30', text: 'text-purple-400', icon: ArrowDownLeft },
  FEE: { label: 'FEE', bg: 'bg-amber-500/20 border-amber-500/30', text: 'text-amber-400', icon: ArrowUpRight },
}

function categorizeTx(tx: Tx): TxType {
  const desc = (tx.description || '').toLowerCase()
  const type = (tx.type || '').toUpperCase()
  if (desc.includes('sale') || desc.includes('earning') || desc.includes('commission')) return 'SALE'
  if (desc.includes('refund') || desc.includes('reversal') || desc.includes('return')) return 'REFUND'
  if (desc.includes('fee') || desc.includes('charge') || desc.includes('platform')) return 'FEE'
  if (type === 'CREDIT' || desc.includes('deposit') || desc.includes('top') || desc.includes('add')) return 'DEPOSIT'
  if (type === 'DEBIT' || desc.includes('withdraw') || desc.includes('payout') || desc.includes('transfer')) return 'WITHDRAWAL'
  if (tx.amount > 0) return 'DEPOSIT'
  return 'WITHDRAWAL'
}

function generateReference(id: string): string {
  return `TXN-${id.slice(0, 8).toUpperCase()}`
}

const PIE_COLORS = ['#00d2ff', '#ff0080', '#00ffaa', '#8a2be2', '#f59e0b']

export default function WalletPage() {
  const { user, selectedCurrency, setSelectedCurrency } = useStore()
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<any>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState('main')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<TxType | 'ALL'>('ALL')
  const [dateRange, setDateRange] = useState<[string, string]>(['', ''])
  const [amountRange, setAmountRange] = useState<[string, string]>(['', ''])

  const fetchWallet = async () => {
    if (!user) { setLoading(false); return }
    try {
      const r = await fetch('/api/wallet')
      const d = await r.json()
      if (d.success) setWallet(d.data)
    } catch (e) {
      console.error('[wallet] fetchWallet error', e)
      toast.error('Failed to load wallet')
    }
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    fetchWallet()
  }, [user])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('success')) {
        toast.success('Payment successful! Funds added to your wallet.');
        window.history.replaceState({}, document.title, '/wallet');
      } else if (url.searchParams.get('canceled')) {
        toast.error('Payment canceled');
        window.history.replaceState({}, document.title, '/wallet');
      }
    }
  }, []);

  const transactions: Tx[] = useMemo(() => {
    const raw: any[] = wallet?.transactions || []
    return raw.map((tx: any) => ({
      ...tx,
      category: categorizeTx(tx),
      reference: generateReference(tx.id),
    }))
  }, [wallet])

  const stats = useMemo(() => {
    let totalEarned = 0
    let totalSpent = 0
    let pendingW = 0
    for (const tx of transactions) {
      const cat = tx.category
      if (cat === 'SALE' || cat === 'DEPOSIT' || cat === 'REFUND') totalEarned += tx.amount
      else if (cat === 'WITHDRAWAL' || cat === 'FEE') totalSpent += tx.amount
      if (cat === 'WITHDRAWAL' && tx.status === 'PENDING') pendingW += tx.amount
    }
    return { totalEarned, totalSpent, pendingW, available: (wallet?.balance || 0) - pendingW }
  }, [transactions, wallet])

  const filteredTxs = useMemo(() => {
    let list = [...transactions]
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      list = list.filter(tx => (tx.description || '').toLowerCase().includes(q) || tx.reference!.toLowerCase().includes(q))
    }
    if (typeFilter !== 'ALL') list = list.filter(tx => tx.category === typeFilter)
    if (dateRange[0]) list = list.filter(tx => new Date(tx.createdAt) >= new Date(dateRange[0]))
    if (dateRange[1]) {
      const end = new Date(dateRange[1])
      end.setHours(23, 59, 59, 999)
      list = list.filter(tx => new Date(tx.createdAt) <= end)
    }
    if (amountRange[0]) list = list.filter(tx => tx.amount >= parseFloat(amountRange[0]))
    if (amountRange[1]) list = list.filter(tx => tx.amount <= parseFloat(amountRange[1]))
    return list
  }, [transactions, searchTerm, typeFilter, dateRange, amountRange])

  const areaChartData = useMemo(() => {
    const days: { date: string; balance: number }[] = []
    const sorted = [...transactions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    let running = 0
    const dayMap = new Map<string, number>()
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      dayMap.set(key, 0)
    }
    for (const tx of sorted) {
      const key = tx.createdAt.slice(0, 10)
      if (dayMap.has(key)) {
        dayMap.set(key, (dayMap.get(key) || 0) + (tx.category === 'WITHDRAWAL' || tx.category === 'FEE' ? -tx.amount : tx.amount))
      }
    }
    let cumulative = 0
    for (const [date, change] of dayMap) {
      cumulative += change
      days.push({ date: date.slice(5), balance: cumulative })
    }
    return days
  }, [transactions])

  const pieData = useMemo(() => {
    const map = new Map<TxType, number>()
    for (const tx of transactions) {
      const cat = tx.category!
      map.set(cat, (map.get(cat) || 0) + tx.amount)
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [transactions])

  const payoutEstimate = useMemo(() => {
    if (!user?.isSeller) return null
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + 7)
    return {
      amount: stats.available * 0.9,
      clearance: nextDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      status: 'PROCESSING',
    }
  }, [user, stats.available])

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount)
    if (!amt || amt < 5) return toast.error('Minimum deposit is $5')
    setSubmitting(true)
    
    try {
      const res = await fetch('/api/razorpay/wallet-topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(amt * 8350), // INR paise approximation matching backend
        currency: 'INR',
        name: 'Maghgo',
        description: 'Wallet Deposit',
        order_id: data.orderId,
        handler: async function (response: any) {
          disableRazorpayProtections();
          const verifyRes = await fetch('/api/razorpay/wallet-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amountUsd: amt,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            })
          })
          const verifyData = await verifyRes.json()
          if (verifyData.success) {
            toast.success('Wallet topped up successfully!')
            setDepositAmount('')
            useStore.getState().fetchMe() // refresh user balance
            fetchWallet() // refresh tx list
          } else {
            toast.error(verifyData.error || 'Verification failed')
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#00d2ff' },
        modal: {
          ondismiss: function() {
            disableRazorpayProtections();
            setSubmitting(false);
          }
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (response: any) {
        disableRazorpayProtections();
        toast.error(response.error.description || 'Payment failed')
        setSubmitting(false);
      })
      enableRazorpayProtections();
      rzp.open()

    } catch (e: any) {
      toast.error(e.message || 'Failed to initiate deposit')
      setSubmitting(false)
    }
  }

  const exportCSV = () => {
    const header = 'Reference,Description,Category,Amount,Status,Date'
    const rows = filteredTxs.map(tx => `"${tx.reference}","${tx.description || ''}","${tx.category}",${tx.amount},"${tx.status}","${tx.createdAt}"`)
    const csv = '\uFEFF' + [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wallet-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center glass-panel border-white/10 rounded-3xl mt-12">
        <WalletIcon className="h-16 w-16 text-white/20 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white">Sign in to access your wallet</h2>
        <p className="text-white/50 text-sm mt-2 mb-8">Manage deposits, track earnings, and withdraw funds</p>
        <Button className="bg-neon-blue hover:bg-neon-blue/80 text-black font-bold h-12 px-8 rounded-full shadow-[0_0_15px_rgba(0,210,255,0.5)] transition-all" onClick={() => useStore.getState().setShowAuthModal(true)}>Sign In</Button>
      </div>
    )
  }

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-neon-blue mx-auto" /></div>
  }

  const balance = wallet?.balance || 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 relative z-10">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
          <WalletIcon className="h-8 w-8 text-neon-blue drop-shadow-[0_0_10px_rgba(0,210,255,0.5)]" /> Wallet
        </h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedCurrency}
            onChange={e => { setSelectedCurrency(e.target.value); localStorage.setItem('pb_currency', e.target.value) }}
            className="text-sm border border-white/20 rounded-xl px-3 py-2 bg-black/40 text-white focus:outline-none focus:border-neon-blue transition-colors"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code} className="bg-black text-white">{c.flag} {c.code} ({c.symbol})</option>
            ))}
          </select>
          <Button variant="outline" size="sm" className="gap-1.5 glass-panel border-white/20 text-white hover:bg-white/10 rounded-xl" onClick={fetchWallet}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-8">
        <TabsList className="bg-white/5 p-1 rounded-xl border border-white/10 inline-flex">
          <TabsTrigger value="main" className="gap-2 rounded-lg data-[state=active]:bg-neon-blue data-[state=active]:text-black data-[state=active]:shadow-[0_0_10px_rgba(0,210,255,0.3)] text-white/70 hover:text-white transition-all px-4 py-2"><WalletIcon className="h-4 w-4" /> Main Wallet</TabsTrigger>
          <TabsTrigger value="earnings" className="gap-2 rounded-lg data-[state=active]:bg-neon-pink data-[state=active]:text-white data-[state=active]:shadow-[0_0_10px_rgba(255,0,128,0.3)] text-white/70 hover:text-white transition-all px-4 py-2"><TrendingUp className="h-4 w-4" /> Earnings</TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-black text-white/70 hover:text-white transition-all px-4 py-2"><ArrowUpRight className="h-4 w-4" /> Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="mt-8 space-y-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 neon-border glass-panel-heavy border-white/10 text-white rounded-3xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <p className="text-sm font-bold text-white/60">Current Balance</p>
                <p className="text-4xl font-black mt-2 drop-shadow-[0_0_10px_rgba(0,210,255,0.5)] text-neon-blue">{formatPrice(balance, selectedCurrency)}</p>
                <p className="text-xs font-medium text-white/40 mt-2 uppercase tracking-widest">Available for use</p>
              </div>
            </Card>
            <Card className="p-6 glass-panel border-white/10 rounded-3xl">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <TrendingUp className="h-5 w-5 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]" />
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Total Earned</p>
              </div>
              <p className="text-2xl font-black text-white">{formatPrice(stats.totalEarned, selectedCurrency)}</p>
              <p className="text-xs text-white/40 mt-2 font-medium">All time earnings</p>
            </Card>
            <Card className="p-6 glass-panel border-white/10 rounded-3xl">
              <div className="flex items-center gap-2 text-neon-pink mb-2">
                <TrendingDown className="h-5 w-5 drop-shadow-[0_0_5px_rgba(255,0,128,0.5)]" />
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Total Spent</p>
              </div>
              <p className="text-2xl font-black text-white">{formatPrice(stats.totalSpent, selectedCurrency)}</p>
              <p className="text-xs text-white/40 mt-2 font-medium">Fees + withdrawals</p>
            </Card>
            <Card className="p-6 glass-panel border-white/10 rounded-3xl">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <Clock className="h-5 w-5 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Pending</p>
              </div>
              <p className="text-2xl font-black text-white">{formatPrice(stats.pendingW, selectedCurrency)}</p>
              <p className="text-xs text-white/40 mt-2 font-medium">Awaiting clearance</p>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6 glass-panel border-white/10 rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-neon-blue drop-shadow-[0_0_5px_rgba(0,210,255,0.5)]" /> Balance Trend (30 days)
                </h3>
              </div>
              {areaChartData.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaChartData}>
                      <defs>
                        <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#00d2ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <RTooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', backdropFilter: 'blur(10px)' }}
                        formatter={(value: number) => [formatPrice(value, selectedCurrency), 'Balance']}
                      />
                      <Area type="monotone" dataKey="balance" stroke="#00d2ff" fill="url(#balanceGrad)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-white/30 text-sm font-medium">No data yet</div>
              )}
            </Card>

            <Card className="p-6 glass-panel border-white/10 rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                  <PieChart className="h-5 w-5 text-neon-pink drop-shadow-[0_0_5px_rgba(255,0,128,0.5)]" /> Breakdown
                </h3>
              </div>
              {pieData.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RPieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RTooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', backdropFilter: 'blur(10px)' }}
                        formatter={(value: number, name: string) => [formatPrice(value, selectedCurrency), name]}
                      />
                    </RPieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-4 mt-2">
                    {pieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2 text-xs font-bold text-white/70">
                        <span className="w-3 h-3 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length], color: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {d.name}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-white/30 text-sm font-medium">No data</div>
              )}
            </Card>
          </div>

          <Card className="p-6 glass-panel neon-border border-white/10 rounded-3xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <h3 className="font-bold text-white mb-4 text-lg">Deposit Funds</h3>
              <div className="flex gap-3">
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Amount"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  className="flex-1 max-w-xs bg-black/40 border-white/20 text-white focus:border-neon-blue h-12 rounded-xl text-lg font-bold"
                />
                <Button
                  onClick={handleDeposit}
                  disabled={submitting || !depositAmount}
                  className="bg-neon-blue hover:bg-neon-blue/80 text-black font-bold h-12 px-6 rounded-xl shadow-[0_0_15px_rgba(0,210,255,0.5)] transition-all shrink-0"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5 mr-1.5" />}
                  Add Funds
                </Button>
              </div>
              <div className="flex gap-3 mt-4 flex-wrap">
                {[10, 25, 50, 100].map(amt => (
                  <Button key={amt} variant="outline" size="sm" className="h-10 px-4 rounded-xl border-white/20 text-white hover:bg-white/10 font-bold glass-panel" onClick={() => setDepositAmount(String(amt))}>
                    {formatPrice(amt, selectedCurrency)}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-bold text-white flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-neon-blue drop-shadow-[0_0_5px_rgba(0,210,255,0.5)]" /> Transactions
                <Badge variant="outline" className="text-xs ml-2 border-white/20 bg-white/5 text-white">{filteredTxs.length}</Badge>
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 h-10 bg-black/40 border-white/20 text-white focus:border-neon-blue rounded-xl text-sm w-40"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as TxType | 'ALL')}
                  className="text-sm border border-white/20 rounded-xl px-3 h-10 bg-black/40 text-white focus:outline-none focus:border-neon-blue"
                >
                  <option value="ALL">All Types</option>
                  <option value="SALE">Sales</option>
                  <option value="DEPOSIT">Deposits</option>
                  <option value="WITHDRAWAL">Withdrawals</option>
                  <option value="REFUND">Refunds</option>
                  <option value="FEE">Fees</option>
                </select>
                <Input
                  type="date"
                  value={dateRange[0]}
                  onChange={e => setDateRange([e.target.value, dateRange[1]])}
                  className="h-10 text-sm w-36 bg-black/40 border-white/20 text-white focus:border-neon-blue rounded-xl"
                  placeholder="From"
                />
                <Input
                  type="date"
                  value={dateRange[1]}
                  onChange={e => setDateRange([dateRange[0], e.target.value])}
                  className="h-10 text-sm w-36 bg-black/40 border-white/20 text-white focus:border-neon-blue rounded-xl"
                  placeholder="To"
                />
                <Button variant="outline" size="sm" className="h-10 px-4 gap-2 glass-panel border-white/20 text-white hover:bg-white/10 rounded-xl" onClick={exportCSV}>
                  <Download className="h-4 w-4" /> CSV
                </Button>
              </div>
            </div>
            <div className="p-6">
              {filteredTxs.length === 0 ? (
                <div className="text-center py-16 text-sm text-white/40">
                  <FileText className="h-12 w-12 text-white/10 mx-auto mb-4" />
                  <p className="text-base font-bold text-white/60">No transactions found</p>
                  {transactions.length === 0 && <p className="mt-1">Try adding funds to get started</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTxs.map((tx: Tx, i: number) => {
                    const cat = CATEGORY_STYLES[tx.category!] || CATEGORY_STYLES.DEPOSIT
                    const Icon = cat.icon
                    const isCredit = tx.category === 'SALE' || tx.category === 'DEPOSIT' || tx.category === 'REFUND'
                    return (
                      <div key={tx.id || i} className="flex items-center justify-between p-4 rounded-2xl glass-panel border border-white/5 hover:border-white/20 transition-all hover:bg-white/5 group">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border ${cat.bg}`}>
                            {isCredit
                              ? <ArrowDownLeft className={`h-6 w-6 ${cat.text} drop-shadow-[0_0_5px_currentColor]`} />
                              : <ArrowUpRight className={`h-6 w-6 ${cat.text} drop-shadow-[0_0_5px_currentColor]`} />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <p className="font-bold text-base text-white truncate group-hover:text-neon-blue transition-colors">{tx.description || tx.type || 'Transaction'}</p>
                              <Badge className={`text-[10px] font-black tracking-widest px-2 py-0.5 ${cat.bg} ${cat.text}`}>
                                {cat.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-white/40 mt-1 uppercase tracking-wider">
                              <span>{new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <span className="text-white/20">|</span>
                              <span className="font-mono">{tx.reference}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className={`font-black text-lg ${isCredit ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : 'text-neon-pink drop-shadow-[0_0_5px_rgba(255,0,128,0.5)]'}`}>
                            {isCredit ? '+' : '-'}{formatPrice(Math.abs(tx.amount), selectedCurrency)}
                          </p>
                          {tx.status === 'COMPLETED' ? (
                            <div className="flex items-center gap-1.5 justify-end text-xs font-bold text-emerald-400 mt-1">
                              <CheckCircle className="h-3.5 w-3.5" /> Completed
                            </div>
                          ) : tx.status === 'PENDING' ? (
                            <div className="flex items-center gap-1.5 justify-end text-xs font-bold text-amber-400 mt-1">
                              <Clock className="h-3.5 w-3.5" /> Pending
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 justify-end text-xs font-bold text-neon-pink mt-1">
                              <XCircle className="h-3.5 w-3.5" /> {tx.status}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="mt-8 space-y-8">
          <div className="grid sm:grid-cols-3 gap-6">
            <Card className="p-6 neon-border glass-panel-heavy border-white/10 text-white rounded-3xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <p className="text-sm font-bold text-white/60">Total Earnings</p>
                <p className="text-4xl font-black mt-2 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)] text-emerald-400">{formatPrice(stats.totalEarned, selectedCurrency)}</p>
              </div>
            </Card>
            <Card className="p-6 glass-panel border-white/10 rounded-3xl">
              <div className="flex items-center gap-2 text-neon-blue mb-2">
                <DollarSign className="h-5 w-5 drop-shadow-[0_0_5px_rgba(0,210,255,0.5)]" />
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Available for Payout</p>
              </div>
              <p className="text-2xl font-black text-white">{formatPrice(stats.available, selectedCurrency)}</p>
            </Card>
            <Card className="p-6 glass-panel border-white/10 rounded-3xl">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <Clock className="h-5 w-5 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Pending Withdrawals</p>
              </div>
              <p className="text-2xl font-black text-white">{formatPrice(stats.pendingW, selectedCurrency)}</p>
            </Card>
          </div>

          {user?.isSeller && payoutEstimate && (
            <Card className="p-6 glass-panel border-amber-400/30 rounded-3xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-50" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2 text-lg mb-2">
                    <Calendar className="h-5 w-5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" /> Upcoming Payout
                  </h3>
                  <p className="text-3xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] mt-2">{formatPrice(payoutEstimate.amount, selectedCurrency)}</p>
                  <p className="text-sm font-medium text-white/50 mt-1">Estimated clearance: {payoutEstimate.clearance}</p>
                </div>
                <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 font-bold">{payoutEstimate.status}</Badge>
              </div>
              <div className="relative z-10 mt-6 flex items-center gap-2 text-xs font-medium text-white/40 uppercase tracking-wider">
                <Clock className="h-3.5 w-3.5" /> Payouts are processed every 7 days
              </div>
            </Card>
          )}

          <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]" /> Earnings History
              </h3>
            </div>
            <div className="p-6">
              {filteredTxs.filter(tx => tx.category === 'SALE').length === 0 ? (
                <div className="text-center py-16 text-sm text-white/40">
                  <DollarSign className="h-12 w-12 text-white/10 mx-auto mb-4" />
                  <p className="text-base font-bold text-white/60">No earnings yet</p>
                  {user?.isSeller ? <p className="mt-1">Start selling prompts to earn!</p> : <p className="mt-1">Become a seller to start earning</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTxs.filter(tx => tx.category === 'SALE').map((tx: Tx, i: number) => (
                    <div key={tx.id || i} className="flex items-center justify-between p-4 rounded-2xl glass-panel border border-white/5 hover:border-white/20 transition-all hover:bg-white/5 group">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          <ArrowDownLeft className="h-6 w-6 text-emerald-400 drop-shadow-[0_0_5px_currentColor]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-base text-white truncate group-hover:text-neon-blue transition-colors">{tx.description || 'Sale'}</p>
                          <p className="text-xs font-medium text-white/40 mt-1 uppercase tracking-wider">{new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <p className="font-black text-lg text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)] shrink-0">+{formatPrice(tx.amount, selectedCurrency)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="mt-8 space-y-8">
          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="p-6 neon-border glass-panel-heavy border-white/10 text-white rounded-3xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <p className="text-sm font-bold text-white/60">Total Withdrawn</p>
                <p className="text-4xl font-black mt-2 drop-shadow-[0_0_10px_rgba(255,0,128,0.5)] text-neon-pink">{formatPrice(stats.totalSpent, selectedCurrency)}</p>
              </div>
            </Card>
            <Card className="p-6 glass-panel border-white/10 rounded-3xl">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <Clock className="h-5 w-5 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Pending Clearance</p>
              </div>
              <p className="text-2xl font-black text-white">{formatPrice(stats.pendingW, selectedCurrency)}</p>
              <p className="text-xs font-medium text-white/40 mt-2">Estimated 3-5 business days</p>
            </Card>
          </div>

          {user?.isSeller && payoutEstimate && (
            <Card className="p-6 glass-panel border-neon-blue/30 rounded-3xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-transparent opacity-50" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2 text-lg mb-2">
                    <CreditCard className="h-5 w-5 text-neon-blue drop-shadow-[0_0_5px_rgba(0,210,255,0.5)]" /> Next Scheduled Payout
                  </h3>
                  <p className="text-3xl font-black text-neon-blue drop-shadow-[0_0_10px_rgba(0,210,255,0.5)] mt-2">{formatPrice(payoutEstimate.amount, selectedCurrency)}</p>
                  <p className="text-sm font-medium text-white/50 mt-1">Clearance date: {payoutEstimate.clearance}</p>
                </div>
                <Badge className="bg-neon-blue/20 text-neon-blue border border-neon-blue/30 px-3 py-1 font-bold">PROCESSING</Badge>
              </div>
              <div className="relative z-10 mt-6 p-4 glass-panel border-white/10 rounded-xl text-xs font-medium text-white/60">
                <p>Funds will be transferred to your linked bank account / UPI ID. Update your payment details in Settings.</p>
              </div>
            </Card>
          )}

          <Card className="glass-panel border-white/10 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-black/40">
              <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                <ArrowUpRight className="h-5 w-5 text-neon-pink drop-shadow-[0_0_5px_rgba(255,0,128,0.5)]" /> Withdrawal History
              </h3>
            </div>
            <div className="p-6">
              {filteredTxs.filter(tx => tx.category === 'WITHDRAWAL' || tx.category === 'FEE').length === 0 ? (
                <div className="text-center py-16 text-sm text-white/40">
                  <ArrowUpRight className="h-12 w-12 text-white/10 mx-auto mb-4" />
                  <p className="text-base font-bold text-white/60">No withdrawals made yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTxs.filter(tx => tx.category === 'WITHDRAWAL' || tx.category === 'FEE').map((tx: Tx, i: number) => (
                    <div key={tx.id || i} className="flex items-center justify-between p-4 rounded-2xl glass-panel border border-white/5 hover:border-white/20 transition-all hover:bg-white/5 group">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-12 w-12 rounded-xl bg-neon-pink/20 border border-neon-pink/30 flex items-center justify-center shrink-0">
                          <ArrowUpRight className="h-6 w-6 text-neon-pink drop-shadow-[0_0_5px_currentColor]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-base text-white truncate group-hover:text-neon-blue transition-colors">{tx.description || tx.type || 'Withdrawal'}</p>
                          <div className="flex items-center gap-2 text-xs font-medium text-white/40 mt-1 uppercase tracking-wider">
                            <span>{new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span className="text-white/20">|</span>
                            <span className="font-mono">{tx.reference}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="font-black text-lg text-neon-pink drop-shadow-[0_0_5px_rgba(255,0,128,0.5)]">-{formatPrice(Math.abs(tx.amount), selectedCurrency)}</p>
                        {tx.status === 'COMPLETED' ? (
                          <div className="flex items-center gap-1.5 justify-end text-xs font-bold text-emerald-400 mt-1">
                            <CheckCircle className="h-3.5 w-3.5" /> Completed
                          </div>
                        ) : tx.status === 'PENDING' ? (
                          <div className="flex items-center gap-1.5 justify-end text-xs font-bold text-amber-400 mt-1">
                            <Clock className="h-3.5 w-3.5" /> Pending
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 justify-end text-xs font-bold text-neon-pink mt-1">
                            <XCircle className="h-3.5 w-3.5" /> {tx.status}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
