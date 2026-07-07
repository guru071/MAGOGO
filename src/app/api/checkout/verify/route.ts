import { NextResponse } from "next/server";
import crypto from "crypto";
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, promptIds } = await req.json();

    if (!promptIds || !Array.isArray(promptIds)) {
      return NextResponse.json({ error: "No prompts provided" }, { status: 400 });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Fetch the actual prices for the bought prompts
      const prompts = await prisma.prompt.findMany({
        where: { id: { in: promptIds } }
      });

      // Insert the Order into Prisma for each prompt
      for (const prompt of prompts) {
        await prisma.order.create({
          data: {
            amount: prompt.price,
            status: "COMPLETED",
            userId: dbUser.id,
            promptId: prompt.id,
          }
        });

        // Increment the seller's downloadCount
        await prisma.prompt.update({
          where: { id: prompt.id },
          data: { downloadCount: { increment: 1 } }
        });
      }
      
      return NextResponse.json({ success: true, message: "Payment verified successfully" });
    } else {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } catch (error) {
    console.error("Payment verification failed:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
