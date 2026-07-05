import { getCurrentUser } from '@/lib/auth-helpers';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });

    const ext = file.name.split('.').pop() || 'png';
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // AI IMAGE MODERATION (NSFW Check)
    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        const aiRes = await fetch("https://api-inference.huggingface.co/models/Falconsai/nsfw_image_detection", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/octet-stream"
          },
          body: buffer
        });
        
        if (aiRes.ok) {
          const result = await aiRes.json();
          const nsfwScore = result.find((r: { label: string; score: number }) => r.label === 'nsfw')?.score || 0;
          if (nsfwScore > 0.6) {
             return NextResponse.json({ success: false, error: 'Upload rejected: Inappropriate content detected by AI Moderation.' }, { status: 400 });
          }
        }
      } catch (err) {
        console.error('[ai-moderation] Failed to scan image', err);
      }
    }

    let finalBuffer = buffer;
    let finalContentType = file.type;
    let finalExt = ext;

    // Compress image if larger than 500KB
    if (buffer.length > 500 * 1024) {
      try {
        finalBuffer = Buffer.from(await sharp(buffer)
          .jpeg({ quality: 75 })
          .toBuffer());
        finalContentType = 'image/jpeg';
        finalExt = 'jpg';
      } catch (err) {
        console.error('[compression] Failed to compress image', err);
      }
    }

    const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${finalExt}`;

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage.from('prompts').upload(filename, finalBuffer, { contentType: finalContentType });
    
    if (error) {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
    
    const { data: { publicUrl } } = supabase.storage.from('prompts').getPublicUrl(filename);
    return NextResponse.json({ success: true, url: publicUrl });
  } catch {  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}
