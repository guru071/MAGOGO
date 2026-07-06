# MAGHGO — Complete Project Documentation

> **A full-stack AI prompts marketplace** — Buy, sell, and discover expertly crafted AI prompts.
> This document explains **everything**: architecture, codebase, features, and how to run the project.

---

## 📖 Table of Contents

1. [What Is MAGHGO?](#1-what-is-maghgo)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [How the App Starts](#4-how-the-app-starts)
5. [Authentication System](#5-authentication-system)
6. [Database (PostgreSQL + Prisma)](#6-database-postgresql--prisma)
7. [API Routes](#7-api-routes)
8. [State Management (Zustand Store)](#8-state-management-zustand-store)
9. [Key Features & How They Work](#9-key-features--how-they-work)
10. [Payment Flow (Razorpay)](#10-payment-flow-razorpay)
11. [Admin Dashboard](#11-admin-dashboard)
12. [Android App (Capacitor)](#12-android-app-capacitor)
13. [Middleware & Security](#13-middleware--security)
14. [Styling & Theme](#14-styling--theme)
15. [Environment Variables](#15-environment-variables)
16. [How to Run Locally](#16-how-to-run-locally)
17. [How to Deploy](#17-how-to-deploy)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. What Is MAGHGO?

MAGHGO is a **digital marketplace** for AI prompts. Think of it like **Flipkart for AI instructions**.

### Who uses it?
- **Buyers** — People who want ready-made prompts for ChatGPT, Midjourney, DALL-E, Claude, etc.
- **Sellers (Prompt Engineers)** — People who create and sell high-quality prompts
- **Admins** — People who manage the platform, moderate content, process payouts

### Key Features
- Browse & search 1000s of AI prompts
- Filter by AI tool, category, price range, rating
- Flash deals (time-limited discounts)
- Shopping cart + wishlist
- Razorpay payments (UPI, Credit Card, NetBanking)
- Seller dashboard with sales analytics
- Admin panel with fraud detection, quality scoring, revenue analytics
- Android app (via Capacitor)
- Google Sign-In (one-click login)
- Real-time notifications
- Dark mode / light mode
- Multi-currency support (INR, USD, GBP, EUR, etc.)

---

## 2. Tech Stack

| Layer | Technology | Why? |
|-------|-----------|------|
| **Frontend** | Next.js 16 (App Router) | Modern React framework with file-based routing, server components |
| **UI** | React 19 + shadcn/ui + Tailwind CSS v4 | Beautiful, accessible components + utility-first CSS |
| **Animations** | Framer Motion | Smooth page transitions, hover effects |
| **State Management** | Zustand v5 | Lightweight global state (no boilerplate) |
| **Database** | PostgreSQL + pgvector | Relational data + AI embedding similarity search |
| **ORM** | Prisma v6 | Type-safe database queries, migrations |
| **Auth** | Supabase Auth (SSR) | Email/password + Google OAuth, session management |
| **Payments** | Razorpay | Indian payment gateway (UPI, cards, netbanking) |
| **Image Hosting** | Cloudinary | Image upload, optimization, transformations |
| **Email** | Resend | Transactional emails (welcome, receipts, verification) |
| **Mobile** | Capacitor v6 | Wraps the web app into a native Android APK |
| **Charts** | Recharts | Analytics dashboards |
| **Icons** | Lucide React | Open-source icon set |
| **Toasts** | Sonner | Toast notifications |
| **Forms** | react-hook-form | Form validation |

---

## 3. Project Structure

```
maghgo-mid-level/
├── prisma/                          # Database schema & migrations
│   └── schema.prisma                # 27 models (User, Prompt, Order, etc.)
│
├── src/
│   ├── app/                         # Next.js App Router (pages + API)
│   │   ├── page.tsx                 # Landing page (hero, trending, most viewed)
│   │   ├── layout.tsx               # Root layout (nav, footer, auth modal)
│   │   ├── globals.css              # CSS variables, Tailwind, custom styles
│   │   ├── middleware.ts            # Rate limiting, security headers, CSRF
│   │   │
│   │   ├── browse/                  # Browse/search prompts (filters, pagination)
│   │   ├── cart/                    # Shopping cart
│   │   ├── checkout/                # Payment checkout (Razorpay)
│   │   ├── categories/              # Browse by category
│   │   ├── prompt/[id]/             # Prompt detail page
│   │   ├── account/                 # Profile, orders, wishlist, settings, security
│   │   ├── seller/                  # Seller dashboard, upload, sales, payouts
│   │   ├── admin/                   # Admin panel (moderation, analytics, config)
│   │   ├── store/[id]/              # Seller storefront
│   │   ├── invoice/[id]/            # Payment receipt/invoice
│   │   ├── auth/callback/           # OAuth callback (Google login)
│   │   ├── about/                   # About page
│   │   ├── contact/                 # Contact/support
│   │   ├── privacy/                 # Privacy policy
│   │   ├── terms/                   # Terms of service
│   │   ├── qna/                     # Q&A page
│   │   ├── support/                 # Support page
│   │   ├── not-found.tsx            # 404 page
│   │   ├── global-error.tsx         # Error boundary
│   │   └── template.tsx             # Page transition wrapper
│   │
│   │   └── api/                     # ALL API routes (79 endpoints)
│   │       ├── auth/                # login, register, logout, me, become-seller
│   │       ├── prompts/             # CRUD, likes, comments, reviews
│   │       ├── categories/          # Category listing
│   │       ├── search/              # Full-text search + spelling correction
│   │       ├── cart/                # Cart management
│   │       ├── checkout/            # Razorpay order + verification
│   │       ├── orders/              # Order history (bought/sold)
│   │       ├── wishlist/            # Wishlist toggle
│   │       ├── user/                # Profile update, device tokens
│   │       ├── seller/              # Seller analytics, prompts management
│   │       ├── admin/               # Full admin CRUD + analytics
│   │       ├── razorpay/            # Refunds, upload fees
│   │       ├── payouts/             # Seller payout requests
│   │       ├── reports/             # Report prompt
│   │       ├── notifications/       # User notifications
│   │       ├── chat/                # Support chat
│   │       ├── flash-deals/         # Active flash deals
│   │       ├── fees/                # Fee estimation
│   │       ├── upload/              # Image upload (Cloudinary)
│   │       ├── stats/               # Public platform stats
│   │       ├── exchange-rates/      # Live currency rates
│   │       ├── site-config/         # CMS config
│   │       ├── seed/                # Demo data seeder
│   │       ├── cron/                # Scheduled payouts
│   │       ├── qna/                 # Questions & answers
│   │       ├── analytics/           # Search analytics
│   │       ├── ai/search/           # AI-powered suggestions
│   │       ├── privacy/             # Privacy settings
│   │       ├── security/            # Security settings
│   │       └── route.ts             # Health check
│   │
│   ├── components/
│   │   ├── ui/                      # ~40 shadcn/ui components
│   │   │   ├── button.tsx, card.tsx, dialog.tsx, input.tsx, ...
│   │   │   └── chart.tsx            # Recharts wrapper
│   │   │
│   │   ├── marketplace/             # App-specific components
│   │   │   ├── Navbar.tsx           # Top navigation + search + user menu
│   │   │   ├── Footer.tsx           # 4-column footer
│   │   │   ├── BottomNav.tsx        # Mobile bottom nav bar
│   │   │   ├── AuthModal.tsx        # Login/Register dialog + Google button
│   │   │   ├── AppInitializer.tsx   # Splash screen, push registration
│   │   │   ├── ChatButton.tsx       # Floating support chat
│   │   │   ├── CommentSection.tsx   # Threaded comments
│   │   │   ├── FlashDealsBanner.tsx # Flash deals carousel
│   │   │   ├── NotificationBell.tsx # Real-time notifications
│   │   │   └── ReportModal.tsx      # Report prompt modal
│   │   │
│   │   ├── admin/                   # 24 admin panel components
│   │   │   ├── AdminPanel.tsx       # Main wrapper with sidebar tabs
│   │   │   ├── Dashboard.tsx        # Analytics dashboard (KPIs, charts)
│   │   │   ├── AdminUsers.tsx       # User management
│   │   │   ├── AdminPrompts.tsx     # Prompt moderation
│   │   │   ├── AdminOrders.tsx      # Order management
│   │   │   ├── RevenueDashboard.tsx # Revenue breakdown
│   │   │   ├── FraudDashboard.tsx   # Fraud detection
│   │   │   ├── QualityDashboard.tsx # Quality scoring
│   │   │   └── ... (16 more)
│   │   │
│   │   └── SellerOnboarding.tsx     # Seller registration form
│   │
│   ├── lib/                         # Shared utilities & libraries
│   │   ├── supabase-client.ts       # Browser Supabase client
│   │   ├── supabase-server.ts       # Server Supabase client (cookies)
│   │   ├── supabase-admin.ts        # Service-role admin client
│   │   ├── auth.ts                  # signupWithSupabase, loginWithSupabase
│   │   ├── auth-helpers.ts          # getCurrentUser, requireUser, requireAdmin
│   │   ├── db.ts                    # Prisma singleton
│   │   ├── currencies.ts            # Currency definitions, rates, formatting
│   │   ├── fees.ts                  # Platform fee calculation engine
│   │   ├── razorpay.ts              # Server-side Razorpay (orders, payouts)
│   │   ├── razorpay-client.ts       # Client Razorpay protections
│   │   ├── razorpay-config.ts       # Razorpay options builder
│   │   ├── native-bridge.ts         # Capacitor native APIs
│   │   ├── cloudinary.ts            # Image upload/delete
│   │   ├── email.ts                 # Resend email sending
│   │   ├── format.ts                # AI tool name formatter
│   │   ├── prompt-security.ts       # Access control for purchased prompts
│   │   ├── security.ts              # IP blacklist, rate limiting, sanitization
│   │   ├── use-site-config.ts       # Hook for dynamic site config
│   │   └── utils.ts                 # cn() utility
│   │
│   ├── store/
│   │   └── marketplace.ts           # Zustand store (global state)
│   │
│   └── hooks/
│       ├── use-mobile.ts            # Mobile detection hook
│       └── use-toast.ts             # Toast notification hook
│
├── android/                         # Complete Android project (Capacitor)
│   └── app/
│       ├── build.gradle             # Android build config
│       ├── google-services.json     # Firebase config (replace with yours)
│       └── src/main/
│           ├── AndroidManifest.xml   # Permissions & app declaration
│           ├── java/.../MainActivity.java  # Android entry point
│           └── res/                  # Icons, splash screen, themes
│
├── public/
│   ├── manifest.json                # PWA manifest
│   ├── sw.js                        # Service worker (offline + push)
│   ├── logo.png / logo.jpeg         # App logos
│   └── robots.txt                   # Search engine config
│
├── scripts/
│   └── build_apk.sh                 # Automated APK build script
│
├── design-system/                   # Design assets
│
├── capacitor.config.ts              # Capacitor v6 config
├── next.config.ts                   # Next.js v16 config
├── tailwind.config.ts               # Tailwind CSS config
├── postcss.config.mjs               # PostCSS config
├── tsconfig.json                    # TypeScript config
├── eslint.config.mjs                # ESLint v9 flat config
├── components.json                  # shadcn/ui config
├── package.json                     # Dependencies & scripts
├── .env.example                     # Environment variable template
├── BUILD_APK.md                     # APK build guide
└── SETUP_GOOGLE_LOGIN_AND_APK.md    # Google + APK setup guide
```

---

## 4. How the App Starts

### Entry Point (`src/app/layout.tsx`)

When a user visits the app, this is the order of execution:

```
1. Browser requests page
2. Next.js middleware runs (rate limit, security headers, CSRF)
3. Root layout (layout.tsx) wraps everything:
   |
   ├── <ThemeProvider>          ← Dark/light mode from next-themes
   ├── <AppInitializer />       ← Hides splash screen, registers push notifications
   ├── <Navbar />               ← Top navigation bar (always visible)
   ├── <main>{children}</main>  ← The actual page content
   ├── <Footer />               ← Bottom footer (hidden on mobile)
   ├── <BottomNav />            ← Mobile bottom navigation
   ├── <AuthModal />            ← Login/register dialog (hidden until triggered)
   ├── <NotificationBell />     ← Notification bell in the corner
   ├── <ChatButton />           ← Support chat floating button
   └── <Toaster />              ← Toast notifications
```

### Landing Page (`src/app/page.tsx`)

The landing page loads in this order:

```
1. useEffect fires on mount
2. 5 parallel API calls:
   ├── GET /api/categories      → Category grid
   ├── GET /api/stats           → Stats (categories, prompts, sellers)
   ├── fetchPrompts()           → Trending prompts (store, default sort=newest)
   ├── GET /api/prompts?sort=views&limit=4  → Most Viewed section
   └── GET /api/prompts?sort=popular&limit=4 → "You May Also Like"
3. Sections render (top to bottom):
   ├── Hero section (title, CTA buttons, stats)
   ├── Trending Now (4 prompts, sorted by newest)
   ├── Most Viewed (4 prompts, sorted by view count)
   ├── You May Also Like (4 prompts, sorted by popularity)
   ├── Flash Deals Banner (promotional carousel)
   ├── Browse by Category (category grid with icons)
   ├── Why MAGHGO? (4 feature cards)
   └── CTA Section (call-to-action buttons)
```

---

## 5. Authentication System

MAGHGO uses **Supabase Auth** for all authentication. There are two ways to sign in:

### 5.1 Email & Password

```
Register:
  User fills form → register() → POST /api/auth/register
    → supabase.auth.admin.createUser() (creates in Supabase Auth)
    → db.user.create() (creates local profile in PostgreSQL)
    → Sends verification email via Supabase
    → Sends welcome email via Resend
  → Auto-logs in: login() → supabase.auth.signInWithPassword()
    → POST /api/auth/login (server validates, logs history)
    → GET /api/auth/me (fetches full profile)
    → Sets user in Zustand store + localStorage

Login:
  User fills form → login() → supabase.auth.signInWithPassword()
    → POST /api/auth/login
      → IP blacklist check
      → Rate limit check (>10 failed attempts → block)
      → Email verification check
      → Account suspension check
      → Creates LoginHistory + ActivityLog
    → GET /api/auth/me
    → Sets user in Zustand store
```

### 5.2 Google OAuth

```
Web (browser):
  Click "Continue with Google" → signInWithGoogle()
    → supabase.auth.signInWithOAuth({ provider: 'google' })
    → Redirects to Google login page
    → Google redirects back to /auth/callback?code=...
    → Server exchanges code for session
    → Redirects to home page
    → fetchMe() runs → GET /api/auth/me
      → If user doesn't exist locally → auto-creates profile (upsert)

Android (native app):
  Click "Continue with Google" → handleGoogleLogin()
    → nativeGoogleLogin() → GoogleAuth.signIn() (native popup)
    → Gets idToken from Google
    → supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })
    → fetchMe() runs → GET /api/auth/me
```

### 5.3 Session Management

- Supabase stores the session in **HTTP-only cookies** (prefixed with `sb-`)
- `src/lib/supabase-server.ts` reads cookies on the server to identify users
- `src/lib/supabase-client.ts` creates a browser client for client-side operations
- On every app load, `fetchMe()` checks if there's an active session:
  ```
  supabase.auth.getUser() → if exists → GET /api/auth/me → set user in store
  ```
- Logout clears all `sb-*` cookies and calls `supabase.auth.signOut()`
- User profile is cached in localStorage as `pb_user` (cleared on logout)

### 5.4 Auth Files Reference

| File | What it does |
|------|-------------|
| `src/lib/supabase-client.ts` | Creates browser Supabase client |
| `src/lib/supabase-server.ts` | Creates server Supabase client (reads cookies) |
| `src/lib/supabase-admin.ts` | Creates admin client (service_role key) |
| `src/lib/auth.ts` | Server functions: signupWithSupabase, loginWithSupabase |
| `src/lib/auth-helpers.ts` | Helpers: getCurrentUser, requireUser, requireAdmin |
| `src/app/api/auth/login/route.ts` | POST handler for login |
| `src/app/api/auth/register/route.ts` | POST handler for registration |
| `src/app/api/auth/me/route.ts` | GET current user (auto-creates profile) |
| `src/app/api/auth/logout/route.ts` | POST handler for logout |
| `src/app/auth/callback/route.ts` | OAuth callback handler |
| `src/components/marketplace/AuthModal.tsx` | Login/register dialog |
| `src/lib/native-bridge.ts` | Native Google Auth for Android |
| `src/store/marketplace.ts` | Store actions: login, register, logout, fetchMe, signInWithGoogle |

---

## 6. Database (PostgreSQL + Prisma)

### 6.1 Overview

- **Database**: PostgreSQL with **pgvector** extension (for AI embedding similarity search)
- **ORM**: Prisma v6 (type-safe, auto-generated client)
- **Models**: 27 database models

### 6.2 Core Models

```
User ────┬─── Prompt (sellerId)          # User sells prompts
         ├─── Order (buyerId)             # User buys prompts
         ├─── Review (userId)             # User reviews prompts
         ├─── Like (userId)               # User likes prompts
         ├─── Cart (userId)               # User has a cart
         ├─── Wishlist (userId)           # User wishlists prompts
         ├─── Comment (userId)            # User comments on prompts
         ├─── Notification (userId)       # User gets notifications
         ├─── ChatMessage (userId)        # User sends messages
         └─── WalletTransaction (userId)  # User has transactions

Category ── Prompt (categoryId)           # Prompts belong to categories

Prompt ────┬─── Order (promptId)          # Prompts are purchased
           ├─── Review (promptId)          # Prompts get reviews
           ├─── Like (promptId)            # Prompts get likes
           ├─── Wishlist (promptId)        # Prompts get wishlisted
           ├─── Comment (promptId)         # Prompts get comments
           ├─── FlashDeal (promptId)       # Prompts can have flash deals
           └─── QnA (promptId)             # Prompts get questions
```

### 6.3 Key Model Details

**User**
```
id             String (UUID, PK)
authUserId     String (unique, links to Supabase Auth)
email          String (unique)
name           String
avatar         String?
role           enum: BUYER | SELLER | ADMIN
isSeller       Boolean (default false)
isVerified     Boolean (default false)
isActive       Boolean (default true)
isBanned       Boolean (default false)
country        String? (default "INDIA")
currentBalance Float (wallet balance, default 0)
totalEarnings  Float (lifetime earnings, default 0)
totalSpent     Float (lifetime spent, default 0)
bank*          String? (seller bank details)
upiId          String? (seller UPI)
lastLoginAt    DateTime?
createdAt      DateTime (auto)
```

**Prompt**
```
id              String (UUID, PK)
title           String
slug            String (unique, URL-safe version of title)
description     String
promptText      String? (the actual AI prompt — locked until purchase)
sampleImages    String (JSON array of image URLs)
categoryId      String (FK → Category)
tags            String (JSON array)
recommendedAI   String (JSON array of AI tool names)
price           Float
isFree          Boolean (default false)
originalPrice   Float? (for showing discounts)
discount        Float (percentage, default 0)
status          enum: PENDING | APPROVED | REJECTED
likeCount       Int (denormalized counter, default 0)
viewCount       Int (denormalized counter, default 0)
downloadCount   Int (denormalized counter, default 0)
rating          Float (average rating, default 0)
reviewCount     Int (count of reviews, default 0)
isFeatured      Boolean (default false)
isTrending      Boolean (default false)
qualityScore    Float? (AI-generated quality score)
embedding       vector(1536)? (pgvector — for AI similarity search)
sellerId        String (FK → User)
createdAt       DateTime (auto)
```

**Order**
```
id              String (UUID, PK)
orderId         String (unique, Razorpay order ID)
buyerId         String (FK → User)
promptId        String (FK → Prompt)
sellerId        String (FK → User)
amount          Float (total in USD)
commission      Float
gstAmount       Float
closingFee      Float
paymentFee      Float
netAmount       Float (seller gets this)
platformFee     Float
currency        String (default "INR")
paymentMethod   String (default "RAZORPAY")
status          enum: PENDING | COMPLETED | FAILED | REFUNDED
couponCode      String?
createdAt       DateTime (auto)
```

### 6.4 Database Indexes (Performance)

The schema includes indexes on frequently queried columns:
- `Prompt`: `status`, `categoryId`, `price`, `rating`, `likeCount`, `createdAt`, `isFree`, `isFeatured`, `isTrending`
- Composite index: `[status, categoryId, price, createdAt]` — covers most browse queries

---

## 7. API Routes

The project has **79 API route files** under `src/app/api/`. All routes return JSON with:
```json
{ "success": true, "data": { ... } }     // Success
{ "success": false, "error": "..." }     // Error
```

### 7.1 Public Routes (no auth required)

| Route | Method | What it does |
|-------|--------|-------------|
| `/api/prompts` | GET | List prompts (filtered, paginated, sorted) |
| `/api/prompts/[id]` | GET | Get single prompt detail (access-controlled) |
| `/api/categories` | GET | List all categories |
| `/api/stats` | GET | Platform statistics (counts) |
| `/api/search` | GET | Full-text search with spelling correction |
| `/api/flash-deals/active` | GET | Active flash deals |
| `/api/exchange-rates` | GET | Live currency exchange rates |
| `/api/site-config` | GET | Site configuration (banners, offers) |
| `/api/fees/estimate` | GET | Estimate platform fees |
| `/api/` | GET | Health check |

### 7.2 Auth Routes

| Route | Method | What it does |
|-------|--------|-------------|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Sign in (with security checks) |
| `/api/auth/logout` | POST | Sign out |
| `/api/auth/me` | GET | Get current user profile |
| `/api/auth/me` | DELETE | Sign out server-side |
| `/api/auth/become-seller` | POST | Upgrade to seller |
| `/api/auth/resend-verification` | POST | Resend verification email |

### 7.3 Auth-Required Routes

| Route | Method | What it does |
|-------|--------|-------------|
| `/api/prompts` | POST | Create prompt (seller) |
| `/api/prompts/[id]` | PUT/DELETE | Update/delete prompt (owner/admin) |
| `/api/prompts/[id]/like` | POST | Toggle like |
| `/api/prompts/[id]/comments` | POST | Add comment |
| `/api/prompts/[id]/reviews` | POST | Add review |
| `/api/cart` | GET/POST/DELETE | Cart management |
| `/api/wishlist` | GET/POST | Wishlist management |
| `/api/orders` | GET | List orders |
| `/api/orders/free` | POST | Claim free prompt |
| `/api/checkout/razorpay` | POST | Create Razorpay order |
| `/api/checkout/verify` | POST | Verify payment |
| `/api/notifications` | GET | List notifications |
| `/api/user/profile` | PUT | Update profile |
| `/api/reports` | POST | Report a prompt |
| `/api/qna` | GET/POST | Questions & answers |
| `/api/payouts/request` | POST | Request seller payout |
| `/api/razorpay/refund` | POST | Refund payment |

### 7.4 Admin Routes (ADMIN role required)

24 routes under `/api/admin/` covering:
- `stats`, `analytics`, `revenue` — Dashboard data
- `users`, `users/[id]` — User management
- `prompts`, `prompts/[id]` — Prompt moderation
- `orders`, `orders/[id]` — Order management
- `categories`, `categories/[id]` — Category CRUD
- `coupons`, `coupons/[id]` — Coupon management
- `reviews`, `comments`, `reports` — Content moderation
- `payouts`, `payouts/process` — Payout processing
- `broadcasts` — Push notifications to all users
- `fraud`, `fraud/settings` — Fraud detection
- `quality` — Quality scoring
- `fees` — Fee configuration
- `flash-deals` — Flash deal CRUD
- `security`, `activity-logs` — Security data
- `settings` — Platform settings
- `infrastructure` — Server status
- `site-config` — Site CMS
- `chat` — Support conversations

---

## 8. State Management (Zustand Store)

The global store is at `src/store/marketplace.ts`. It uses **Zustand** (a lightweight state manager).

### 8.1 What's in the Store?

The store holds **all global state** for the app:

**User & Auth:**
- `user` — Current logged-in user (or null)
- `login()`, `register()`, `logout()`, `fetchMe()`, `signInWithGoogle()`

**Browse & Search:**
- `prompts` — Current list of prompts
- `searchQuery`, `selectedCategory`, `sortBy`, `priceRange`, `isFreeOnly`, `selectedAI`
- `fetchPrompts()`, `searchPrompts()`

**Product Detail:**
- `selectedPrompt`, `comments`, `promptReviews`
- `fetchPromptDetail()`, `toggleLike()`, `addComment()`, `addReview()`

**Cart & Wishlist:**
- `cart` — Array of prompts in cart
- `wishlist`, `wishlistedPromptIds`
- `addToCart()`, `removeFromCart()`, `toggleWishlist()`

**User Data:**
- `orders` — Purchase history
- `notifications` — Notifications list
- `fetchOrders()`, `fetchWishlist()`

**UI State:**
- `showAuthModal` — Whether login dialog is visible
- `authMode` — 'login' or 'register'
- `selectedCurrency` — Display currency (persisted in localStorage)
- `themeStyle` — 'normal' or 'universe' theme (persisted in localStorage)
- `showFilterPanel` — Filter sidebar visibility

### 8.2 How Data Flows

```
User clicks button → Store action (e.g., login())
  → API call (e.g., supabase.auth.signInWithPassword())
  → Fetch profile (GET /api/auth/me)
  → set({ user: profile })
  → React components re-render automatically
```

### 8.3 Helper Functions Exported

| Function | What it does |
|----------|-------------|
| `formatPrice(usdAmount, currency?)` | Converts USD to selected currency |
| `fetchLiveRates()` | Fetches live exchange rates |
| `formatAI(aiArray)` | Formats AI tool names for display |
| `ALL_AI_TOOLS` | 50+ supported AI tools |
| `COUNTRY_TO_CURRENCY` | Maps country to currency code |

---

## 9. Key Features & How They Work

### 9.1 Browse & Search

**Location**: `src/app/browse/page.tsx`

```
User lands on /browse:
  → Fetches prompts with default sort (newest)
  → Shows filter sidebar (category, AI tool, price range, free only)
  → User can sort by: Newest, Popular, Price Low-High, Price High-Low, Rating

Search:
  → User types in search bar
  → 300ms debounce (waits for user to stop typing)
  → GET /api/search?q=... (full-text search with fuzzy matching)
  → Shows suggestions dropdown with recent searches

Filters:
  → Changing any filter updates the URL query params
  → URL is the source of truth (shareable/bookmarkable)
  → Fetch with all active filters applied
```

**API**: `/api/search` uses PostgreSQL full-text search with:
- `to_tsvector()` / `to_tsquery()` for text search
- Levenshtein distance for spelling correction ("pryomt" → "prompt")
- Returns suggestions if no results found

### 9.2 Prompt Detail

**Location**: `src/app/prompt/[id]/page.tsx`

```
User clicks a prompt → /prompt/[id]:
  → Shows breadcrumb (Home → Category → Prompt title)
  → Left column:
    - Main image (first sample image)
    - Product description + tags
    - The prompt text (locked until purchase)
    - Q&A section (ask the seller)
    - Comments section
    - Reviews section (rating + written reviews)
  → Right column (buy box, sticky):
    - Title, price (with discount)
    - Seller info (link to storefront)
    - "Add to Cart" / "Buy Now" buttons
    - Wishlist save button
    - Report button
    
Access Control:
  - If user owns the prompt → sees prompt text with "Seller" badge
  - If user purchased → sees prompt text with "Purchased" badge
  - If admin → sees prompt text with "Admin" badge
  - Otherwise → "Purchase to unlock" lock icon
  
Related Prompts:
  → Fetches prompts in same category (excludes current)
  → Shows 4 related prompts below reviews
```

### 9.3 Cart & Checkout

**Location**: `src/app/cart/page.tsx`, `src/app/checkout/page.tsx`

```
Cart page:
  → Lists all items in cart
  → Shows individual price + total
  → Remove item button
  → "Place Order" → goes to checkout

Checkout page:
  → Review order summary
  → Apply coupon code
  → Price breakdown (subtotal, discount, fees, total)
  → "Proceed to Pay" button
  
On "Proceed to Pay":
  → POST /api/checkout/razorpay → creates Razorpay order + PENDING order in DB
  → Dynamically loads Razorpay checkout script
  → Opens Razorpay popup (UPI, cards, netbanking)
  → On success → POST /api/checkout/verify → verifies signature
    → Transactionally completes order
    → Credits seller, debits buyer
    → Shows invoice page
```

### 9.4 Seller Dashboard

**Location**: `src/app/seller/`

```
Seller Dashboard (overview):
  → KPI cards: Total sales, Earnings, Prompts listed, Pending payouts
  → Chart: Sales over time (7/30/90 days)
  → Recent orders table
  → Top prompts table

Prompts Management:
  → List seller's prompts with status, sales, earnings
  → Edit / Delete actions

Upload New Prompt:
  → Title, Description, Prompt Text
  → Sample images (upload to Cloudinary)
  → Category, Tags (comma separated)
  → Recommended AI tool(s)
  → Price (USD), Discount (%)
  → Free checkbox

Sales:
  → All orders containing seller's prompts
  → Price, Buyer, Date, Status

Payouts:
  → Request payout of wallet balance
  → View payout history
```

### 9.5 Wishlist

**Location**: `src/app/account/wishlist/page.tsx`

```
User clicks heart icon → toggleWishlist(promptId)
  → POST /api/wishlist { promptId }
  → If wishlisted → adds to Set, shows filled heart
  → If not wishlisted → removes from Set, shows empty heart
  → Immediate UI update (optimistic)
  → On failure → reverts UI + shows error toast
```

---

## 10. Payment Flow (Razorpay)

### 10.1 How Payments Work

```
1. User adds prompts to cart
2. User goes to /checkout
3. Clicks "Proceed to Pay"
   → POST /api/checkout/razorpay { promptIds, couponCode }
   → Server: validates everything, calculates fees, creates Razorpay order
   → Returns { razorpayOrderId, amount, keyId }
4. Frontend loads Razorpay checkout.js dynamically:
   const script = document.createElement('script')
   script.src = 'https://checkout.razorpay.com/v1/checkout.js'
   document.body.appendChild(script)
5. Opens Razorpay Checkout overlay:
   - Shows amount, user name, email
   - User selects payment method (UPI, card, netbanking)
6. User completes payment
7. On success → POST /api/checkout/verify { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   → Server: verifies HMAC-SHA256 signature (timing-safe)
   → Transactional DB update:
     - Mark orders as COMPLETED
     - Create PlatformRevenue records
     - Increment downloadCount
     - Credit seller balance
     - Send notification to seller
     - Send email receipt to buyer
8. Redirect to /invoice/[orderId]
```

### 10.2 Fee Calculation (`src/lib/fees.ts`)

The platform takes a commission on each sale:

```
Commission = base rate (15%) ± modifiers
  + Category modifier (±2% for saturated/niche categories)
  + Prompt length modifier (±2%)
  + GST on service fees (18%)
  + Closing fee ($0.50 fixed)
  + Payment processing fee (2.5%)
  
Minimum commission: $0.50
Maximum commission: $50.00
```

### 10.3 RazorpayX Payouts (Seller Payouts)

Admin can batch-process seller payouts:
1. Admin clicks "Process Payouts" in admin panel
2. Server creates RazorpayX contact + fund account for each seller
3. Server sends funds via IMPS using RazorpayX API
4. Payout status updated in database

---

## 11. Admin Dashboard

**Location**: `src/app/admin/` + `src/components/admin/` (24 components)

### 11.1 Dashboard Tab

The main analytics dashboard shows:

**KPI Cards:**
- Total Revenue (current period)
- Total Orders
- Total Users
- Conversion Rate

**Charts:**
- Revenue forecast (uses Exponential Smoothing)
- Anomaly detection (Z-score + IQR — identifies unusual spikes/drops)
- Seasonality (day-of-week patterns, monthly trends, weekly trends)
- Retention cohorts (how many users return week over week)
- Sales funnel (visits → signups → orders)

**Tables:**
- Top categories by revenue
- Top payment methods
- Top sellers
- Recent activity

### 11.2 Other Admin Tabs

| Tab | What admins can do |
|-----|-------------------|
| Users | Search users, ban/unban, change roles |
| Prompts | Approve/reject prompts, feature/unfeature |
| Orders | View all orders, update status |
| Categories | Create/edit/reorder categories |
| Coupons | Create discount codes with limits |
| Reports | Review flagged content |
| Comments | Moderate user comments |
| Support | View support conversations |
| Flash Deals | Create time-limited deals |
| Payouts | Process seller payouts |
| Activity | View audit logs |
| Broadcasts | Send push notifications to all users |
| Settings | General platform settings |
| Infrastructure | Server health status |
| Security | IP blacklist, rate limits |
| Fraud Detection | Risk scoring, case management |
| Quality | AI prompt quality scoring |
| Fees | Configure commission rates |
| Revenue | Revenue breakdown by period |
| Site Config | CMS (banners, offers, featured prompts) |

---

## 12. Android App (Capacitor)

### 12.1 How It Works

Capacitor wraps the Next.js web app into a **native Android WebView**. The web app runs inside the WebView, but can access native device features via plugins.

### 12.2 Native Features Used

| Feature | Plugin | What it does |
|---------|--------|-------------|
| Google Sign-In | `@codetrix-studio/capacitor-google-auth` | Native Google login popup |
| Push Notifications | `@capacitor/push-notifications` | Receive notifications |
| Splash Screen | `@capacitor/splash-screen` | Custom splash screen on launch |
| Payments | `capacitor-razorpay` | Razorpay checkout inside the app |

### 12.3 Native Bridge (`src/lib/native-bridge.ts`)

```javascript
isNative()        // → true if running inside Capacitor app
isAndroid()       // → true if Android platform

nativeGoogleLogin()     // Opens native Google sign-in popup
nativeGoogleLogout()    // Signs out from Google
registerPushNotifications()  // Requests permission + gets device token
nativePayment(options)  // Opens Razorpay checkout
hideSplash()            // Hides the splash screen
```

### 12.4 Building the APK

```bash
# Step 1: Build the website
npm run build

# Step 2: Copy to Android project
npx cap copy android

# Step 3: Sync plugins
npx cap sync android

# Step 4: Build APK
npm run cap:build:debug

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

### 12.5 Key Android Files

| File | Purpose |
|------|---------|
| `android/app/build.gradle` | Android build config (SDK version, app ID) |
| `android/app/google-services.json` | Firebase config (push notifications + Google Sign-In) |
| `android/app/src/main/AndroidManifest.xml` | App permissions |
| `android/app/src/main/java/com/maghgo/app/MainActivity.java` | Android entry point |
| `capacitor.config.ts` | Capacitor config (app ID, plugins) |

---

## 13. Middleware & Security

### 13.1 Middleware (`src/middleware.ts`)

The middleware runs on **every request** to the app.

```
1. Rate Limiting:
   - Auth routes: max 20 requests/minute per IP
   - Other API: max 100 requests/minute per IP
   - Returns 429 "Too many requests" when exceeded
   - Sets X-RateLimit headers

2. Suspicious Pattern Blocking:
   - Scans all query parameters for:
     - SQL injection (UNION, SELECT, DROP, etc.)
     - XSS (<script>, javascript:, onerror=, etc.)
     - Path traversal (../../, /etc/passwd)
     - Code execution (exec(, system(, eval()
   - Returns 400 "Bad request" if detected

3. CSRF Protection (auth routes only):
   - On POST/PUT/DELETE requests to /api/auth/*
   - Validates Origin or Referer header
   - Allowed origins: localhost, site URL, capacitor://localhost
   - Returns 403 "Forbidden" if invalid

4. Security Headers:
   - Content-Security-Policy (limits what scripts/images can load)
   - HSTS (forces HTTPS for 2 years)
   - X-Frame-Options: DENY (prevents clickjacking)
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy (blocks camera, mic, geolocation)
```

### 13.2 Other Security Measures

- **IP Blacklist**: File-based blacklist at `db/ip-blacklist.json`
- **Rate Limiting**: Login attempts limited to 10 failed per hour per IP
- **Input Sanitization**: All user inputs sanitized via `sanitizeInput()`
- **Password Security**: Min 6 characters, hashed by Supabase Auth
- **Payment Security**: HMAC-SHA256 signature verification, PENDING order pre-creation prevents ID swapping
- **Prompt Access Control**: `prompt-security.ts` enforces purchase checks
- **Session Security**: HTTP-only cookies, auto-refresh

---

## 14. Styling & Theme

### 14.1 CSS Architecture

```
globals.css
├── @import "tailwindcss"           # Tailwind v4
├── @import "tw-animate-css"        # Animations
│
├── @theme (CSS variables for shadcn)
│   ├── --primary: #2874F0          # Flipkart blue
│   ├── --accent: #FF9F00           # Flipkart orange
│   ├── --background: #F1F3F6       # Light gray
│   └── --foreground: #212121       # Dark text
│
├── .dark overrides
│   ├── --background: #0D0D0D
│   ├── --foreground: #F5F5F5
│   └── --card: #1A1A1A
│
├── Custom classes (Flipkart-inspired)
│   ├── .flipkart-header            # Blue header bar
│   ├── .flipkart-card              # White card
│   ├── .flipkart-price             # Bold price
│   ├── .flipkart-discount          # Green discount %
│   ├── .flipkart-rating            # Green rating badge
│   └── .flipkart-btn-primary       # Orange button
│
├── Animations
│   ├── .shimmer                    # Loading skeleton
│   ├── .glass-panel                # Glass morphism
│   ├── .neon-border                # Neon glow
│   └── .line-clamp-*               # Text truncation
│
└── Accessibility
    ├── prefers-reduced-motion      # Disables all animations
    └── Custom scrollbars
```

### 14.2 Design Tokens

The app uses CSS custom properties (variables) for all colors:

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--primary` | `#2874F0` | `#2874F0` | Buttons, links, active states |
| `--accent` | `#FF9F00` | `#FF9F00` | CTA buttons, discounts |
| `--background` | `#F1F3F6` | `#0D0D0D` | Page background |
| `--foreground` | `#212121` | `#F5F5F5` | Text |
| `--card` | `#FFFFFF` | `#1A1A1A` | Card backgrounds |
| `--border` | `#F0F0F0` | `#333333` | Borders |
| `--brand-buy` | `#FB641B` | `#FB641B` | "Buy Now" button |

### 14.3 Responsive Design

- **Desktop**: Full layout with sidebar, top nav, footer
- **Mobile (<768px)**: Bottom navigation bar, hamburger menu, stacked layouts
- All pages tested at common breakpoints (sm: 640px, md: 768px, lg: 1024px)

---

## 15. Environment Variables

Copy `.env.example` → `.env` and fill in:

```env
# ── Database (Required) ──
DATABASE_URL      = postgresql://user:pass@host:5432/dbname
DIRECT_URL        = postgresql://user:pass@host:5432/dbname?sslmode=require

# ── Supabase (Required) ──
NEXT_PUBLIC_SUPABASE_URL      = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY     = eyJhbGciOiJIUzI1NiIs...

# ── App URLs (Required) ──
NEXT_PUBLIC_SITE_URL = http://localhost:3000
NEXT_PUBLIC_APP_URL  = http://localhost:3000
NEXT_PUBLIC_BASE_PATH =

# ── Razorpay (Payments) ──
NEXT_PUBLIC_RAZORPAY_KEY_ID = rzp_live_...
RAZORPAY_KEY_SECRET         = rzp_secret_...
RAZORPAYX_ACCOUNT_NUMBER    = (optional, for seller payouts)

# ── Google OAuth ──
NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID = 123456.apps.googleusercontent.com

# ── Cloudinary (Image Upload) ──
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = your-cloud
CLOUDINARY_API_KEY               = 123456
CLOUDINARY_API_SECRET             = abcdef

# ── Resend (Email — optional) ──
RESEND_API_KEY = re_abcdef

# ── Hugging Face (AI Moderation — optional) ──
HUGGINGFACE_API_KEY = hf_abcdef

# ── Cron (Scheduled Jobs — optional) ──
CRON_SECRET = your-secret
```

---

## 16. How to Run Locally

### Prerequisites

```bash
# Install these:
- Node.js v18+       (https://nodejs.org)
- PostgreSQL 14+     (or use Supabase's hosted DB)
- Git                (https://git-scm.com)
- VS Code            (https://code.visualstudio.com)
```

### Step-by-Step

```bash
# 1. Clone the repository
git clone <repository-url>
cd maghgo-mid-level

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Create .env file
#    Copy .env.example → .env and fill in all values

# 4. Set up database
npx prisma generate          # Generate Prisma client
npx prisma db push           # Push schema to database

# 5. (Optional) Seed demo data
#    Visit http://localhost:3000/api/seed in browser

# 6. Start the development server
npm run dev

# 7. Open in browser
#    http://localhost:3000
```

### Available Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Build for production (with Prisma) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Sync Prisma schema to database |
| `npm run db:migrate` | Create/run migrations |
| `npm run db:reset` | Reset database |
| `npm run cap:sync` | Sync Capacitor plugins |
| `npm run cap:copy` | Copy web build to Android |
| `npm run cap:open` | Open Android Studio |
| `npm run cap:build:debug` | Build debug APK |
| `npm run cap:build:release` | Build release APK |

---

## 17. How to Deploy

### Deploy to Vercel

```bash
# 1. Push code to GitHub

# 2. Go to https://vercel.com
#    → Import repository
#    → Set Framework: Next.js

# 3. Add ALL environment variables (from .env)
#    → Settings → Environment Variables

# 4. Deploy
#    → Vercel auto-deploys on every push to main branch

# 5. Update Supabase Auth settings
#    → Add Vercel deployment URL to allowed redirect URLs
```

### Build Android APK

```bash
# Requires: Android Studio, Java 17

# On a machine with Android SDK:
npm run build              # Build web app
npx cap copy android       # Copy to Android
npm run cap:build:debug    # Build APK

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 18. Troubleshooting

### Build Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Module not found` | Dependencies not installed | `npm install --legacy-peer-deps` |
| `Prisma schema validation` | Missing DATABASE_URL env var | Check `.env` file is correct |
| `next build fails` | TypeScript errors | Run `npx tsc --noEmit` to find errors |
| `Database connection refused` | PostgreSQL not running | Start PostgreSQL or check connection string |

### Auth Issues

| Error | Cause | Fix |
|-------|-------|-----|
| `Email not confirmed` | User hasn't verified email | Check Supabase Auth settings (disable email confirm for testing) |
| `User not found` | Profile not created in database | Check `/api/auth/me` route — should auto-create now |
| Google login shows error screen | Wrong redirect URIs | Update Google Cloud Console OAuth settings |
| `Invalid login credentials` | Wrong email/password | Check user exists in Supabase Auth dashboard |

### Payment Issues

| Error | Cause | Fix |
|-------|-------|-----|
| Razorpay not loading | Missing RAZORPAY_KEY_ID | Check `.env` has correct Razorpay keys |
| `Order creation failed` | Razorpay API error | Check RAZORPAY_KEY_SECRET is correct |
| Payment verification fails | Signature mismatch | Check both Razorpay keys match your dashboard |

### Android Build Issues

| Error | Cause | Fix |
|-------|-------|-----|
| `JAVA_HOME not set` | Java not configured | Set JAVA_HOME env variable |
| `Android SDK not found` | SDK not installed | Install Android SDK via Android Studio |
| `google-services.json not found` | Missing Firebase config | Download from Firebase Console → Android app |
| `BUILD FAILED` | Gradle error | Check `./gradlew clean` then rebuild |

### General

| Problem | Solution |
|---------|----------|
| Port 3000 in use | `npm run dev -- -p 3001` |
| Slow page loads | Check PostgreSQL connection, add missing indexes |
| Styles not loading | Clear browser cache, restart dev server |
| .env not being read | Restart dev server after changing .env |

---

## Key Scripts Reference

| Script (`package.json`) | Command |
|------------------------|---------|
| `npm run dev` | `next dev -p 3000` |
| `npm run build` | `prisma generate && prisma db push --skip-generate && next build` |
| `npm run start` | `node .next/standalone/server.js` |
| `npm run lint` | `eslint .` |
| `npm run cap:build:debug` | `npm run build && npx cap copy && npx cap sync && cd android && ./gradlew assembleDebug` |
| `npm run cap:build:release` | `npm run build && npx cap copy && npx cap sync && cd android && ./gradlew assembleRelease` |
