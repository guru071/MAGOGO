import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30d'
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const since = new Date()
    since.setDate(since.getDate() - days)

    const [, totalRevenue, recentOrders] = await Promise.all([
      db.platformRevenue.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
      }),
      db.platformRevenue.aggregate({
        _sum: { commission: true, gst: true, closingFee: true, paymentFee: true, total: true },
      }),
      db.order.findMany({
        where: { createdAt: { gte: since } },
        include: { prompt: { select: { title: true } }, revenue: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ])

    // Daily revenue chart data
    const dailyMap = new Map<string, { commission: number; gst: number; closingFee: number; paymentFee: number; total: number; orders: number }>()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      dailyMap.set(key, { commission: 0, gst: 0, closingFee: 0, paymentFee: 0, total: 0, orders: 0 })
    }
    for (const r of recentOrders) {
      if (r.revenue) {
        const key = r.createdAt.toISOString().slice(0, 10)
        if (dailyMap.has(key)) {
          const d = dailyMap.get(key)!
          d.commission += r.revenue.commission
          d.gst += r.revenue.gst
          d.closingFee += r.revenue.closingFee
          d.paymentFee += r.revenue.paymentFee
          d.total += r.revenue.total
          d.orders += 1
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalCommission: totalRevenue._sum.commission || 0,
          totalGst: totalRevenue._sum.gst || 0,
          totalClosingFee: totalRevenue._sum.closingFee || 0,
          totalPaymentFee: totalRevenue._sum.paymentFee || 0,
          totalRevenue: totalRevenue._sum.total || 0,
        },
        daily: Array.from(dailyMap.entries()).map(([date, vals]) => ({ date, ...vals })),
        orders: recentOrders.map(o => ({
          id: o.orderId,
          prompt: o.prompt.title,
          amount: o.amount,
          status: o.status,
          fees: o.revenue ? {
            commission: o.revenue.commission,
            gst: o.revenue.gst,
            closingFee: o.revenue.closingFee,
            paymentFee: o.revenue.paymentFee,
            total: o.revenue.total,
          } : null,
          date: o.createdAt,
        })),
      },
    })
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
