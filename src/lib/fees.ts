import { db } from './db'

export interface FeeConfig {
  commissionRate: number    // % like Amazon referral fee (default 15)
  gstRate: number           // GST on digital goods in India (default 18)
  closingFee: number        // Fixed fee per order like Amazon closing fee (default 0.50)
  paymentFeeRate: number    // Payment processing % (default 2.5)
  minCommission: number     // Minimum commission per transaction (default 0)
  maxCommission: number     // Maximum commission per transaction (default 0 = unlimited)
  enabled: boolean
}

export interface FeeBreakdown {
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

export const DEFAULT_FEE_CONFIG: FeeConfig = {
  commissionRate: 15,
  gstRate: 18,
  closingFee: 0.50,
  paymentFeeRate: 2.5,
  minCommission: 0,
  maxCommission: 0,
  enabled: true,
}

export async function getFeeConfig(): Promise<FeeConfig> {
  try {
    const settings = await db.platformSettings.findUnique({ where: { key: 'fee_config' } })
    if (settings?.value) {
      return { ...DEFAULT_FEE_CONFIG, ...JSON.parse(settings.value) }
    }
  } catch {}
  return DEFAULT_FEE_CONFIG
}

export function calculateFees(
  amount: number, 
  config: FeeConfig,
  promptLength?: number,
  categoryName?: string
): FeeBreakdown {
  let effectiveCommissionRate = config.commissionRate

  // Apply Category Modifiers
  if (categoryName) {
    const lowerCategory = categoryName.toLowerCase()
    if (lowerCategory.includes('midjourney') || lowerCategory.includes('chatgpt')) {
      effectiveCommissionRate += 2 // Saturated categories have higher commission
    } else if (lowerCategory.includes('code') || lowerCategory.includes('development')) {
      effectiveCommissionRate -= 2 // Niche categories have lower commission
    }
  }

  // Apply Prompt Length Modifiers
  if (promptLength !== undefined) {
    if (promptLength < 100) {
      effectiveCommissionRate += 2 // Short prompts = higher commission
    } else if (promptLength > 500) {
      effectiveCommissionRate -= 2 // Long prompts = lower commission
    }
  }

  // Ensure commission doesn't go below 5% or above 30%
  if (effectiveCommissionRate < 5) effectiveCommissionRate = 5
  if (effectiveCommissionRate > 30) effectiveCommissionRate = 30

  if (amount <= 0) {
    return {
      grossAmount: 0, commissionRate: effectiveCommissionRate, commissionAmt: 0,
      gstRate: config.gstRate, gstAmt: 0, closingFee: 0,
      paymentFeeRate: config.paymentFeeRate, paymentFeeAmt: 0,
      totalFees: 0, netAmount: 0,
    }
  }

  let commissionAmt = amount * (effectiveCommissionRate / 100)
  if (config.minCommission > 0 && commissionAmt < config.minCommission) commissionAmt = config.minCommission
  if (config.maxCommission > 0 && commissionAmt > config.maxCommission) commissionAmt = config.maxCommission

  const closingFee = config.closingFee
  const paymentFeeAmt = amount * (config.paymentFeeRate / 100)

  // GST is applicable on the service fees (commission + closing fee + payment fee) in India
  const taxableFees = commissionAmt + closingFee + paymentFeeAmt
  const gstAmt = taxableFees * (config.gstRate / 100)

  const totalFees = commissionAmt + closingFee + paymentFeeAmt + gstAmt
  const netAmount = amount - totalFees

  return {
    grossAmount: amount,
    commissionRate: effectiveCommissionRate, commissionAmt: parseFloat(commissionAmt.toFixed(2)),
    gstRate: config.gstRate, gstAmt: parseFloat(gstAmt.toFixed(2)),
    closingFee: parseFloat(closingFee.toFixed(2)),
    paymentFeeRate: config.paymentFeeRate, paymentFeeAmt: parseFloat(paymentFeeAmt.toFixed(2)),
    totalFees: parseFloat(totalFees.toFixed(2)),
    netAmount: parseFloat(netAmount.toFixed(2)),
  }
}
