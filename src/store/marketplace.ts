import { create } from 'zustand';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';

export const ALL_AI_TOOLS = [
  'ChatGPT','GPT-4','GPT-4o','GPT-4 Turbo','Claude 3.5 Sonnet','Claude 3 Opus','Claude 3 Haiku',
  'Gemini Pro','Gemini Ultra','Llama 3.1','Llama 3','Mistral','Mixtral','Command R+','Phi-3',
  'Qwen 2.5','DeepSeek','Grok','Perplexity',
  'Midjourney v6','DALL-E 3','Stable Diffusion XL','Stable Diffusion 3','Adobe Firefly',
  'Leonardo AI','Ideogram','Flux','Playground AI','Crayon',
  'Sora','Runway Gen-3','Pika Labs','Kling AI','Luma Dream Machine','Haiper',
  'ElevenLabs','Suno AI','Udio','Bark',
  'GitHub Copilot','Cursor AI','v0.dev','Bolt.new','Devin','Replit AI','Codeium','Tabnine','Amazon Q',
  'Jasper AI','Copy.ai','Synthesia','Character.AI','Poe','You.com','Phind'
];

export const AI_TOOL_CATEGORIES = [
  { label: 'Text & Chat', tools: ['ChatGPT','GPT-4','GPT-4o','GPT-4 Turbo','Claude 3.5 Sonnet','Claude 3 Opus','Claude 3 Haiku','Gemini Pro','Gemini Ultra','Llama 3.1','Llama 3','Mistral','Mixtral','Command R+','Phi-3','Qwen 2.5','DeepSeek','Grok','Perplexity'] },
  { label: 'Image Generation', tools: ['Midjourney v6','DALL-E 3','Stable Diffusion XL','Stable Diffusion 3','Adobe Firefly','Leonardo AI','Ideogram','Flux','Playground AI','Crayon'] },
  { label: 'Video Generation', tools: ['Sora','Runway Gen-3','Pika Labs','Kling AI','Luma Dream Machine','Haiper'] },
  { label: 'Audio & Music', tools: ['ElevenLabs','Suno AI','Udio','Bark'] },
  { label: 'Code & Dev', tools: ['GitHub Copilot','Cursor AI','v0.dev','Bolt.new','Devin','Replit AI','Codeium','Tabnine','Amazon Q'] },
  { label: 'Specialized', tools: ['Jasper AI','Copy.ai','Synthesia','Character.AI','Poe','You.com','Phind'] },
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1, flag: '🇺🇸' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 94.6, flag: '🇮🇳' },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.89, flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.75, flag: '🇬🇧' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.55, flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.38, flag: '🇨🇦' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 3.67, flag: '🇦🇪' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 144.0, flag: '🇯🇵' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rate: 5.65, flag: '🇧🇷' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1620, flag: '🇳🇬' },
];

// Fetch live exchange rates and update CURRENCIES array
let ratesFetched = false;
export async function fetchLiveRates() {
  if (ratesFetched) return;
  try {
    const res = await fetch('/api/exchange-rates');
    const json = await res.json();
    if (json.success && json.data) {
      for (const cur of CURRENCIES) {
        if (json.data[cur.code] !== undefined) {
          cur.rate = json.data[cur.code];
        }
      }
      ratesFetched = true;
      console.log('[store] Live exchange rates loaded');
    }
  } catch (e) {
    console.error('[store] Failed to fetch live rates, using fallback:', e);
  }
}

export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  'INDIA': 'INR',
  'USA': 'USD',
  'UK': 'GBP',
  'EUROPE': 'EUR',
  'AUSTRALIA': 'AUD',
  'CANADA': 'CAD',
  'UAE': 'AED',
  'JAPAN': 'JPY',
  'BRAZIL': 'BRL',
  'NIGERIA': 'NGN'
};

export const PAYMENT_METHODS = [
  { value: 'RAZORPAY', label: 'Razorpay', desc: 'UPI, Net Banking, Cards' },
];

export function getINRRate(): number {
  return CURRENCIES.find(c => c.code === 'INR')?.rate || 94.6;
}

