import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isSeller) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const to = new Date(now);
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    const prevFrom = new Date(from);
    prevFrom.setDate(prevFrom.getDate() - 30);
    const prevTo = new Date(from);
    prevTo.setDate(prevTo.getDate() - 1);

    const dailySalesRawPromise = db.$queryRawUnsafe<Array<{ day: string; revenue: number; count: bigint }>>(
      `SELECT to_char("createdAt", 'YYYY-MM-DD') AS day,
              COALESCE(SUM("sellerAmount"), 0) AS revenue,
              COUNT(*) AS count
       FROM "Order"
       WHERE "sellerId" = $1 AND status = 'COMPLETED' AND "createdAt" >= $2 AND "createdAt" <= $3
       GROUP BY day ORDER BY day ASC`,
      user.id!, from, to,
    );

    const prevDailySalesRawPromise = db.$queryRawUnsafe<Array<{ day: string; revenue: number; count: bigint }>>(
      `SELECT to_char("createdAt", 'YYYY-MM-DD') AS day,
              COALESCE(SUM("sellerAmount"), 0) AS revenue,
              COUNT(*) AS count
       FROM "Order"
       WHERE "sellerId" = $1 AND status = 'COMPLETED' AND "createdAt" >= $2 AND "createdAt" <= $3
       GROUP BY day ORDER BY day ASC`,
      user.id!, prevFrom, prevTo,
    );

    const promptSalesRawPromise = db.$queryRawUnsafe<Array<{ day: string; promptId: string; title: string; revenue: number; count: bigint }>>(
      `SELECT to_char(o."createdAt", 'YYYY-MM-DD') AS day, o."promptId", p.title,
              COALESCE(SUM(o."sellerAmount"), 0) AS revenue,
              COUNT(*) AS count
       FROM "Order" o JOIN "Prompt" p ON p.id = o."promptId"
       WHERE o."sellerId" = $1 AND o.status = 'COMPLETED' AND o."createdAt" >= $2 AND o."createdAt" <= $3
       GROUP BY day, o."promptId", p.title ORDER BY day ASC`,
      user.id!, from, to,
    );

    const [
      dailySalesRawRes, prevDailySalesRawRes, promptSalesRawRes,
      totalRevenue, totalSales, totalViews, promptsCount, avgRatingAgg,
      allCompletedOrders, allOrders, sellerPrompts, categoryAveragesAgg,
      topPrompts, paymentMethodsRaw,
    ] = await Promise.all([
      dailySalesRawPromise, prevDailySalesRawPromise, promptSalesRawPromise,
      db.order.aggregate({ where: { sellerId: user.id!, status: 'COMPLETED' }, _sum: { sellerAmount: true } }),
      db.order.count({ where: { sellerId: user.id!, status: 'COMPLETED' } }),
      db.prompt.aggregate({ where: { sellerId: user.id! }, _sum: { viewCount: true } }),
      db.prompt.count({ where: { sellerId: user.id! } }),
      db.prompt.aggregate({ where: { sellerId: user.id!, rating: { gt: 0 } }, _avg: { rating: true } }),
      db.order.findMany({
        where: { sellerId: user.id!, status: 'COMPLETED' },
        include: { buyer: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      db.order.findMany({
        where: { sellerId: user.id! },
        select: { id: true, status: true, createdAt: true, amount: true },
      }),
      db.prompt.findMany({
        where: { sellerId: user.id! },
        select: {
          id: true, title: true, price: true, isFree: true, createdAt: true,
          viewCount: true, downloadCount: true, rating: true, categoryId: true,
          tags: true, status: true,
        },
      }),
      db.$queryRawUnsafe<Array<{ categoryId: string; avgPrice: number }>>(
        `SELECT "categoryId", AVG("price") as "avgPrice"
         FROM "Prompt" WHERE status = 'APPROVED' AND "isFree" = false
         GROUP BY "categoryId"`,
      ),
      db.prompt.findMany({
        where: { sellerId: user.id!, status: 'APPROVED' },
        orderBy: { downloadCount: 'desc' },
        take: 10,
        include: { _count: { select: { reviews: true, likes: true } } },
      }),
      db.$queryRawUnsafe<Array<{ method: string; revenue: number; count: bigint }>>(
        `SELECT "paymentMethod" AS method, COALESCE(SUM(amount), 0) AS revenue, COUNT(*) AS count
         FROM "Order" WHERE "sellerId" = $1 AND status = 'COMPLETED'
         GROUP BY method ORDER BY revenue DESC`,
        user.id!,
      ),
    ]);

    function fillDays(rows: { day: string; revenue: number; count: bigint }[], from: Date, to: Date) {
      const map = new Map(rows.map(r => [r.day, r]));
      const filled: any[] = [];
      const cur = new Date(from);
      cur.setHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      while (cur <= end) {
        const key = cur.toISOString().slice(0, 10);
        if (map.has(key)) filled.push(map.get(key)!);
        else filled.push({ day: key, revenue: 0, count: BigInt(0) });
        cur.setDate(cur.getDate() + 1);
      }
      return filled;
    }

    const dailySales = fillDays(dailySalesRawRes, from, to).map(r => ({
      date: new Date(r.day + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      dayStr: r.day,
      revenue: Math.round(Number(r.revenue) * 100) / 100,
      count: Number(r.count),
    }));

    // --- 1. Exponential Smoothing Forecast (next 14 days) ---
    const alpha = 0.3;
    let smoothed = dailySales.length > 0 ? dailySales[0].revenue : 0;
    for (const d of dailySales) {
      smoothed = alpha * d.revenue + (1 - alpha) * smoothed;
    }
    const lastDate = dailySales.length > 0 ? new Date(dailySales[dailySales.length - 1].dayStr + 'T00:00:00') : new Date();
    const residuals = dailySales.map(d => d.revenue - smoothed);
    const stdDev = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / Math.max(residuals.length, 1));
    const forecast: { date: string; predicted: number; lowerBound: number; upperBound: number }[] = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date(lastDate);
      d.setDate(d.getDate() + i);
      const predicted = Math.max(0, Math.round(smoothed * 100) / 100);
      forecast.push({
        date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        predicted,
        lowerBound: Math.max(0, Math.round((predicted - 1.96 * stdDev) * 100) / 100),
        upperBound: Math.round((predicted + 1.96 * stdDev) * 100) / 100,
      });
    }

    // --- 2. Z-score Anomaly Detection ---
    const revenueValues = dailySales.map(d => d.revenue);
    const mean = revenueValues.reduce((s, v) => s + v, 0) / Math.max(revenueValues.length, 1);
    const variance = revenueValues.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(revenueValues.length, 1);
    const sd = Math.sqrt(variance);
    const anomalies = dailySales
      .filter(d => sd > 0 && Math.abs(d.revenue - mean) / sd > 2)
      .map(d => ({
        date: d.date,
        revenue: d.revenue,
        zScore: Math.round((Math.abs(d.revenue - mean) / sd) * 100) / 100,
      }));

    // --- 3. Product Performance Heatmap ---
    const productMap = new Map<string, { title: string; days: Map<string, { revenue: number; count: number }>; total: number }>();
    for (const r of promptSalesRawRes) {
      if (!productMap.has(r.promptId)) {
        productMap.set(r.promptId, { title: r.title, days: new Map(), total: 0 });
      }
      const entry = productMap.get(r.promptId)!;
      entry.days.set(r.day, { revenue: Number(r.revenue), count: Number(r.count) });
      entry.total += Number(r.revenue);
    }
    const productHeatmap = Array.from(productMap.entries())
      .map(([promptId, data]) => ({
        promptId,
        title: data.title,
        totalRevenue: Math.round(data.total * 100) / 100,
        bestDay: Array.from(data.days.entries())
          .sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 3)
          .map(([d, v]) => ({
            day: new Date(d + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            count: v.count,
          })),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // --- 4. Sales Velocity ---
    const promptMap = new Map(sellerPrompts.map(p => [p.id, p]));
    const firstOrderPerPrompt = new Map<string, Date>();
    for (const o of allCompletedOrders) {
      if (!firstOrderPerPrompt.has(o.promptId)) firstOrderPerPrompt.set(o.promptId, o.createdAt);
    }
    const velocityEntries: { promptId: string; title: string; daysToFirstSale: number }[] = [];
    for (const [promptId, firstOrderDate] of firstOrderPerPrompt) {
      const prompt = promptMap.get(promptId);
      if (prompt) {
        const days = Math.round((firstOrderDate.getTime() - prompt.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        velocityEntries.push({ promptId, title: prompt.title, daysToFirstSale: Math.max(0, days) });
      }
    }
    const avgDaysToFirstSale = velocityEntries.length > 0
      ? Math.round(velocityEntries.reduce((s, v) => s + v.daysToFirstSale, 0) / velocityEntries.length)
      : null;
    const dowCount = [0, 0, 0, 0, 0, 0, 0];
    for (const o of allCompletedOrders) dowCount[o.createdAt.getDay()]++;
    const bestDow = dowCount.indexOf(Math.max(...dowCount));
    const dowNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const firstOrderDate = allCompletedOrders.length > 0 ? allCompletedOrders[0].createdAt : null;
    const lastOrderDt = allCompletedOrders.length > 0 ? allCompletedOrders[allCompletedOrders.length - 1].createdAt : new Date();
    const totalDaysSelling = firstOrderDate
      ? Math.max(1, Math.round((lastOrderDt.getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    const avgSalesPerDay = totalDaysSelling > 0
      ? Math.round((allCompletedOrders.length / totalDaysSelling) * 100) / 100
      : 0;

    // --- 5. Customer Insights ---
    const buyerMap = new Map<string, { name: string; email: string; totalSpent: number; orderCount: number }>();
    for (const o of allCompletedOrders) {
      if (!buyerMap.has(o.buyerId)) {
        buyerMap.set(o.buyerId, { name: o.buyer.name, email: o.buyer.email, totalSpent: 0, orderCount: 0 });
      }
      const b = buyerMap.get(o.buyerId)!;
      b.totalSpent += o.sellerAmount;
      b.orderCount++;
    }
    const buyers = Array.from(buyerMap.values());
    const totalBuyers = buyers.length;
    const repeatBuyers = buyers.filter(b => b.orderCount > 1).length;
    const avgCustomerSpend = totalBuyers > 0
      ? Math.round((buyers.reduce((s, b) => s + b.totalSpent, 0) / totalBuyers) * 100) / 100
      : 0;
    const topBuyer = buyers.sort((a, b) => b.totalSpent - a.totalSpent)[0] || null;

    // --- 6. Pricing Optimization ---
    const catAvgMap = new Map(categoryAveragesAgg.map(c => [c.categoryId, Number(c.avgPrice)]));
    const pricingInsights = sellerPrompts
      .filter(p => !p.isFree && p.status === 'APPROVED')
      .map(p => {
        const catAvg = catAvgMap.get(p.categoryId) || 0;
        const suggestedPrice = catAvg > 0 ? Math.round(catAvg * 100) / 100 : p.price;
        const potentialUplift = suggestedPrice > p.price ? (suggestedPrice - p.price) * (p.downloadCount || 0) : 0;
        return {
          promptId: p.id,
          title: p.title,
          currentPrice: p.price,
          categoryAvg: Math.round(catAvg * 100) / 100,
          suggestedPrice,
          potentialRevenueUplift: Math.round(potentialUplift * 100) / 100,
          downloads: p.downloadCount,
        };
      })
      .sort((a, b) => b.potentialRevenueUplift - a.potentialRevenueUplift);

    // --- 7. Refund Rate ---
    const refundStatuses = ['CANCELLED', 'REFUNDED', 'FAILED', 'CHARGEBACK'];
    const refundedOrders = allOrders.filter(o => refundStatuses.includes(o.status));
    const refundRate = allOrders.length > 0
      ? Math.round((refundedOrders.length / allOrders.length) * 10000) / 100
      : 0;
    const refundStatusCount = new Map<string, number>();
    for (const o of refundedOrders) {
      refundStatusCount.set(o.status, (refundStatusCount.get(o.status) || 0) + 1);
    }
    const refundBreakdown = Array.from(refundStatusCount.entries()).map(([status, count]) => ({ status, count }));

    // --- 8. Period-over-period ---
    const prevDailySales = fillDays(prevDailySalesRawRes, prevFrom, prevTo);
    const prevRevenue = prevDailySales.reduce((s, r) => s + Number(r.revenue), 0);
    const prevSalesCount = prevDailySales.reduce((s, r) => s + Number(r.count), 0);
    const currentRevenue = dailySales.reduce((s, d) => s + d.revenue, 0);
    const currentSalesCount = dailySales.reduce((s, d) => s + d.count, 0);
    const revenueChange = prevRevenue > 0
      ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 10000) / 100
      : currentRevenue > 0 ? 100 : 0;
    const salesChange = prevSalesCount > 0
      ? Math.round(((currentSalesCount - prevSalesCount) / prevSalesCount) * 10000) / 100
      : currentSalesCount > 0 ? 100 : 0;

    // --- 9. Trending Keywords ---
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'are', 'you',
      'can', 'all', 'has', 'not', 'but', 'was', 'what', 'why', 'how', 'its',
      'per', 'via', 'use', 'using', 'get', 'our', 'new', 'top', 'best', 'pro',
      'max', 'ultra', 'mini', 'gpt', 'ai', 'chat', 'prompt', 'prompts', 'like',
      'just', 'more', 'also', 'have', 'been', 'some', 'them', 'their', 'they',
      'will', 'would', 'each', 'could', 'about', 'than', 'after', 'then', 'into',
      'over', 'such', 'only', 'other', 'very', 'most', 'many', 'these', 'those',
      'make', 'made', 'used', 'based', 'well', 'much', 'down', 'back', 'still',
      'where', 'which', 'when', 'there',
    ]);
    const wordFreq = new Map<string, number>();
    for (const p of sellerPrompts) {
      const words = (p.title + ' ' + (p.tags || '')).toLowerCase().split(/[\s,]+/);
      for (const w of words) {
        const clean = w.replace(/[^a-z0-9]/g, '');
        if (clean.length > 2 && !stopWords.has(clean)) {
          wordFreq.set(clean, (wordFreq.get(clean) || 0) + 1);
        }
      }
    }
    const trendingKeywords = Array.from(wordFreq.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    let aiRecommendations: any = null;
    try {
      const res = await fetch(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/api/v1/recommendations/trending?top_n=5`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        aiRecommendations = data.data || null;
      }
    } catch (e) { console.error('[seller/analytics] ai recommendations error', e); }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue: Math.round(Number(totalRevenue._sum.sellerAmount || 0) * 100) / 100,
          totalSales,
          totalViews: Number(totalViews._sum.viewCount || 0),
          promptsCount,
          avgRating: avgRatingAgg._avg.rating ? Math.round(Number(avgRatingAgg._avg.rating) * 10) / 10 : 0,
          refundRate,
          repeatBuyerRate: totalBuyers > 0 ? Math.round((repeatBuyers / totalBuyers) * 10000) / 100 : 0,
        },
        dailySales,
        topPrompts: topPrompts.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          isFree: p.isFree,
          downloads: p.downloadCount,
          views: p.viewCount,
          rating: p.rating,
          likes: p._count.likes,
          reviews: p._count.reviews,
          status: p.status,
        })),
        paymentBreakdown: paymentMethodsRaw.map(p => ({
          method: p.method,
          revenue: Math.round(Number(p.revenue) * 100) / 100,
          count: Number(p.count),
        })),
        recommendations: aiRecommendations,
        forecast,
        anomalies,
        productHeatmap,
        salesVelocity: {
          avgDaysToFirstSale,
          bestSellingDay: dowNames[bestDow],
          avgSalesPerDay,
          velocityByPrompt: velocityEntries,
        },
        customerInsights: {
          totalBuyers,
          repeatBuyers,
          avgCustomerSpend,
          topBuyer: topBuyer
            ? {
                name: topBuyer.name,
                email: topBuyer.email,
                totalSpent: Math.round(topBuyer.totalSpent * 100) / 100,
              }
            : null,
        },
        pricingInsights,
        periodComparison: {
          revenueChange,
          salesChange,
          currentRevenue: Math.round(currentRevenue * 100) / 100,
          prevRevenue: Math.round(prevRevenue * 100) / 100,
          currentSales: currentSalesCount,
          prevSales: prevSalesCount,
        },
        trendingKeywords,
        refundBreakdown,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
