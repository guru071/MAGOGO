# MAGHGO Developer Documentation

Welcome to the MAGHGO codebase! This document provides a comprehensive overview of the architecture, tech stack, and core systems of this enterprise-level digital marketplace for AI Prompts.

## 🚀 Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Database Engine:** PostgreSQL (Neon Serverless or equivalent)
- **Authentication:** Supabase Auth (SSR configured)
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand (`src/store/marketplace.ts`)
- **Icons:** Lucide React

## 📂 Project Structure

```text
/
├── prisma/
│   └── schema.prisma         # Database schema defining all models (User, Prompt, Order, Cart, etc.)
├── src/
│   ├── app/                  # Next.js App Router (Pages & API Routes)
│   │   ├── api/              # Backend REST API routes
│   │   ├── (marketplace)/    # Frontend Pages (Homepage, Browse, Seller Dashboard)
│   │   └── admin/            # Admin Panel UI
│   ├── components/           # React Components
│   │   ├── ui/               # shadcn/ui generic components (Buttons, Inputs, Dialogs)
│   │   ├── marketplace/      # Specific components (Navbar, PromptCard, Hero)
│   │   └── admin/            # Admin-specific components
│   ├── lib/                  # Utilities (db.ts, supabase-server.ts, auth-helpers.ts)
│   └── store/                # Zustand global state (marketplace.ts)
├── make-admin.ts             # CLI script to grant a user ADMIN privileges
└── create-admin-supabase.ts  # CLI script to sync Supabase user with Prisma database
```

## 🔐 Authentication Flow

The application uses **Supabase Auth** paired with a custom **Prisma `User` table** to store extended user data (like wallet balances, seller status, and earnings).

1. **Sign Up / Sign In:** Handled via the frontend `createSupabaseBrowserClient()` which talks to Supabase.
2. **Session Sync:** When a user logs in, the `getCurrentUser()` helper in `src/lib/auth-helpers.ts` takes the Supabase session ID (`authUserId`), looks it up in the Prisma `User` table, and returns the full profile.
3. **Sign Out:** The global `logout()` function in `src/store/marketplace.ts` hits the `/api/auth/logout` endpoint, which forcefully deletes all `sb-` server cookies, ensuring robust un-authentication across the App Router.

## 🛒 E-Commerce Systems

### 1. The Cart & Checkout
- **State:** Managed locally in Zustand (`store/marketplace.ts`) and synced to the backend via `/api/cart`.
- **Database Models:** `Cart` and `CartItem`.
- **Checkout:** Users can purchase multiple prompts from different sellers simultaneously. 

### 2. Multi-Vendor Payouts (The Escrow System)
When a prompt is purchased, the funds are conceptually "held" by the platform.
- **Cron Job:** The `/api/cron/process-payouts/route.ts` runs periodically. It scans for completed orders older than 10 days.
- **Payout Generation:** It groups these orders by `sellerId` and creates a `Payout` record.
- **Integration Note:** The actual wiring of fiat money requires integrating a payment gateway (e.g. Stripe Connect or PayPal Payouts API) inside this cron job to trigger the bank transfer when the `Payout` is created.

### 3. Seller Storefronts & Inventory
- Sellers have dynamic profiles generated from the `Storefront` Prisma model.
- Prompts belong to a seller (`userId`) and contain `price`, `description`, `category`, and `instructions`.

## 📡 API Architecture (Route Handlers)

All API logic is stored in `src/app/api/`. We use strict role-based access control inside these routes.

- `/api/auth/*`: Session management and profile generation.
- `/api/prompts/*`: CRUD for prompts.
- `/api/cart/*`: Cart synchronization.
- `/api/wallet/*`: Digital wallet top-ups and balance checks.
- `/api/qna/*`: Customer questions and seller answers on product pages.
- `/api/admin/*`: Protected routes for the Admin Dashboard to fetch analytics and user data.

## 🛠️ Local Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables (`.env`):**
   Ensure you have the following configured:
   ```env
   DATABASE_URL="postgresql://user:pass@host/db"
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

3. **Sync Database:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

## ⚠️ Common Developer Gotchas
- **Next.js Caching:** Because we use the App Router, some pages or API routes may cache aggressively. If real-time data is stale, ensure `export const dynamic = 'force-dynamic'` is set at the top of the route handler, or use `revalidatePath`.
- **Auth Errors:** If you get strange 401 Unauthorized errors in development, clear your browser cookies. Supabase cookies can occasionally conflict if you recreate the database without clearing your local state.
- **Prisma Schema Changes:** Always run `npx prisma db push` followed by `npx prisma generate` when you add new fields to `schema.prisma` or TypeScript will throw compilation errors.
