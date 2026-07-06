import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getFeeConfig, calculateFees } from '@/lib/fees';

export async function POST(req: NextRequest) {
  try {
    const { amount, promptLength, categoryId } = await req.json();
    
    let categoryName: string | undefined = undefined;
    if (categoryId) {
      const category = await db.category.findUnique({ where: { id: categoryId } });
      if (category) {
        categoryName = category.name;
      }
    }

    const feeConfig = await getFeeConfig();
    const feeBreakdown = calculateFees(amount || 0, feeConfig, promptLength, categoryName);

    return NextResponse.json({ success: true, data: feeBreakdown });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
