'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/store/marketplace';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Calculator, DollarSign, Percent, Receipt, Landmark, TrendingDown, PiggyBank } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice, formatUSD } from '@/store/marketplace';

interface FeeConfig {
  commissionRate: number
  gstRate: number
  closingFee: number
  paymentFeeRate: number
  minCommission: number
  maxCommission: number
  enabled: boolean
}

interface FeeBreakdown {
  grossAmount: number
  commissionRate: number
  commissionAmt: number
  gstRate: number
  gstAmt: number
  closingFee: number
  paymentFeeRate: number
  paymentFeeAmt: number
  totalFees: number
  netAmount: number
}

const DEFAULT_CONFIG: FeeConfig = {
  commissionRate: 15,
  gstRate: 18,
  closingFee: 0.50,
  paymentFeeRate: 2.5,
  minCommission: 0,
  maxCommission: 0,
  enabled: true,
}

export default function FeeSettings() {
  const [config, setConfig] = useState<FeeConfig>(DEFAULT_CONFIG)
  const [testAmount, setTestAmount] = useState(100)
  const [breakdown, setBreakdown] = useState<FeeBreakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/fees')
      const json = await res.json()
      if (json.success) {
        setConfig({ ...DEFAULT_CONFIG, ...json.data })
      }
    } catch (e: any) {
      toast.error('Failed to load fee config')
    } finally {
      setLoading(false)
    }
  }

  const previewFees = async () => {
    try {
      const res = await fetch('/api/admin/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: testAmount, config }),
      })
      const json = await res.json()
      if (json.success) {
        setBreakdown(json.data)
      }
    } catch {}
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  useEffect(() => {
    previewFees()
  }, [config, testAmount])

  const saveConfig = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/fees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Fee configuration saved')
      } else {
        toast.error(json.error || 'Failed to save')
      }
    } catch (e: any) { 
      toast.error(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const updateField = <K extends keyof FeeConfig>(key: K, value: FeeConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Fee Configuration */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Fee Configuration</h3>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="fee-enabled" className="text-sm text-muted-foreground">Enabled</Label>
            <Switch
              id="fee-enabled"
              checked={config.enabled}
              onCheckedChange={(v) => updateField('enabled', v)}
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Commission Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                Commission Rate (Referral Fee)
              </Label>
              <Badge variant="secondary" className="font-mono text-xs">{config.commissionRate}%</Badge>
            </div>
            <Slider
              min={0} max={50} step={0.5}
              value={[config.commissionRate]}
              onValueChange={([v]) => updateField('commissionRate', v)}
              disabled={!config.enabled}
            />
            <Input
              type="number" min={0} max={50} step={0.5}
              value={config.commissionRate}
              onChange={e => updateField('commissionRate', parseFloat(e.target.value) || 0)}
              className="w-24"
              disabled={!config.enabled}
            />
          </div>

          {/* GST Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                GST Rate (on fees)
              </Label>
              <Badge variant="secondary" className="font-mono text-xs">{config.gstRate}%</Badge>
            </div>
            <Slider
              min={0} max={28} step={0.5}
              value={[config.gstRate]}
              onValueChange={([v]) => updateField('gstRate', v)}
              disabled={!config.enabled}
            />
            <Input
              type="number" min={0} max={28} step={0.5}
              value={config.gstRate}
              onChange={e => updateField('gstRate', parseFloat(e.target.value) || 0)}
              className="w-24"
              disabled={!config.enabled}
            />
          </div>

          {/* Closing Fee */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                Closing Fee (per order)
              </Label>
              <Badge variant="secondary" className="font-mono text-xs">{formatUSD(config.closingFee)}</Badge>
            </div>
            <Slider
              min={0} max={10} step={0.1}
              value={[config.closingFee]}
              onValueChange={([v]) => updateField('closingFee', parseFloat(v.toFixed(2)))}
              disabled={!config.enabled}
            />
            <Input
              type="number" min={0} max={10} step={0.1}
              value={config.closingFee}
              onChange={e => updateField('closingFee', parseFloat(e.target.value) || 0)}
              className="w-24"
              disabled={!config.enabled}
            />
          </div>

          {/* Payment Fee Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
                Payment Processing Fee
              </Label>
              <Badge variant="secondary" className="font-mono text-xs">{config.paymentFeeRate}%</Badge>
            </div>
            <Slider
              min={0} max={10} step={0.1}
              value={[config.paymentFeeRate]}
              onValueChange={([v]) => updateField('paymentFeeRate', parseFloat(v.toFixed(1)))}
              disabled={!config.enabled}
            />
            <Input
              type="number" min={0} max={10} step={0.1}
              value={config.paymentFeeRate}
              onChange={e => updateField('paymentFeeRate', parseFloat(e.target.value) || 0)}
              className="w-24"
              disabled={!config.enabled}
            />
          </div>

          {/* Min Commission */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <PiggyBank className="h-3.5 w-3.5 text-muted-foreground" />
              Min Commission (0 = none)
            </Label>
            <Input
              type="number" min={0} step={0.5}
              value={config.minCommission}
              onChange={e => updateField('minCommission', parseFloat(e.target.value) || 0)}
              disabled={!config.enabled}
            />
          </div>

          {/* Max Commission */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <PiggyBank className="h-3.5 w-3.5 text-muted-foreground" />
              Max Commission (0 = unlimited)
            </Label>
            <Input
              type="number" min={0} step={0.5}
              value={config.maxCommission}
              onChange={e => updateField('maxCommission', parseFloat(e.target.value) || 0)}
              disabled={!config.enabled}
            />
          </div>
        </div>

        <Button
          onClick={saveConfig}
          disabled={saving || !config.enabled}
          className="mt-6"
        >
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Configuration
        </Button>
      </Card>

      {/* Live Preview */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Live Fee Preview</h3>
        </div>

        <div className="flex items-end gap-4 mb-6">
          <div className="space-y-2">
            <Label>Test Amount ($)</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={testAmount}
              onChange={e => setTestAmount(parseFloat(e.target.value) || 0)}
              className="w-40"
            />
          </div>
          <Badge variant="outline" className="mb-1 text-xs">
            {config.enabled ? 'Fees Active' : 'Fees Disabled'}
          </Badge>
        </div>

        {breakdown && config.enabled ? (
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4 pb-3 border-b">
              <span className="text-sm font-medium text-muted-foreground">Fee Breakdown</span>
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                Amazon-style
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Gross Amount */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/80">
                <span className="text-sm text-muted-foreground">Gross Amount</span>
                <span className="font-semibold font-mono text-base">{formatPrice(breakdown.grossAmount)}</span>
              </div>

              {/* Commission */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/80">
                <span className="text-sm text-muted-foreground">Commission ({breakdown.commissionRate}%)</span>
                <span className="font-mono text-sm text-amber-600 dark:text-amber-400">
                  -{formatPrice(breakdown.commissionAmt)}
                </span>
              </div>

              {/* GST */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/80">
                <span className="text-sm text-muted-foreground">GST on Fees ({breakdown.gstRate}%)</span>
                <span className="font-mono text-sm text-orange-600 dark:text-orange-400">
                  -{formatPrice(breakdown.gstAmt)}
                </span>
              </div>

              {/* Closing Fee */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/80">
                <span className="text-sm text-muted-foreground">Closing Fee</span>
                <span className="font-mono text-sm text-red-600 dark:text-red-400">
                  -{formatPrice(breakdown.closingFee)}
                </span>
              </div>

              {/* Payment Fee */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/80">
                <span className="text-sm text-muted-foreground">Payment Processing ({breakdown.paymentFeeRate}%)</span>
                <span className="font-mono text-sm text-red-600 dark:text-red-400">
                  -{formatPrice(breakdown.paymentFeeAmt)}
                </span>
              </div>

              {/* Platform Revenue (total fees - gst) */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/80">
                <span className="text-sm text-muted-foreground">Platform Revenue (excl. GST)</span>
                <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
                  +{formatPrice(breakdown.totalFees - breakdown.gstAmt)}
                </span>
              </div>

              {/* Total Fees */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 sm:col-span-2">
                <span className="text-sm font-medium">Total Fees Deducted</span>
                <span className="font-mono font-bold text-destructive">
                  -{formatPrice(breakdown.totalFees)}
                </span>
              </div>

              {/* Net Amount */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 sm:col-span-2">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <PiggyBank className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Net Amount to Seller
                </span>
                <span className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400">
                  {formatPrice(breakdown.netAmount)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
            <div className="text-center">
              <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{config.enabled ? 'Enter an amount above to preview fees' : 'Fee calculation is disabled'}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
