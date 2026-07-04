const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

interface AIClientOptions {
  timeout?: number;
  retries?: number;
}

async function callAI<T>(
  endpoint: string,
  body: unknown,
  options: AIClientOptions = {}
): Promise<{ success: boolean; data: T } | { success: false; error: string }> {
  const { timeout = 5000, retries = 1 } = options;
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(id);

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        lastError = `AI service error ${res.status}: ${text.slice(0, 200)}`;
        continue;
      }
      return await res.json();
    } catch (e: any) {
      lastError = e.message || 'AI service unreachable';
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
    }
  }
  return { success: false, error: lastError || 'AI service unreachable' };
}

export const ai = {
  search: {
    rank: (query: string, prompts: any[], userId?: string, topN = 20) =>
      callAI('/api/v1/search/rank', { query, prompts, user_id: userId, top_n: topN }),

    suggest: (query: string, topN = 5) =>
      fetch(`${AI_SERVICE_URL}/api/v1/search/suggest?query=${encodeURIComponent(query)}&top_n=${topN}`, {
        method: 'POST',
      }).then(res => res.json()),

    expand: (query: string) =>
      fetch(`${AI_SERVICE_URL}/api/v1/search/expand?query=${encodeURIComponent(query)}`, {
        method: 'POST',
      })
        .then(res => res.json()),

    embed: (text: string) =>
      callAI<number[]>('/api/v1/embed', { text }),
  },

  fraud: {
    checkUser: (user: any, existingUsers?: any[]) =>
      callAI('/api/v1/fraud/check-user', { user, existing_users: existingUsers || [] }),

    checkPrompt: (prompt: any, existingPrompts?: any[]) =>
      callAI('/api/v1/fraud/check-prompt', { prompt, existing_prompts: existingPrompts || [] }),

    checkReview: (review: any, userReviews?: any[]) =>
      callAI('/api/v1/fraud/check-review', { review, user_reviews: userReviews || [] }),

    checkTransactions: (orders: any[]) =>
      callAI('/api/v1/fraud/check-transactions', { orders }),
  },

  recommend: {
    forUser: (userId?: string, prompts?: any[], topN = 20) =>
      callAI('/api/v1/recommendations', {
        user_id: userId,
        prompts: prompts || [],
        top_n: topN,
      }, { timeout: 8000 }),

    similar: (prompt: any, prompts: any[], topN = 6) =>
      callAI('/api/v1/recommendations/similar', { prompt, prompts, top_n: topN }),

    trending: (topN = 20) =>
      fetch(`${AI_SERVICE_URL}/api/v1/recommendations/trending?top_n=${topN}`)
        .then(res => res.json()),

    trendingSearches: (topN = 10) =>
      fetch(`${AI_SERVICE_URL}/api/v1/recommendations/trending-searches?top_n=${topN}`)
        .then(res => res.json()),
  },

  payment: {
    riskScore: (order: any, buyer?: any, recentOrders?: any[], prompt?: any) =>
      callAI('/api/v1/payments/risk-score', {
        order, buyer, recent_orders: recentOrders || [], prompt,
      }, { timeout: 3000 }),

    payoutRisk: (payout: any, seller?: any, recentPayouts?: any[]) =>
      callAI('/api/v1/payments/payout-risk', {
        payout, seller, recent_payouts: recentPayouts || [],
      }),
  },

  quality: {
    score: (prompt: any, categoryAvgPrice?: number) =>
      callAI('/api/v1/quality/score', { prompt, category_avg_price: categoryAvgPrice }),

    batch: (prompts: any[]) =>
      callAI('/api/v1/quality/batch', { prompts }, { timeout: 15000 }),
  },

  features: {
    user: (user: any) => callAI('/api/v1/features/user', user),
    prompt: (prompt: any) => callAI('/api/v1/features/prompt', prompt),
  },

  health: () =>
    fetch(`${AI_SERVICE_URL}/api/v1/health`).then(res => res.json()).catch(() => ({
      status: 'unreachable', service: 'maghgo-ai',
    })),
};
