import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const where: any = status ? { status } : {};
    const [prompts, total] = await Promise.all([
      db.prompt.findMany({ where, include: { seller: { select: { name: true, email: true } }, category: { select: { name: true } } }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      db.prompt.count({ where })
    ]);
    return NextResponse.json({ success: true, data: { prompts, total, pages: Math.ceil(total / limit) } });
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}