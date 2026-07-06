'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, RefreshCw, ShoppingBag, RotateCcw, Clock, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatUSD } from '@/store/marketplace';

const api = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...opts?.headers }, ...opts });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
};

const STATUS_STYLES: Record<string, { bg: string; icon: typeof CheckCircle }> = {
  COMPLETED: { bg: 'bg-green-100 text-green-700', icon: CheckCircle },
  PROCESSING: { bg: 'bg-blue-100 text-blue-700', icon: RefreshCw },
  SHIPPED: { bg: 'bg-purple-100 text-purple-700', icon: ShoppingBag },
  PENDING: { bg: 'bg-amber-100 text-amber-700', icon: Clock },
  FAILED: { bg: 'bg-red-100 text-red-700', icon: XCircle },
  CANCELLED: { bg: 'bg-gray-100 text-gray-700', icon: XCircle },
  REFUNDED: { bg: 'bg-gray-100 text-gray-700', icon: RotateCcw },
};

const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'FAILED', 'CANCELLED'];

export default function AdminOrders({ token }: { token: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refresh, setRefresh] = useState(0);

  // Refund dialog
  const [refundOrder, setRefundOrder] = useState<any>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ token, page: String(page), limit: '20' });
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        if (search) params.set('search', search);
        const data = await api(`/api/admin/orders?${params}`);
        if (!cancelled) {
          setOrders(data.orders || []);
          setPages(data.pages || 1);
          setTotal(data.total || 0);
          setTotalValue(data.totalValue || 0);
          setStatusCounts(data.statusCounts || {});
        }
      } catch (e: any) {  if (!cancelled) toast.error(e.message); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [token, page, statusFilter, search, refresh]);

  const handleRefund = async () => {
    if (!refundOrder) return;
    setRefunding(true);
    try {
      const data = await api('/api/razorpay/refund', {
        method: 'POST',
        headers: { 'x-token': token },
        body: JSON.stringify({ orderId: refundOrder.id, reason: refundReason || 'Admin refund' }),
      });
      toast.success(`Refunded ${formatUSD(data.amount)} via ${data.method === 'razorpay' ? 'Razorpay' : 'balance credit'}`);
      setRefundDialogOpen(false);
      setRefundOrder(null);
      setRefundReason('');
      setRefresh(r => r + 1);
    } catch (e: any) {  toast.error(e.message); }
    setRefunding(false);
  };

  const openRefundDialog = (order: any) => {
    setRefundOrder(order);
    setRefundReason('');
    setRefundDialogOpen(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      await api(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'x-token': token },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Order status updated to ${newStatus}`);
      setRefresh(r => r + 1);
    } catch (e: any) {  toast.error(e.message); } finally { setUpdatingStatus(null); }
  };

  const canChangeStatus = (status: string) => status !== 'COMPLETED' && status !== 'REFUNDED';

  const statusColor = (s: string) => STATUS_STYLES[s]?.bg || 'bg-slate-100 text-slate-700';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="text-sm">{total} Total Orders</Badge>
          <Badge variant="outline" className="text-sm text-green-600">{formatUSD(totalValue)} Total Value</Badge>
          {Object.entries(statusCounts).map(([s, c]) => (
            <Badge key={s} className={`text-[10px] cursor-pointer ${statusFilter === s ? 'ring-2 ring-offset-1 ring-primary' : ''} ${statusColor(s)}`}
              onClick={() => { setStatusFilter(s); setPage(1); }}>
              {s}: {c}
            </Badge>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => setRefresh(r => r + 1)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search order ID, buyer, or prompt..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <ScrollArea className="max-h-[520px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Order</TableHead>
                <TableHead className="text-xs">Buyer</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Prompt</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Method</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Currency</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Date</TableHead>
                <TableHead className="text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-14 ml-auto" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-7 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                    <ShoppingBag className="h-10 w-10 mx-auto mb-2" />
                    <p className="font-medium">No orders found</p>
                    <p className="text-sm">Orders will appear here once users make purchases.</p>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o: any, i: number) => {
                  const style = STATUS_STYLES[o.status] || STATUS_STYLES.PENDING;
                  const Icon = style.icon;
                  const canRefund = o.status === 'COMPLETED';
                  return (
                    <motion.tr
                      key={o.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b hover:bg-muted/40 transition-colors"
                    >
                      <TableCell>
                        <div>
                          <p className="text-sm font-mono font-medium">{o.orderId.slice(-8).toUpperCase()}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{o.orderId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{o.buyer?.name || 'Unknown'}</p>
                          <p className="text-[10px] text-muted-foreground">{o.buyer?.email || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                        {o.prompt?.title || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-green-600 text-sm">{formatUSD(o.amount || 0)}</span>
                        {o.platformFee > 0 && (
                          <p className="text-[10px] text-muted-foreground">fee: {formatUSD(o.platformFee)}</p>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {o.paymentMethod}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {o.currency}
                      </TableCell>
                      <TableCell>
                        {canChangeStatus(o.status) ? (
                          <div className="flex items-center gap-1.5">
                            {updatingStatus === o.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-neon-blue" />
                            ) : (
                              <Select value={o.status} onValueChange={(v) => handleStatusChange(o.id, v)}>
                                <SelectTrigger className="h-7 w-[120px] text-[10px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ORDER_STATUSES.map(s => (
                                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        ) : (
                          <Badge className={`text-[10px] ${statusColor(o.status)}`}>
                            <Icon className="h-3 w-3 mr-1" />{o.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {canRefund && (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                            onClick={() => openRefundDialog(o)}>
                            <RotateCcw className="h-3 w-3" /> Refund
                          </Button>
                        )}
                        {o.status === 'REFUNDED' && (
                          <Badge variant="outline" className="text-[10px]">Refunded</Badge>
                        )}
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{total} orders total</span>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="px-3 text-xs">Page {page} / {pages}</span>
          <Button size="icon" variant="outline" className="h-7 w-7" disabled={page >= pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><RotateCcw className="h-5 w-5 text-red-500" /> Confirm Refund</DialogTitle>
            <DialogDescription>
              You are about to refund order <span className="font-mono font-semibold">{refundOrder?.orderId}</span>.
            </DialogDescription>
          </DialogHeader>
          {refundOrder && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Buyer:</span> <span className="font-medium">{refundOrder.buyer?.name}</span></div>
                <div><span className="text-muted-foreground">Amount:</span> <span className="font-semibold text-green-600">{formatUSD(refundOrder.amount || 0)}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Prompt:</span> <span className="font-medium">{refundOrder.prompt?.title}</span></div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Reason (optional)</label>
                <Textarea placeholder="Why is this order being refunded?" value={refundReason} onChange={e => setRefundReason(e.target.value)} className="min-h-[80px]" />
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  {refundOrder.paymentId
                    ? 'A Razorpay refund will be attempted. If it fails, the buyer\'s wallet balance will be credited.'
                    : 'No payment ID found. The buyer\'s wallet balance will be credited directly.'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRefund} disabled={refunding}>
              {refunding ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Confirm Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}