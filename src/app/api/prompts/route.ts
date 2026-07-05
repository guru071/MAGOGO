import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/lib/ai-client';
import { sanitizePromptsForUser } from '@/lib/prompt-security';

function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36); }

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const isFree = searchParams.get('isFree');
    const isTrending = searchParams.get('isTrending');
    const isFeatured = searchParams.get('isFeatured');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sellerId = searchParams.get('sellerId');
    const tags = searchParams.get('tags');
    const aiFilter = searchParams.get('ai');
    const user = await getCurrentUser();

    const where: any = { status: 'APPROVED' };
    if (category) where.categoryId = category;
    if (isFree === 'true') where.isFree = true;
    if (isTrending === 'true') where.isTrending = true;
    if (isFeatured === 'true') where.isFeatured = true;
    if (sellerId) where.sellerId = sellerId;
    if (search) where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags: { contains: search, mode: 'insensitive' } },
    ];
    if (minPrice) where.price = { ...where.price, gte: parseFloat(minPrice) };
    if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice) };
    if (tags) where.tags = { contains: tags };
    if (aiFilter) where.recommendedAI = { contains: aiFilter };

    const orderBy: any = sort === 'popular' ? { likeCount: 'desc' } : sort === 'price_low' ? { price: 'asc' } : sort === 'price_high' ? { price: 'desc' } : sort === 'rating' ? { rating: 'desc' } : { createdAt: 'desc' };

    const [prompts, total] = await Promise.all([
      db.prompt.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit, include: { seller: { select: { id: true, name: true, avatar: true, isVerified: true } }, category: { select: { id: true, name: true, slug: true } } } }),
      db.prompt.count({ where })
    ]);

    let responsePrompts = prompts as any[];

    // AI ranking for text searches
    if (search && search.trim() && prompts.length > 0) {
      const aiResult = await ai.search.rank(search, prompts as any, user?.id?.toString()).catch(e => { console.error('[prompts] AI ranking error', e); return null; });
      if (aiResult?.success && aiResult.data) {
        responsePrompts = (aiResult.data as any[]).slice(0, limit);
      }
    }

    const data = {
      prompts: await sanitizePromptsForUser(responsePrompts, user),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };

    return NextResponse.json({ success: true, data });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { title, description, promptText, sampleImages, categoryId, tags, recommendedAI, price, isFree, discount, razorpayPaymentId, razorpayOrderId, razorpaySignature } = body;
    if (!title || !description || !promptText || !categoryId) return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });

    const { getFeeConfig, calculateFees } = await import('@/lib/fees');
    const feeConfig = await getFeeConfig();
    const finalPrice = isFree ? 0 : price || 0;
    
    // Calculate listing fee
    let listingFee = 0;
    if (!isFree) {
      let categoryName: string | undefined = undefined;
      if (categoryId) {
        const cat = await db.category.findUnique({ where: { id: categoryId } });
        if (cat) categoryName = cat.name;
      }
      const feeBreakdown = calculateFees(finalPrice, feeConfig, promptText.length, categoryName);
      listingFee = feeBreakdown.totalFees;
    }

    // Bypass fee for admins
    if (user.role === 'ADMIN') {
      listingFee = 0;
    }

    let isDirectRazorpay = false;

    // Check direct Razorpay payment first
    if (listingFee > 0 && razorpayPaymentId && razorpayOrderId && razorpaySignature) {
      const { verifyPayment } = await import('@/lib/razorpay');
      if (verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
        isDirectRazorpay = true;
      } else {
        return NextResponse.json({ success: false, error: 'Invalid Razorpay payment signature' }, { status: 400 });
      }
    }

    const promptResult = await db.$transaction(async (tx) => {
      // Check balance for sellers if not using direct Razorpay (inside transaction to prevent race conditions)
      if (listingFee > 0 && !isDirectRazorpay) {
        const dbUser = await tx.user.findUnique({ where: { id: user.id! } });
        if (!dbUser || dbUser.currentBalance < listingFee) {
          return { error: `Insufficient balance. You need $${listingFee.toFixed(2)} in your wallet to list this prompt.` };
        }
        
        await tx.user.update({
          where: { id: user.id! },
          data: { currentBalance: { decrement: listingFee } }
        });
        
        await tx.walletTransaction.create({
          data: {
            userId: user.id!,
            amount: listingFee,
            type: 'DEBIT',
            description: 'Prompt Upload Fee paid via Wallet Balance',
            status: 'COMPLETED'
          }
        });
      }
      
      // Optionally record transaction if it was paid via Razorpay
      if (listingFee > 0 && isDirectRazorpay) {
         await tx.walletTransaction.create({
           data: {
             userId: user.id!,
             amount: listingFee,
             type: 'DEBIT',
             paymentId: razorpayPaymentId,
             description: `Prompt Upload Fee paid directly via Razorpay (${razorpayPaymentId})`,
             status: 'COMPLETED'
           }
         });
      }

      const p = await tx.prompt.create({
        data: {
          title, slug: slugify(title), description, promptText,
          sampleImages: JSON.stringify(sampleImages || []), categoryId,
          tags: JSON.stringify(tags || []), recommendedAI: JSON.stringify(recommendedAI || []),
          price: finalPrice, isFree: isFree || false,
          originalPrice: discount && discount > 0 ? finalPrice / (1 - discount / 100) : undefined,
          discount: discount || 0, platformFee: listingFee, sellerId: user.id!,
          status: 'APPROVED'
        }
      });
      return { prompt: p };
    });

    if (promptResult.error) {
      return NextResponse.json({ success: false, error: promptResult.error }, { status: 400 });
    }
    const prompt = promptResult.prompt;


    // AI fraud check (non-blocking)
    ai.fraud.checkPrompt({
      id: prompt!.id, title, description, promptText, tags,
      categoryId, price: finalPrice, isFree, discount,
    }).catch(e => { console.error('[prompts] fraud check error', e); });

    // AI quality scoring (non-blocking)
    ai.quality.score({
      id: prompt!.id, title, description, promptText, tags,
      categoryId, price: finalPrice, isFree, discount,
      seller: { id: user.id, isVerified: user.isVerified, isSeller: user.isSeller, totalEarnings: user.totalEarnings },
    }).catch(e => { console.error('[prompts] quality score error', e); });

    // Generate and store Deep Learning embedding (non-blocking)
    const textToEmbed = `${title} ${description} ${tags ? (Array.isArray(tags) ? tags.join(' ') : tags) : ''}`;
    ai.search.embed(textToEmbed).then(async (res) => {
      if (res.success && res.data) {
        try {
          await db.$executeRawUnsafe(`UPDATE "Prompt" SET embedding = '[${res.data.join(',')}]'::vector WHERE id = $1`, prompt!.id);
        } catch (dbErr) {
          console.error('[prompts] failed to save embedding to db', dbErr);
        }
      }
    }).catch(e => console.error('[prompts] embedding generation error', e));

    // Fire-and-forget quality check with auto-approve/reject
    fetch(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/api/quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `${title} ${description}`, promptId: prompt!.id }),
    }).then(async qRes => {
      if (!qRes.ok) return;
      const qData = await qRes.json();
      if (qData && qData.score !== undefined) {
        await db.prompt.update({ where: { id: prompt!.id }, data: { qualityScore: qData.score } });
        const settings = await db.platformSettings.findFirst({ where: { key: 'quality_config' } });
        if (settings?.value) {
          const config = JSON.parse(settings.value as string);
          if (config.enabled) {
            if (qData.score < config.autoRejectThreshold) {
              await db.prompt.update({ where: { id: prompt!.id }, data: { status: 'REJECTED' } });
            } else if (qData.score >= config.autoApproveThreshold) {
              await db.prompt.update({ where: { id: prompt!.id }, data: { status: 'APPROVED' } });
            }
          }
        }
      }
    }).catch(e => { console.error('[prompts] auto-approve quality check error', e); });

    return NextResponse.json({ success: true, data: prompt }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
