'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Flag, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface ReportModalProps {
  promptId: string
  open: boolean
  onClose: () => void
}

const REASONS = [
  { value: 'SPAM', label: 'Spam or misleading' },
  { value: 'COPYRIGHT', label: 'Copyright infringement' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate content' },
  { value: 'LOW_QUALITY', label: 'Low quality or broken' },
  { value: 'OTHER', label: 'Other' },
]

export default function ReportModal({ promptId, open, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!reason) return
    setLoading(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId, reason, description }),
      })
      const json = await res.json()
      if (json.success) { toast.success('Report submitted'); onClose() }
      else toast.error(json.error || 'Failed to submit')
    } catch { toast.error('Failed to submit report') }
    finally { setLoading(false) }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <Card className="w-full max-w-md p-6 mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><Flag className="h-4 w-4" /> Report Prompt</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>

        <label className="text-sm font-medium text-slate-700 mb-2 block">Reason</label>
        <div className="space-y-2 mb-4">
          {REASONS.map(r => (
            <label key={r.value} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="reason" value={r.value} onChange={e => setReason(e.target.value)}
                className="text-[#0066CC] focus:ring-[#0066CC]" />
              <span className="text-sm text-slate-700">{r.label}</span>
            </label>
          ))}
        </div>

        <label className="text-sm font-medium text-slate-700 mb-2 block">Description (optional)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
          className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#0066CC] mb-4" placeholder="Additional details..." />

        <Button onClick={submit} disabled={!reason || loading}
          className="w-full bg-[#0066CC] text-white">
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Submit Report
        </Button>
      </Card>
    </div>
  )
}