export function formatPrice(usdAmount: number, currencyCode?: string): string {
  if (!currencyCode) currencyCode = useStore.getState().selectedCurrency || 'USD';
  const cur = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  const converted = usdAmount * cur.rate;
  const noDecimal = ['JPY','KRW','VND','IDR','NGN'].includes(cur.code);
  if (noDecimal) return `${cur.symbol}${Math.round(converted).toLocaleString()}`;
  return `${cur.symbol}${converted.toFixed(2)}`;
}

export interface User { id: string; email: string; name: string; avatar?: string; role: string; isSeller: boolean; bio?: string; totalEarnings: number; currentBalance: number; totalSpent: number; isVerified: boolean; bankName?: string; bankAccount?: string; bankIfsc?: string; upiId?: string; paypalEmail?: string; paymentMethod?: string; }
export interface Category { id: string; name: string; slug: string; icon?: string; description?: string; promptCount: number; }
export interface Prompt { id: string; title: string; slug: string; description: string; promptText?: string | null; hasAccess?: boolean; isPromptLocked?: boolean; hasPurchased?: boolean; sampleImages: string; categoryId: string; tags: string; recommendedAI: string; price: number; isFree: boolean; originalPrice?: number; discount: number; platformFee: number; sellerId: string; likeCount: number; downloadCount: number; viewCount: number; rating: number; reviewCount: number; status: string; isFeatured: boolean; isTrending: boolean; isPremium: boolean; createdAt: string; seller?: { id: string; name: string; avatar: string; isSeller?: boolean; totalEarnings?: number; bio?: string; }; category?: { id: string; name: string; slug: string; }; reviews?: any[]; }
export interface Order { id: string; orderId: string; buyerId: string; promptId: string; sellerId: string; amount: number; platformFee: number; sellerAmount: number; paymentMethod: string; currency?: string; status: string; couponCode?: string; createdAt: string; prompt?: { id: string; title: string; sampleImages: string; price: number; isFree: boolean; }; buyer?: { id: string; name: string; avatar: string; }; }

type View = 'landing'|'browse'|'prompt-detail'|'cart'|'checkout'|'profile'|'seller-dashboard'|'upload-prompt'|'seller-setup'|'admin'|'orders'|'wishlist'|'security'|'chat';

interface Store {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  becomeSeller: (data: any) => Promise<boolean>;
  updateProfile: (data: any) => Promise<boolean>;

  currentView: View; setCurrentView: (v: View) => void;
  selectedPromptId: string | null; setSelectedPromptId: (id: string | null) => void;
  searchQuery: string; setSearchQuery: (q: string) => void;
  selectedCategory: string | null; setSelectedCategory: (id: string | null) => void;
  showAuthModal: boolean; setShowAuthModal: (v: boolean) => void;
  authMode: 'login' | 'register'; setAuthMode: (m: 'login' | 'register') => void;

  prompts: Prompt[]; setPrompts: (p: Prompt[]) => void;
  categories: Category[]; setCategories: (c: Category[]) => void;
  selectedPrompt: Prompt | null; setSelectedPrompt: (p: Prompt | null) => void;
  comments: any[]; setComments: (c: any[]) => void;
  promptReviews: any[]; setPromptReviews: (r: any[]) => void;
  likedPromptIds: Set<string>; setLikedPromptIds: (ids: Set<string>) => void;
  wishlistedPromptIds: Set<string>; setWishlistedPromptIds: (ids: Set<string>) => void;
  wishlist: Prompt[]; setWishlist: (w: Prompt[]) => void;
  orders: Order[]; setOrders: (o: Order[]) => void;
  adminStats: any; setAdminStats: (s: any) => void;
  notifications: any[]; setNotifications: (n: any[]) => void;
  totalPrompts: number; totalPages: number; currentPage: number;
  loading: boolean; setLoading: (l: boolean) => void;
  featuredPrompts: Prompt[]; trendingPrompts: Prompt[]; freePromptsList: Prompt[];

  cart: Prompt[]; addToCart: (p: Prompt) => void; removeFromCart: (id: string) => void; clearCart: () => void;

  sortBy: string; setSortBy: (s: string) => void;
  priceRange: [number, number]; setPriceRange: (r: [number, number]) => void;
  isFreeOnly: boolean; setIsFreeOnly: (v: boolean) => void;
  selectedAI: string | null; setSelectedAI: (a: string | null) => void;

