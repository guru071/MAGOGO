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
  SALE: { label: 'SALE', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: ArrowDownLeft },
  DEPOSIT: { label: 'DEPOSIT', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: ArrowDownLeft },
  WITHDRAWAL: { label: 'WITHDRAWAL', bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: ArrowUpRight },
  REFUND: { label: 'REFUND', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', icon: ArrowDownLeft },
  FEE: { label: 'FEE', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: ArrowUpRight },
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

const PIE_COLORS = ['#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#F59E0B']

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
      const res = await fetch('/api/wallet/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      })
      const d = await res.json()
      if (d.success && d.url) {
        window.location.href = d.url
      } else toast.error(d.error || 'Failed to initiate checkout')
    } catch { toast.error('Failed to initiate checkout') }
    finally { setSubmitting(false) }
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
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <WalletIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Sign in to access your wallet</h2>
        <p className="text-slate-400 text-sm mt-2">Manage deposits, track earnings, and withdraw funds</p>
        <Button className="mt-4 bg-[#0066CC] text-white" onClick={() => useStore.getState().setShowAuthModal(true)}>Sign In</Button>
      </div>
    )
  }

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-[#0066CC] mx-auto" /></div>
  }

  const balance = wallet?.balance || 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <WalletIcon className="h-8 w-8 text-[#0066CC]" /> Wallet
        </h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedCurrency}
            onChange={e => { setSelectedCurrency(e.target.value); localStorage.setItem('pb_currency', e.target.value) }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.code} ({c.symbol})</option>
            ))}
          </select>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchWallet}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-8">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="main" className="gap-2"><WalletIcon className="h-4 w-4" /> Main Wallet</TabsTrigger>
          <TabsTrigger value="earnings" className="gap-2"><TrendingUp className="h-4 w-4" /> Earnings</TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-2"><ArrowUpRight className="h-4 w-4" /> Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="mt-6 space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border-slate-200 shadow-sm bg-gradient-to-br from-[#0066CC] to-[#004C99] text-white">
              <p className="text-sm font-medium opacity-80">Current Balance</p>
              <p className="text-3xl font-black mt-1">{formatPrice(balance, selectedCurrency)}</p>
              <p className="text-xs opacity-60 mt-1">Available for use</p>
            </Card>
            <Card className="p-5 border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <TrendingUp className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wide">Total Earned</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">{formatPrice(stats.totalEarned, selectedCurrency)}</p>
              <p className="text-xs text-slate-400 mt-1">All time earnings</p>
            </Card>
            <Card className="p-5 border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-red-500 mb-1">
                <TrendingDown className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wide">Total Spent</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">{formatPrice(stats.totalSpent, selectedCurrency)}</p>
              <p className="text-xs text-slate-400 mt-1">Fees + withdrawals</p>
            </Card>
            <Card className="p-5 border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <Clock className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wide">Pending</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">{formatPrice(stats.pendingW, selectedCurrency)}</p>
              <p className="text-xs text-slate-400 mt-1">Awaiting clearance</p>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-5 border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-[#0066CC]" /> Balance Trend (30 days)
                </h3>
              </div>
              {areaChartData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaChartData}>
                      <defs>
                        <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0066CC" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0066CC" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <RTooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                        formatter={(value: number) => [formatPrice(value, selectedCurrency), 'Balance']}
                      />
                      <Area type="monotone" dataKey="balance" stroke="#0066CC" fill="url(#balanceGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
              )}
            </Card>

            <Card className="p-5 border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                  <PieChart className="h-4 w-4 text-[#0066CC]" /> Breakdown
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
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                        formatter={(value: number, name: string) => [formatPrice(value, selectedCurrency), name]}
                      />
                    </RPieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-1">
                    {pieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {d.name}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No data</div>
              )}
            </Card>
          </div>

          <Card className="p-5 border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-3">Deposit Funds</h3>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                step="0.01"
                placeholder="Amount"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                className="flex-1 max-w-xs"
              />
              <Button
                onClick={handleDeposit}
                disabled={submitting || !depositAmount}
                className="bg-[#0066CC] text-white shrink-0"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </Button>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {[10, 25, 50, 100].map(amt => (
                <Button key={amt} variant="outline" size="sm" className="text-xs h-8" onClick={() => setDepositAmount(String(amt))}>
                  {formatPrice(amt, selectedCurrency)}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <History className="h-5 w-5 text-[#0066CC]" /> Transactions
                <Badge variant="outline" className="text-[10px] ml-1">{filteredTxs.length}</Badge>
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-xs w-36"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as TxType | 'ALL')}
                  className="text-xs border border-slate-200 rounded-lg px-2 h-8 bg-white text-slate-600"
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
                  className="h-8 text-xs w-32"
                  placeholder="From"
                />
                <Input
                  type="date"
                  value={dateRange[1]}
                  onChange={e => setDateRange([dateRange[0], e.target.value])}
                  className="h-8 text-xs w-32"
                  placeholder="To"
                />
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={exportCSV}>
                  <Download className="h-3.5 w-3.5" /> CSV
                </Button>
              </div>
            </div>
            <div className="p-5">
              {filteredTxs.length === 0 ? (
                <div className="text-center py-10 text-sm text-slate-400">
                  <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p>No transactions found</p>
                  {transactions.length === 0 && <p className="text-xs mt-1">Try adding funds to get started</p>}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTxs.map((tx: Tx, i: number) => {
                    const cat = CATEGORY_STYLES[tx.category!] || CATEGORY_STYLES.DEPOSIT
                    const Icon = cat.icon
                    const isCredit = tx.category === 'SALE' || tx.category === 'DEPOSIT' || tx.category === 'REFUND'
                    return (
                      <div key={tx.id || i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/80 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isCredit ? 'bg-emerald-50' : 'bg-red-50'}`}>
                            {isCredit
                              ? <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
                              : <ArrowUpRight className="h-5 w-5 text-red-500" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm text-slate-800 truncate">{tx.description || tx.type || 'Transaction'}</p>
                              <Badge className={`text-[10px] border px-1.5 py-0 ${cat.bg} ${cat.text}`}>
                                {cat.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span>{new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <span className="text-slate-300">|</span>
                              <span className="font-mono">{tx.reference}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className={`font-bold text-sm ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                            {isCredit ? '+' : '-'}{formatPrice(Math.abs(tx.amount), selectedCurrency)}
                          </p>
                          {tx.status === 'COMPLETED' ? (
                            <div className="flex items-center gap-1 justify-end text-[10px] text-green-600">
                              <CheckCircle className="h-3 w-3" /> Completed
                            </div>
                          ) : tx.status === 'PENDING' ? (
                            <div className="flex items-center gap-1 justify-end text-[10px] text-amber-600">
                              <Clock className="h-3 w-3" /> Pending
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 justify-end text-[10px] text-red-500">
                              <XCircle className="h-3 w-3" /> {tx.status}
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

        <TabsContent value="earnings" className="mt-6 space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="p-5 border-slate-200 shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
              <p className="text-sm font-medium opacity-80">Total Earnings</p>
              <p className="text-3xl font-black mt-1">{formatPrice(stats.totalEarned, selectedCurrency)}</p>
            </Card>
            <Card className="p-5 border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <DollarSign className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wide">Available for Payout</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">{formatPrice(stats.available, selectedCurrency)}</p>
            </Card>
            <Card className="p-5 border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <Clock className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wide">Pending Withdrawals</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">{formatPrice(stats.pendingW, selectedCurrency)}</p>
            </Card>
          </div>

          {user?.isSeller && payoutEstimate && (
            <Card className="p-5 border-slate-200 shadow-sm border-l-4 border-l-amber-400">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-600" /> Upcoming Payout
                  </h3>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{formatPrice(payoutEstimate.amount, selectedCurrency)}</p>
                  <p className="text-sm text-slate-500">Estimated clearance: {payoutEstimate.clearance}</p>
                </div>
                <Badge className="bg-amber-50 text-amber-700 border-amber-200">{payoutEstimate.status}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <Clock className="h-3 w-3" /> Payouts are processed every 7 days
              </div>
            </Card>
          )}

          <Card className="border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <TrendingUp className="h-5 w-5 text-emerald-500" /> Earnings History
              </h3>
            </div>
            <div className="p-5">
              {filteredTxs.filter(tx => tx.category === 'SALE').length === 0 ? (
                <div className="text-center py-10 text-sm text-slate-400">
                  <DollarSign className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p>No earnings yet</p>
                  {user?.isSeller ? <p className="text-xs mt-1">Start selling prompts to earn!</p> : <p className="text-xs mt-1">Become a seller to start earning</p>}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTxs.filter(tx => tx.category === 'SALE').map((tx: Tx, i: number) => (
                    <div key={tx.id || i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                          <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-slate-800 truncate">{tx.description || 'Sale'}</p>
                          <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <p className="font-bold text-sm text-emerald-600 shrink-0">+{formatPrice(tx.amount, selectedCurrency)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="mt-6 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="p-5 border-slate-200 shadow-sm bg-gradient-to-br from-red-500 to-red-700 text-white">
              <p className="text-sm font-medium opacity-80">Total Withdrawn</p>
              <p className="text-3xl font-black mt-1">{formatPrice(stats.totalSpent, selectedCurrency)}</p>
            </Card>
            <Card className="p-5 border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <Clock className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wide">Pending Clearance</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">{formatPrice(stats.pendingW, selectedCurrency)}</p>
              <p className="text-xs text-slate-400 mt-1">Estimated 3-5 business days</p>
            </Card>
          </div>

          {user?.isSeller && payoutEstimate && (
            <Card className="p-5 border-slate-200 shadow-sm border-l-4 border-l-blue-400">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-600" /> Next Scheduled Payout
                  </h3>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{formatPrice(payoutEstimate.amount, selectedCurrency)}</p>
                  <p className="text-sm text-slate-500">Clearance date: {payoutEstimate.clearance}</p>
                </div>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200">PROCESSING</Badge>
              </div>
              <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
                <p>Funds will be transferred to your linked bank account / UPI ID. Update your payment details in Settings.</p>
              </div>
            </Card>
          )}

          <Card className="border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <ArrowUpRight className="h-5 w-5 text-red-500" /> Withdrawal History
              </h3>
            </div>
            <div className="p-5">
              {filteredTxs.filter(tx => tx.category === 'WITHDRAWAL' || tx.category === 'FEE').length === 0 ? (
                <div className="text-center py-10 text-sm text-slate-400">
                  <ArrowUpRight className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p>No withdrawals made yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTxs.filter(tx => tx.category === 'WITHDRAWAL' || tx.category === 'FEE').map((tx: Tx, i: number) => (
                    <div key={tx.id || i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                          <ArrowUpRight className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-slate-800 truncate">{tx.description || tx.type || 'Withdrawal'}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span>{new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span className="text-slate-300">|</span>
                            <span className="font-mono">{tx.reference}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="font-bold text-sm text-red-500">-{formatPrice(Math.abs(tx.amount), selectedCurrency)}</p>
                        {tx.status === 'COMPLETED' ? (
                          <div className="flex items-center gap-1 justify-end text-[10px] text-green-600">
                            <CheckCircle className="h-3 w-3" /> Completed
                          </div>
                        ) : tx.status === 'PENDING' ? (
                          <div className="flex items-center gap-1 justify-end text-[10px] text-amber-600">
                            <Clock className="h-3 w-3" /> Pending
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 justify-end text-[10px] text-red-500">
                            <XCircle className="h-3 w-3" /> {tx.status}
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
