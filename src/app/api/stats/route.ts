import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const revalidate = 60;

export async function GET() {
  try {
    const [totalUsers, totalSellers, totalPrompts, totalCategories] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { isSeller: true } }),
      db.prompt.count({ where: { status: 'APPROVED' } }),
      db.category.count({ where: { isActive: true } }),
    ]);
    return NextResponse.json({
      success: true,
      data: { totalUsers, totalSellers, totalPrompts, totalCategories },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
