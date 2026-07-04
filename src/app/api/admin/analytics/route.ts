import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// Data Science Utility Functions
// =============================================================================

function fillDays<T extends { day: string }>(rows: T[], from: Date, to: Date, defaults?: Partial<T>): T[] {
  const map = new Map(rows.map(r => [r.day, r]));
  const filled: T[] = [];
  const cur = new Date(from); cur.setHours(0, 0, 0, 0);
  const end = new Date(to); end.setHours(23, 59, 59, 999);
  while (cur <= end) {
    const key = cur.toISOString().slice(0, 10);
    filled.push(map.has(key) ? map.get(key)! : { day: key, ...defaults } as T);
    cur.setDate(cur.getDate() + 1);
  }
  return filled;
}

/** Simple moving average smoothing */
function movingAverage(series: number[], window: number): number[] {
  return series.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = series.slice(start, i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

/** Exponential smoothing forecast (Holt-Winters style) */
function expSmoothingForecast(series: { value: number }[], forecastDays = 7): { forecast: { day: string; value: number }[]; model: { alpha: number; level: number; trend: number; mse: number } } {
  const n = series.length;
  if (n < 4) return { forecast: [], model: { alpha: 0, level: 0, trend: 0, mse: 0 } };

  const values = series.map(s => s.value);
  let bestAlpha = 0.3;
  let bestMse = Infinity;

  for (let alpha = 0.05; alpha <= 0.95; alpha += 0.05) {
    let level = values[0];
    let trend = values[1] - values[0] || 0;
    let mse = 0;
    for (let i = 1; i < n; i++) {
      const prevLevel = level;
      level = alpha * values[i] + (1 - alpha) * (level + trend);
      trend = alpha * (level - prevLevel) + (1 - alpha) * trend;
      mse += (values[i] - level) ** 2;
    }
    mse /= n;
    if (mse < bestMse) { bestMse = mse; bestAlpha = alpha; }
  }

  let level = values[0];
  let trend = values[1] - values[0] || 0;
  for (let i = 1; i < n; i++) {
    const prevLevel = level;
    level = bestAlpha * values[i] + (1 - bestAlpha) * (level + trend);
    trend = bestAlpha * (level - prevLevel) + (1 - bestAlpha) * trend;
  }

  const forecast = Array.from({ length: forecastDays }, (_, i) => ({
    day: `fc+${i + 1}`,
    value: Math.max(0, Math.round((level + (i + 1) * trend) * 100) / 100),
  }));

  return { forecast, model: { alpha: Math.round(bestAlpha * 100) / 100, level: Math.round(level * 100) / 100, trend: Math.round(trend * 100) / 100, mse: Math.round(bestMse * 100) / 100 } };
}

/** Seasonal decomposition (additive model: trend + seasonal + residual) */
function seasonalDecompose(series: { value: number }[], period = 7): { trend: number[]; seasonal: number[]; residual: number[] } {
  const n = series.length;
  if (n < period * 2) return { trend: [], seasonal: [], residual: [] };
  const values = series.map(s => s.value);

  // Trend: centered moving average
  const trend = values.map((_, i) => {
    const half = Math.floor(period / 2);
    const start = Math.max(0, i - half);
    const end = Math.min(n, i + half + 1);
    const slice = values.slice(start, end);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });

  // Detrended
  const detrended = values.map((v, i) => v - trend[i]);

  // Seasonal: average detrended by position in period
  const seasonalAvg = Array(period).fill(0);
  const seasonalCount = Array(period).fill(0);
  detrended.forEach((v, i) => { seasonalAvg[i % period] += v; seasonalCount[i % period]++; });
  const seasonalPattern = seasonalAvg.map((s, i) => seasonalCount[i] > 0 ? s / seasonalCount[i] : 0);

  // Normalize seasonal to sum to zero
  const seasonalMean = seasonalPattern.reduce((a, b) => a + b, 0) / period;
  const seasonal = seasonalPattern.map(s => Math.round((s - seasonalMean) * 100) / 100);

  const seasonalFull = values.map((_, i) => seasonal[i % period]);
  const residual = values.map((v, i) => Math.round((v - (trend[i] || 0) - (seasonalFull[i] || 0)) * 100) / 100);

  return { trend: trend.map(v => Math.round(v * 100) / 100), seasonal, residual };
}

/** Z-score anomaly detection */
function detectAnomalies(series: { day: string; value: number }[], threshold = 2.5) {
  if (series.length < 5) return [];
  const values = series.map(s => s.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length);
  if (std === 0) return [];
  return series.map(s => ({ ...s, zScore: (s.value - mean) / std }))
    .filter(s => Math.abs(s.zScore) > threshold)
    .map(s => ({ day: s.day, value: s.value, zScore: Math.round(s.zScore * 100) / 100, type: s.zScore > 0 ? 'spike' : 'drop' as const }));
}

/** IQR-based outlier detection (more robust than Z-score) */
function iqrOutliers(series: { day: string; value: number }[]) {
  if (series.length < 10) return [];
  const values = series.map(s => s.value).sort((a, b) => a - b);
  const q1 = values[Math.floor(values.length * 0.25)];
  const q3 = values[Math.floor(values.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return series.filter(s => s.value < lower || s.value > upper)
    .map(s => ({ day: s.day, value: s.value, type: s.value < lower ? 'low' : 'high' as const }));
}

/** Weekly retention cohort builder */
async function buildRetentionCohorts(): Promise<any[]> {
  const cohorts: any[] = await db.$queryRawUnsafe(
    `WITH user_cohort AS (
       SELECT id, DATE_TRUNC('week', "createdAt")::date AS cohort_week, "createdAt"
       FROM "User"
     ),
     user_orders AS (
       SELECT uc.id, uc.cohort_week,
              DATE_TRUNC('week', o."createdAt")::date AS order_week,
              EXTRACT(WEEK FROM o."createdAt") - EXTRACT(WEEK FROM uc."createdAt") AS week_offset
       FROM user_cohort uc
       LEFT JOIN "Order" o ON o."buyerId" = uc.id AND o.status = 'COMPLETED'
     )
     SELECT cohort_week, week_offset,
            COUNT(DISTINCT id) AS users,
            COUNT(DISTINCT CASE WHEN order_week IS NOT NULL THEN id END) AS active
     FROM user_orders
     WHERE week_offset >= 0 AND week_offset <= 12
     GROUP BY cohort_week, week_offset
     ORDER BY cohort_week, week_offset`
  );

  const cohortMap = new Map<string, Map<number, { users: number; active: number }>>();
  for (const row of cohorts) {
    const w = row.cohort_week instanceof Date ? row.cohort_week.toISOString().slice(0, 10) : String(row.cohort_week).slice(0, 10);
    if (!cohortMap.has(w)) cohortMap.set(w, new Map());
    cohortMap.get(w)!.set(Number(row.week_offset), { users: Number(row.users), active: Number(row.active) });
  }

  return Array.from(cohortMap.entries()).slice(-10).map(([week, offsets]) => ({
    cohort: week,
    sizes: Array.from({ length: 12 }, (_, i) => {
      const data = offsets.get(i);
      return { week: i, users: data?.users || 0, active: data?.active || 0, retention: data && data.users > 0 ? Math.round((data.active / data.users) * 10000) / 100 : 0 };
    }),
    totalUsers: offsets.get(0)?.users || 0,
  }));
}

/** Sales funnel builder */
async function buildFunnel(from: Date, to: Date): Promise<{ stage: string; count: number; dropRate: number }[]> {
  const [visitors, cartAdds, ordersStarted, ordersCompleted] = await Promise.all([
    db.activityLog.count({ where: { action: 'PAGE_VIEW', createdAt: { gte: from, lte: to } } }),
    db.activityLog.count({ where: { action: 'ADD_TO_CART', createdAt: { gte: from, lte: to } } }),
    db.order.count({ where: { createdAt: { gte: from, lte: to } } }),
    db.order.count({ where: { status: 'COMPLETED', createdAt: { gte: from, lte: to } } }),
  ]);

  const stages = [
    { stage: 'Visitors', count: Math.max(visitors, 1) },
    { stage: 'Add to Cart', count: cartAdds },
    { stage: 'Orders Started', count: ordersStarted },
    { stage: 'Completed', count: ordersCompleted },
  ];

  return stages.map((s, i) => ({
    ...s,
    dropRate: i > 0 ? Math.round((1 - s.count / stages[i - 1].count) * 10000) / 100 : 0,
  }));
}

// =============================================================================
// Main Analytics Endpoint
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : now;
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 90);
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : defaultFrom;
    const reportPeriod = searchParams.get('period') || '90d';

    // Calculate previous period for comparison
    const periodDays = reportPeriod === '30d' ? 30 : reportPeriod === '90d' ? 90 : 7;
    const prevFrom = new Date(from);
    prevFrom.setDate(prevFrom.getDate() - periodDays);
    const prevTo = new Date(to);
    prevTo.setDate(prevTo.getDate() - periodDays);

    // =====================================================================
    // 1. Daily revenue + orders + users + prompts (current period)
    // =====================================================================
    const [dailyRevenueRaw, dailyOrdersRaw, dailyUsersRaw, dailyPromptsRaw, dailySellersRaw] = await Promise.all([
      db.$queryRawUnsafe<Array<{ day: string; total: number }>>(
        `SELECT to_char("createdAt", 'YYYY-MM-DD') AS day, SUM(amount) AS total FROM "Order" WHERE status='COMPLETED' AND "createdAt">=$1 AND "createdAt"<=$2 GROUP BY day ORDER BY day`, from, to),
      db.$queryRawUnsafe<Array<{ day: string; count: bigint }>>(
        `SELECT to_char("createdAt", 'YYYY-MM-DD') AS day, COUNT(*) AS count FROM "Order" WHERE "createdAt">=$1 AND "createdAt"<=$2 GROUP BY day ORDER BY day`, from, to),
      db.$queryRawUnsafe<Array<{ day: string; count: bigint }>>(
        `SELECT to_char("createdAt", 'YYYY-MM-DD') AS day, COUNT(*) AS count FROM "User" WHERE "createdAt">=$1 AND "createdAt"<=$2 GROUP BY day ORDER BY day`, from, to),
      db.$queryRawUnsafe<Array<{ day: string; count: bigint }>>(
        `SELECT to_char("createdAt", 'YYYY-MM-DD') AS day, COUNT(*) AS count FROM "Prompt" WHERE "createdAt">=$1 AND "createdAt"<=$2 GROUP BY day ORDER BY day`, from, to),
      db.$queryRawUnsafe<Array<{ day: string; count: bigint }>>(
        `SELECT to_char("createdAt", 'YYYY-MM-DD') AS day, COUNT(*) AS count FROM "User" WHERE "isSeller"=true AND "createdAt">=$1 AND "createdAt"<=$2 GROUP BY day ORDER BY day`, from, to),
    ]);

    // =====================================================================
    // 2. Top categories with full metrics
    // =====================================================================
    const topCategoriesRaw = await db.$queryRawUnsafe<Array<{ name: string; revenue: number; orders: bigint; avgPrice: number; sellers: bigint; prompts: bigint; refunds: number }>>(
      `SELECT c.name,
              COALESCE(SUM(o.amount), 0) AS revenue,
              COUNT(o.id) AS orders,
              COALESCE(AVG(NULLIF(p.price, 0)), 0) AS "avgPrice",
              COUNT(DISTINCT p."sellerId") AS sellers,
              COUNT(DISTINCT p.id) AS prompts,
              COALESCE(SUM(CASE WHEN o.status='REFUNDED' THEN o.amount ELSE 0 END), 0) AS refunds
       FROM "Category" c
       LEFT JOIN "Prompt" p ON p."categoryId" = c.id
       LEFT JOIN "Order" o ON o."promptId" = p.id AND o."createdAt">=$1 AND o."createdAt"<=$2
       GROUP BY c.id ORDER BY revenue DESC LIMIT 20`, from, to);

    // =====================================================================
    // 3. Revenue by payment method with full stats
    // =====================================================================
    const revenueByMethodRaw = await db.$queryRawUnsafe<Array<{ paymentMethod: string; revenue: number; count: bigint; avgAmount: number }>>(
      `SELECT "paymentMethod", COALESCE(SUM(amount), 0) AS revenue, COUNT(*) AS count,
              COALESCE(AVG(amount), 0) AS "avgAmount"
       FROM "Order" WHERE status='COMPLETED' AND "createdAt">=$1 AND "createdAt"<=$2
       GROUP BY "paymentMethod" ORDER BY revenue DESC`, from, to);

    // =====================================================================
    // 4. Seasonality (hour, day-of-week, month)
    // =====================================================================
    const [hourlyRaw, dowRaw, monthlyRaw] = await Promise.all([
      db.$queryRawUnsafe<Array<{ hour: number; count: bigint }>>(
        `SELECT EXTRACT(HOUR FROM "createdAt")::int AS hour, COUNT(*) AS count FROM "Order" WHERE "createdAt">=$1 AND "createdAt"<=$2 GROUP BY hour ORDER BY hour`, from, to),
      db.$queryRawUnsafe<Array<{ dow: number; count: bigint }>>(
        `SELECT EXTRACT(DOW FROM "createdAt")::int AS dow, COUNT(*) AS count FROM "Order" WHERE "createdAt">=$1 AND "createdAt"<=$2 GROUP BY dow ORDER BY dow`, from, to),
      db.$queryRawUnsafe<Array<{ month: number; count: bigint }>>(
        `SELECT EXTRACT(MONTH FROM "createdAt")::int AS month, COUNT(*) AS count FROM "Order" WHERE "createdAt">=$1 AND "createdAt"<=$2 GROUP BY month ORDER BY month`, from, to),
    ]);

    // =====================================================================
    // 5. Top sellers with full metrics
    // =====================================================================
    const topSellersRaw = await db.$queryRawUnsafe<Array<{ id: string; name: string; email: string; revenue: number; sales: bigint; promptCount: bigint; avgRating: number; refundRate: number }>>(
      `SELECT u.id, u.name, u.email,
              COALESCE(SUM(o.amount), 0) AS revenue,
              COUNT(o.id) AS sales,
              (SELECT COUNT(*) FROM "Prompt" p WHERE p."sellerId"=u.id AND p.status='APPROVED') AS "promptCount",
              (SELECT COALESCE(AVG(p2.rating), 0) FROM "Prompt" p2 WHERE p2."sellerId"=u.id) AS "avgRating",
              COALESCE(SUM(CASE WHEN o.status='REFUNDED' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(o.id), 0), 0) AS "refundRate"
       FROM "User" u
       JOIN "Order" o ON o."sellerId"=u.id AND o.status='COMPLETED' AND o."createdAt">=$1 AND o."createdAt"<=$2
       GROUP BY u.id ORDER BY revenue DESC LIMIT 20`, from, to);

    // =====================================================================
    // Summary aggregations (current vs previous period for YoY/period-over-period)
    // =====================================================================
    const [curAgg, prevAgg, curOrders, prevOrders, curUsers, prevUsers, curSellers, prevSellers, curPrompts, prevPrompts, totalUsersCount, pendingPrompts, totalSellers] = await Promise.all([
      db.order.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: from, lte: to } }, _sum: { amount: true } }),
      db.order.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: prevFrom, lte: prevTo } }, _sum: { amount: true } }),
      db.order.count({ where: { createdAt: { gte: from, lte: to } } }),
      db.order.count({ where: { createdAt: { gte: prevFrom, lte: prevTo } } }),
      db.user.count({ where: { createdAt: { gte: from, lte: to } } }),
      db.user.count({ where: { createdAt: { gte: prevFrom, lte: prevTo } } }),
      db.user.count({ where: { isSeller: true, createdAt: { gte: from, lte: to } } }),
      db.user.count({ where: { isSeller: true, createdAt: { gte: prevFrom, lte: prevTo } } }),
      db.prompt.count({ where: { createdAt: { gte: from, lte: to } } }),
      db.prompt.count({ where: { createdAt: { gte: prevFrom, lte: prevTo } } }),
      db.user.count(),
      db.prompt.count({ where: { status: 'PENDING' } }),
      db.user.count({ where: { isSeller: true } }),
    ]);

    const curRevenue = Number(curAgg._sum.amount) || 0;
    const prevRevenue = Number(prevAgg._sum.amount) || 0;
    const revenueGrowth = prevRevenue > 0 ? Math.round(((curRevenue - prevRevenue) / prevRevenue) * 10000) / 100 : 0;
    const orderGrowth = prevOrders > 0 ? Math.round(((curOrders - prevOrders) / prevOrders) * 10000) / 100 : 0;
    const userGrowth = prevUsers > 0 ? Math.round(((curUsers - prevUsers) / prevUsers) * 10000) / 100 : 0;
    const avgOrderValue = curOrders > 0 ? curRevenue / curOrders : 0;
    const conversionRate = totalUsersCount > 0 ? (curOrders / totalUsersCount) * 100 : 0;

    // =====================================================================
    // 6. Format daily series
    // =====================================================================
    const dailyRevenue = fillDays(dailyRevenueRaw, from, to, { total: 0 }).map(r => ({
      date: new Date(r.day + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      revenue: Math.round(Number(r.total || 0) * 100) / 100,
    }));

    const dailyOrders = fillDays(dailyOrdersRaw, from, to, { count: BigInt(0) }).map(r => ({
      date: new Date(r.day + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      count: Number(r.count || 0),
    }));

    const dailyUsers = fillDays(dailyUsersRaw, from, to, { count: BigInt(0) }).map(r => ({
      date: new Date(r.day + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      count: Number(r.count || 0),
    }));

    const dailyPrompts = fillDays(dailyPromptsRaw, from, to, { count: BigInt(0) }).map(r => ({
      date: new Date(r.day + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      count: Number(r.count || 0),
    }));

    const dailySellers = fillDays(dailySellersRaw, from, to, { count: BigInt(0) }).map(r => ({
      date: new Date(r.day + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      count: Number(r.count || 0),
    }));

    // =====================================================================
    // 7. Time Series Forecasting (exponential smoothing)
    // =====================================================================
    const revenueSeries = dailyRevenue.map(r => ({ value: r.revenue }));
    const forecast = expSmoothingForecast(revenueSeries, 14);

    // =====================================================================
    // 8. Anomaly Detection (Z-score + IQR)
    // =====================================================================
    const revenueAnomaliesZ = detectAnomalies(
      dailyRevenue.map(r => ({ day: r.date, value: r.revenue })),
      2.5
    );
    const revenueOutliersIQR = iqrOutliers(
      dailyRevenue.map(r => ({ day: r.date, value: r.revenue }))
    );

    // =====================================================================
    // 9. Seasonal Decomposition
    // =====================================================================
    const decomposition = seasonalDecompose(revenueSeries);
    const currentPattern = decomposition.seasonal.length > 0
      ? decomposition.seasonal.map((v, i) => ({ period: i + 1, effect: v }))
      : [];

    // =====================================================================
    // 10. Retention Cohorts (weekly)
    // =====================================================================
    const retentionCohorts = await buildRetentionCohorts();

    // =====================================================================
    // 11. Sales Funnel
    // =====================================================================
    const funnel = await buildFunnel(from, to);

    // =====================================================================
    // 12. Growth Alerts (automated insights)
    // =====================================================================
    const growthAlerts: { type: 'positive' | 'negative' | 'info'; metric: string; message: string; delta: number }[] = [];
    if (revenueGrowth > 10) growthAlerts.push({ type: 'positive', metric: 'Revenue', message: `Revenue grew ${revenueGrowth}% vs previous period`, delta: revenueGrowth });
    else if (revenueGrowth < -10) growthAlerts.push({ type: 'negative', metric: 'Revenue', message: `Revenue dropped ${Math.abs(revenueGrowth)}% vs previous period`, delta: revenueGrowth });
    if (orderGrowth > 15) growthAlerts.push({ type: 'positive', metric: 'Orders', message: `Orders increased ${orderGrowth}% period-over-period`, delta: orderGrowth });
    else if (orderGrowth < -15) growthAlerts.push({ type: 'negative', metric: 'Orders', message: `Orders decreased ${Math.abs(orderGrowth)}% period-over-period`, delta: orderGrowth });
    if (userGrowth > 20) growthAlerts.push({ type: 'positive', metric: 'Users', message: `User acquisition surged ${userGrowth}%`, delta: userGrowth });
    if (pendingPrompts > 10) growthAlerts.push({ type: 'info', metric: 'Moderation', message: `${pendingPrompts} prompts pending review`, delta: pendingPrompts });
    if (revenueOutliersIQR.length > 0) growthAlerts.push({ type: 'negative', metric: 'Anomaly', message: `${revenueOutliersIQR.length} unusual revenue days detected (IQR)`, delta: revenueOutliersIQR.length });

    // =====================================================================
    // 13. Predictive insights
    // =====================================================================
    const predictedNextMonth = forecast.forecast.slice(0, 30).reduce((s, f) => s + f.value, 0);
    const currentMonthlyRunRate = dailyRevenue.slice(-30).reduce((s, d) => s + d.revenue, 0);
    const predictedGrowth = currentMonthlyRunRate > 0
      ? Math.round(((predictedNextMonth - currentMonthlyRunRate) / currentMonthlyRunRate) * 10000) / 100
      : 0;

    // =====================================================================
    // Assemble response
    // =====================================================================
    return NextResponse.json({
      success: true,
      data: {
        // Raw time series
        dailyRevenue,
        dailyOrders,
        dailyUsers,
        dailyPrompts,
        dailySellers,
        // Categorical breakdowns
        topCategories: topCategoriesRaw.map(r => ({
          name: r.name,
          revenue: Math.round(Number(r.revenue) * 100) / 100,
          orders: Number(r.orders),
          avgPrice: Math.round(Number(r.avgPrice) * 100) / 100,
          sellers: Number(r.sellers),
          prompts: Number(r.prompts),
          refunds: Math.round(Number(r.refunds) * 100) / 100,
        })),
        revenueByPaymentMethod: revenueByMethodRaw.map(r => ({
          method: r.paymentMethod || 'Unknown',
          revenue: Math.round(Number(r.revenue) * 100) / 100,
          count: Number(r.count),
          avgAmount: Math.round(Number(r.avgAmount) * 100) / 100,
        })),
        topSellers: topSellersRaw.map(r => ({
          id: r.id, name: r.name, email: r.email,
          revenue: Math.round(Number(r.revenue) * 100) / 100,
          sales: Number(r.sales),
          promptCount: Number(r.promptCount),
          avgRating: Math.round(Number(r.avgRating) * 100) / 100,
          refundRate: Math.round(Number(r.refundRate) * 10000) / 100,
        })),
        // Seasonality
        hourlyOrders: hourlyRaw.map(r => ({ hour: r.hour, count: Number(r.count) })),
        dowOrders: dowRaw.map(r => ({ dow: r.dow, count: Number(r.count) })),
        monthlyOrders: monthlyRaw.map(r => ({ month: r.month, count: Number(r.count) })),
        // Data Science
        forecast,
        decomposition: { seasonalPattern: currentPattern, trend: decomposition.trend },
        anomalies: { zScore: revenueAnomaliesZ, iqr: revenueOutliersIQR },
        retention: retentionCohorts,
        funnel,
        // Growth alerts & predictive insights
        growthAlerts,
        predictiveInsights: {
          predictedNextMonthRevenue: Math.round(predictedNextMonth * 100) / 100,
          currentMonthlyRunRate: Math.round(currentMonthlyRunRate * 100) / 100,
          predictedGrowth,
          forecastModel: forecast.model,
        },
        // Summary with period-over-period
        summary: {
          totalRevenue: Math.round(curRevenue * 100) / 100,
          totalOrders: curOrders,
          newUsers: curUsers,
          newSellers: curSellers,
          newPrompts: curPrompts,
          avgOrderValue: Math.round(avgOrderValue * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100,
          pendingPrompts,
          totalSellers,
          totalUsers: totalUsersCount,
          // Growth metrics
          revenueGrowth,
          orderGrowth,
          userGrowth,
          prevRevenue: Math.round(prevRevenue * 100) / 100,
          prevOrders,
          prevUsers,
        },
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Internal server error' }, { status: 500 });
  }
}
