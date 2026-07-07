import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { authUserId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, promptText, price, recommendedAI, categoryId } = body;

    // Generate slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);

    const newPrompt = await prisma.prompt.create({
      data: {
        title,
        slug,
        description,
        promptText,
        price,
        recommendedAI,
        categoryId,
        sellerId: dbUser.id,
        sampleImages: "[]", // Start with empty images, can add upload later
        tags: "[]",
        status: "APPROVED", // Auto approve for now
      },
    });

    return NextResponse.json(newPrompt, { status: 201 });
  } catch (error) {
    console.error("Failed to create prompt:", error);
    return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 });
  }
}