  selectedCurrency: string; setSelectedCurrency: (c: string) => void;
  showFilterPanel: boolean; setShowFilterPanel: (v: boolean) => void;

  fetchCategories: () => Promise<void>;
  fetchPrompts: (params?: any) => Promise<void>;
  fetchPromptDetail: (id: string) => Promise<void>;
  searchPrompts: (q: string) => Promise<void>;
  toggleLike: (id: string) => Promise<boolean>;
  addComment: (promptId: string, content: string, parentId?: string) => Promise<void>;
  addReview: (promptId: string, rating: number, comment: string) => Promise<{ success: boolean; error?: string }>;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (promptId: string) => Promise<boolean>;
  fetchOrders: (type?: string) => Promise<void>;
  createOrder: (promptId: string, paymentMethod: string, couponCode?: string, currency?: string) => Promise<boolean>;
  themeStyle: 'normal' | 'universe';
  setThemeStyle: (style: 'normal' | 'universe') => void;
  fetchAdminStats: () => Promise<void>;
}

const api = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...opts?.headers }, ...opts });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
};

export const useStore = create<Store>((set, get) => ({
  user: null,
  currentView: 'landing', selectedPromptId: null, searchQuery: '', selectedCategory: null,
  showAuthModal: false, authMode: 'login',
  prompts: [], categories: [], selectedPrompt: null, comments: [], promptReviews: [],
  likedPromptIds: new Set(), wishlistedPromptIds: new Set(),
  wishlist: [], orders: [], adminStats: null, notifications: [],
  totalPrompts: 0, totalPages: 1, currentPage: 1, loading: false,
  featuredPrompts: [], trendingPrompts: [], freePromptsList: [],
  cart: [], sortBy: 'newest', priceRange: [0, 200], isFreeOnly: false, selectedAI: null,
  selectedCurrency: typeof window !== 'undefined' ? (localStorage.getItem('pb_currency') || 'USD') : 'USD',
  showFilterPanel: false,
  themeStyle: typeof window !== 'undefined' ? ((localStorage.getItem('pb_theme_style') as 'normal' | 'universe') || 'normal') : 'normal',

  setThemeStyle: (style) => {
    set({ themeStyle: style });
    if (typeof window !== 'undefined') localStorage.setItem('pb_theme_style', style);
  },

  login: async (email, password) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      if (!data.session) throw new Error('Login failed');
      const profile = await api(`/api/auth/me`);
      set({ user: profile });
      
      // Auto-set currency based on country
      if (profile?.country) {
        const cCode = COUNTRY_TO_CURRENCY[profile.country] || 'USD';
        get().setSelectedCurrency(cCode);
      }
      
      localStorage.setItem('pb_user', JSON.stringify(profile));
      return true;
    } catch (e) { console.error('[store] login:', e); return false; }
  },

  register: async (data) => {
    try {
      const res = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(data) });
      return true;
    } catch (e) { console.error('[store] register:', e); return false; }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch (e) { console.error('[store] logout:', e); }
    set({ user: null, cart: [], wishlist: [], orders: [], likedPromptIds: new Set(), wishlistedPromptIds: new Set() });
    localStorage.removeItem('pb_user');
  },

  fetchMe: async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { set({ user: null }); return; }
      const profile = await api(`/api/auth/me`);
      set({ user: profile });
      
      // Auto-set currency based on country
      if (profile?.country) {
        const cCode = COUNTRY_TO_CURRENCY[profile.country] || 'USD';
        get().setSelectedCurrency(cCode);
      }
      
      localStorage.setItem('pb_user', JSON.stringify(profile));
    } catch (e) { console.error('[store] fetchMe:', e); set({ user: null }); localStorage.removeItem('pb_user'); }
  },

  becomeSeller: async (data) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { set({ showAuthModal: true }); return false; }
      const updatedUser = await api('/api/auth/become-seller', { method: 'POST', body: JSON.stringify(data) });
      set({ user: updatedUser });
      return true;
    } catch (e) { console.error('[store] becomeSeller:', e); return false; }
  },

  updateProfile: async (data) => {
    try {
      const user = await api('/api/user/profile', { method: 'PUT', body: JSON.stringify(data) });
      set({ user });
      return true;
    } catch (e) { console.error('[store] updateProfile:', e); return false; }
  },

  setCurrentView: (v) => set({ currentView: v, loading: false }),
  setSelectedPromptId: (id) => set({ selectedPromptId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSelectedCategory: (id) => set({ selectedCategory: id }),
  setShowAuthModal: (v) => set({ showAuthModal: v }),
  setAuthMode: (m) => set({ authMode: m }),
  setPrompts: (p) => set({ prompts: p }),
  setCategories: (c) => set({ categories: c }),
  setSelectedPrompt: (p) => set({ selectedPrompt: p }),
  setComments: (c) => set({ comments: c }),
  setPromptReviews: (r) => set({ promptReviews: r }),
  setLikedPromptIds: (ids) => set({ likedPromptIds: ids }),
  setWishlistedPromptIds: (ids) => set({ wishlistedPromptIds: ids }),
  setWishlist: (w) => set({ wishlist: w }),
  setOrders: (o) => set({ orders: o }),
  setAdminStats: (s) => set({ adminStats: s }),
  setNotifications: (n) => set({ notifications: n }),
  setLoading: (l) => set({ loading: l }),

  addToCart: (p) => { if (!get().cart.find(c => c.id === p.id)) set({ cart: [...get().cart, p] }); },
  removeFromCart: (id) => set({ cart: get().cart.filter(c => c.id !== id) }),
  clearCart: () => set({ cart: [] }),
  setSortBy: (s) => set({ sortBy: s }),
  setPriceRange: (r) => set({ priceRange: r }),
  setIsFreeOnly: (v) => set({ isFreeOnly: v }),
  setSelectedAI: (a) => set({ selectedAI: a }),
  setSelectedCurrency: (c) => { set({ selectedCurrency: c }); localStorage.setItem('pb_currency', c); },
  setShowFilterPanel: (v) => set({ showFilterPanel: v }),

  fetchCategories: async () => {
    if (get().categories.length > 0) return;
    try { const data = await api('/api/categories'); set({ categories: data }); } catch (e) { console.error('[store] fetchCategories:', e); }
  },
  fetchPrompts: async (params = {}) => {
    set({ loading: true });
    try {
      const s = get();
      const qp = new URLSearchParams({ page: '1', limit: '24', sort: s.sortBy, ...params });
      if (s.selectedCategory) qp.set('category', s.selectedCategory);
      if (s.searchQuery) qp.set('search', s.searchQuery);
      if (s.isFreeOnly) qp.set('isFree', 'true');
      if (s.selectedAI) qp.set('ai', s.selectedAI);
      if (s.priceRange[0] > 0) qp.set('minPrice', String(s.priceRange[0]));
      if (s.priceRange[1] < 100) qp.set('maxPrice', String(s.priceRange[1]));
      const data = await api(`/api/prompts?${qp}`);
      const updatedPrompts = data.prompts.map((p: Prompt) => ({
        ...p,
        isLiked: get().likedPromptIds.has(p.id),
        isWishlisted: get().wishlistedPromptIds.has(p.id),
      }));
      set({ prompts: updatedPrompts, totalPrompts: data.total, totalPages: data.pages, currentPage: data.page, loading: false });
    } catch (e) { console.error('[store] fetchPrompts:', e); set({ loading: false }); }
  },
  fetchPromptDetail: async (id) => {
    set({ loading: true });
    try {
      const [prompt, commentsData] = await Promise.all([
        api(`/api/prompts/${id}`),
        api(`/api/prompts/${id}/comments?limit=100`).catch(() => [])
      ]);
      let reviews = prompt.reviews || [];
      try { reviews = await api(`/api/prompts/${id}/reviews`); } catch (e) { console.error('[store] fetchReviews:', e); }
      set({ selectedPrompt: prompt, comments: commentsData, promptReviews: reviews, loading: false });
    } catch (e) { console.error('[store] fetchPromptDetail:', e); set({ loading: false }); }
  },
  searchPrompts: async (q) => {
    set({ loading: true, searchQuery: q, currentView: 'browse' });
    try {
      const data = await api(`/api/search?q=${encodeURIComponent(q)}&limit=24`);
      set({ prompts: data.prompts, totalPrompts: data.total, totalPages: data.totalPages || data.pages, loading: false });
    } catch (e) { console.error('[store] searchPrompts:', e); set({ loading: false }); }
  },
  toggleLike: async (id) => {
    if (!get().user) { set({ showAuthModal: true }); return false; }
    try {
      const data = await api(`/api/prompts/${id}/like`, { method: 'POST' });
      const newLiked = new Set(get().likedPromptIds);
      if (data.liked) newLiked.add(id); else newLiked.delete(id);
      set({ likedPromptIds: newLiked });
      if (get().selectedPrompt?.id === id) {
        set({ selectedPrompt: { ...get().selectedPrompt!, likeCount: get().selectedPrompt!.likeCount + (data.liked ? 1 : -1) } });
      }
      return data.liked;
    } catch (e) { console.error('[store] toggleLike:', e); return false; }
  },
  addComment: async (promptId, content, parentId) => {
    if (!get().user) { set({ showAuthModal: true }); return; }
    try {
      const comment = await api(`/api/prompts/${promptId}/comments`, { method: 'POST', body: JSON.stringify({ content, parentId }) });
      set({ comments: [comment, ...get().comments] });
    } catch (e) { console.error('[store] addComment:', e); }
  },
  addReview: async (promptId, rating, comment) => {
    if (!get().user) { set({ showAuthModal: true }); return { success: false, error: 'Not logged in' }; }
    try {
      const review = await api(`/api/prompts/${promptId}/reviews`, { method: 'POST', body: JSON.stringify({ rating, comment }) });
      set({ promptReviews: [review, ...get().promptReviews] });
      if (get().selectedPrompt?.id === promptId) {
        const p = get().selectedPrompt!;
        const newCount = p.reviewCount + 1;
        const allRatings = [...(get().promptReviews || []), review].map((r: any) => r.rating);
        const avgRating = allRatings.reduce((a: number, b: number) => a + b, 0) / allRatings.length;
        set({ selectedPrompt: { ...p, reviewCount: newCount, rating: +avgRating.toFixed(1) } });
      }
      return { success: true };
    } catch (e: any) { 
      console.error('[store] addReview:', e); 
      return { success: false, error: e.message || 'Failed to submit review' }; 
    }
  },
  fetchWishlist: async () => {
    if (!get().user) return;
    try { const data = await api(`/api/wishlist`); set({ wishlist: data }); } catch (e) { console.error('[store] fetchWishlist:', e); }
  },
  toggleWishlist: async (promptId) => {
    if (!get().user) { set({ showAuthModal: true }); return false; }
    try {
      const data = await api('/api/wishlist', { method: 'POST', body: JSON.stringify({ promptId }) });
      const newWl = new Set(get().wishlistedPromptIds);
      if (data.wishlisted) newWl.add(promptId); else newWl.delete(promptId);
      set({ wishlistedPromptIds: newWl });
      return data.wishlisted;
    } catch (e) { console.error('[store] toggleWishlist:', e); return false; }
  },
  fetchOrders: async (type = 'bought') => {
    if (!get().user) return;
    try { const data = await api(`/api/orders?type=${type}`); set({ orders: data }); } catch (e) { console.error('[store] fetchOrders:', e); }
  },
  createOrder: async (promptId, paymentMethod, couponCode, currency) => {
    if (!get().user) { set({ showAuthModal: true }); return false; }
    try {
      await api('/api/orders', { method: 'POST', body: JSON.stringify({ promptId, paymentMethod, couponCode, currency: currency || get().selectedCurrency }) });
      get().removeFromCart(promptId);
      return true;
    } catch (e) { console.error('[store] createOrder:', e); return false; }
  },
  fetchAdminStats: async () => {
    if (!get().user) return;
    try { const data = await api(`/api/admin/stats`); set({ adminStats: data }); } catch (e) { console.error('[store] fetchAdminStats:', e); }
  },
}));

export const useMarketplaceStore = useStore;
