import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    // Check Supabase / Database
    let supabaseConfigured = false;
    let supabaseConnected = false;
    let supabaseError: string | undefined;
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      supabaseConfigured = !!(supabaseUrl && supabaseAnonKey && serviceKey);
      // Try a DB query to verify connection
      if (supabaseConfigured) {
        await db.user.count();
        supabaseConnected = true;
      }
    } catch (e: unknown) { 
      supabaseError = e instanceof Error ? e.message : String(e);
      supabaseConnected = false;
    }

    // Always try to verify our local SQLite DB connection
    let dbConnected = false;
    let dbError: string | undefined;
    try {
      await db.user.count();
      dbConnected = true;
    } catch (e: unknown) { 
      dbError = e instanceof Error ? e.message : String(e);
    }

    // Get DB size using Postgres function
    let dbSize = 0;
    try {
      const result = await db.$queryRaw<Array<{ size: bigint }>>`SELECT pg_database_size(current_database()) as size`;
      if (result && result.length > 0) {
        dbSize = Number(result[0].size);
      }
    } catch (e) {
      console.error('[admin/infrastructure] db size error', e);
    }

    // Count Prisma models by inspecting the schema or counting tables
    // Postgres approach: count tables in public schema
    let tableCount = 0;
    try {
      const rawTables = await db.$queryRaw<Array<{ table_name: string }>>`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
      tableCount = rawTables.length;
    } catch (e) {
      console.error('[admin/infrastructure] table count error', e);
      tableCount = 0;
    }

    // Check Cloudinary
    const cloudinaryConfigured = !!(
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.trim() !== '' &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_KEY.trim() !== ''
    );

    // Check Razorpay
    const razorpayConfigured = !!(
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.trim() !== '' &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_KEY_SECRET.trim() !== ''
    );

    // Format DB size
    const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    return NextResponse.json({
      success: true,
      data: {
        supabase: {
          configured: supabaseConfigured,
          connected: supabaseConnected,
          error: supabaseError,
        },
        cloudinary: { configured: cloudinaryConfigured },
        razorpay: { configured: razorpayConfigured },
        database: {
          connected: dbConnected,
          error: dbError,
          size: formatSize(dbSize),
          sizeBytes: dbSize,
          tables: tableCount,
        },
      },
    });
  } catch { 
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}