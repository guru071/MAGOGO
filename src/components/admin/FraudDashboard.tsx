'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Shield, ShieldAlert, ShieldCheck, UserX, AlertTriangle, CheckCircle, Eye, Ban, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface FraudCase {
  id: string;
  userId: string;
  type: string;
  entityType: string;
  entityId: string | null;
  riskScore: number;
  signals: string | null;
  status: string;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string } | null;
}

interface FraudData {
  cases: FraudCase[];
  total: number;
  page: number;
  totalPages: number;
}

export default function FraudDashboard({ token }: { token: string }) {
  const [data, setData] = useState<FraudData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedCase, setSelectedCase] = useState<FraudCase | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const fetchCases = async (status: string, p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/fraud?status=${status}&page=${p}&limit=20`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else toast.error(json.error || 'Failed to load fraud cases');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCases(activeTab, page);
  }, [token, activeTab, page]);

  const handleAction = async (caseId: string, action: string) => {
    try {
      const res = await fetch('/api/admin/fraud', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, action, resolution: action === 'dismiss' ? 'Dismissed - false positive' : undefined }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(action === 'block_user' ? 'User blocked and case resolved' : 'Case resolved');
        fetchCases(activeTab, page);
        setReviewModalOpen(false);
      } else {
        toast.error(json.error || 'Action failed');
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    if (score >= 60) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
    if (score >= 30) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
    return 'text-green-600 bg-green-100 dark:bg-green-900/30';
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'USER': return <UserX className="h-4 w-4" />;
      case 'PROMPT': return <Shield className="h-4 w-4" />;
      case 'REVIEW': return <ShieldAlert className="h-4 w-4" />;
      case 'TRANSACTION': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const avgRiskScore = data?.cases?.length
    ? Math.round(data.cases.reduce((sum, c) => sum + c.riskScore, 0) / data.cases.length)
    : 0;

  const openCount = data?.cases?.filter((c) => c.status === 'OPEN').length ?? 0;
  const blockedCount = data?.cases?.filter((c) => c.resolution?.includes('blocked')).length ?? 0;
  const falsePositiveCount = data?.cases?.filter((c) => c.resolution?.includes('false positive')).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.total ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Flagged</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{openCount}</p>
              <p className="text-xs text-muted-foreground">Open Cases</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Ban className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{blockedCount}</p>
              <p className="text-xs text-muted-foreground">Blocked Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{falsePositiveCount}</p>
              <p className="text-xs text-muted-foreground">False Positives</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Risk score gauge */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Average Risk Score</h3>
          <span className={`text-2xl font-bold ${avgRiskScore >= 80 ? 'text-red-600' : avgRiskScore >= 60 ? 'text-orange-600' : avgRiskScore >= 30 ? 'text-amber-600' : 'text-green-600'}`}>
            {avgRiskScore}/100
          </span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden relative">
          <div className="absolute inset-0 flex">
            <div className="h-full bg-green-500" style={{ width: '30%' }} />
            <div className="h-full bg-amber-500" style={{ width: '30%' }} />
            <div className="h-full bg-red-500" style={{ width: '20%' }} />
            <div className="h-full bg-red-800" style={{ width: '20%' }} />
          </div>
          <div
            className="absolute top-0 h-full w-1 bg-white shadow-lg transition-all duration-500"
            style={{ left: `${avgRiskScore}%`, transform: 'translateX(-50%)' }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Low (0-30)</span>
          <span>Medium (30-60)</span>
          <span>High (60-80)</span>
          <span>Critical (80-100)</span>
        </div>
      </Card>

      {/* Cases table */}
      <Card>
        <div className="p-4 border-b">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="OPEN">Open</TabsTrigger>
              <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !data?.cases?.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
            No fraud cases found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Score</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.cases.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 text-muted-foreground whitespace-nowrap">{formatDate(c.createdAt)}</td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{c.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{c.user?.email}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          {getEntityIcon(c.entityType)}
                          {c.entityType}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={getScoreColor(c.riskScore)}>{c.riskScore}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={c.status === 'OPEN' ? 'destructive' : 'secondary'}>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedCase(c); setReviewModalOpen(true); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {c.status === 'OPEN' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={() => handleAction(c.id, 'block_user')}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600"
                                onClick={() => handleAction(c.id, 'dismiss')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {data.page} of {data.totalPages} ({data.total} total)
                </p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={data.page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={data.page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Review modal */}
      {reviewModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setReviewModalOpen(false)}>
          <div className="bg-background rounded-xl max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                Case Review
              </h3>
              <Badge variant={selectedCase.status === 'OPEN' ? 'destructive' : 'secondary'}>{selectedCase.status}</Badge>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">User</p>
                  <p className="text-sm font-medium">{selectedCase.user?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm">{selectedCase.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Entity Type</p>
                  <Badge variant="outline">{selectedCase.entityType}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Risk Score</p>
                  <Badge className={getScoreColor(selectedCase.riskScore)}>{selectedCase.riskScore}/100</Badge>
                </div>
              </div>
              {selectedCase.signals && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Fraud Signals</p>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40">
                    {JSON.stringify(JSON.parse(selectedCase.signals), null, 2)}
                  </pre>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(selectedCase.createdAt)}</p>
              </div>
              {selectedCase.resolution && (
                <div>
                  <p className="text-xs text-muted-foreground">Resolution</p>
                  <p className="text-sm">{selectedCase.resolution}</p>
                </div>
              )}
            </div>
            {selectedCase.status === 'OPEN' && (
              <div className="flex gap-2 pt-2">
                <Button variant="destructive" className="flex-1" onClick={() => handleAction(selectedCase.id, 'block_user')}>
                  <Ban className="h-4 w-4 mr-1.5" /> Block User
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => handleAction(selectedCase.id, 'dismiss')}>
                  <CheckCircle className="h-4 w-4 mr-1.5" /> Dismiss
                </Button>
              </div>
            )}
            <Button variant="ghost" className="w-full" onClick={() => setReviewModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
