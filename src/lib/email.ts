import { Resend } from 'resend';
import { formatUSD } from '@/lib/currencies';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

export const sendWelcomeEmail = async (email: string, name: string) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email] Mock Welcome Email sent to ${email}`);
    return;
  }
  
  try {
    await resend.emails.send({
      from: 'MAGHGO <welcome@maghgo.goatecch.tech>',
      to: email,
      subject: 'Welcome to MAGHGO!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #00d2ff;">Welcome to MAGHGO, ${name}!</h1>
          <p>We're thrilled to have you join the premier marketplace for AI prompts.</p>
          <p>Start exploring top-tier prompts and take your AI generation to the next level.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display: inline-block; padding: 10px 20px; background: linear-gradient(135deg, #00d2ff, #ff0080); color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Explore Prompts</a>
        </div>
      `,
    });
  } catch (error) {
    console.error('[email] Error sending welcome email:', error);
  }
};

export const sendReceiptEmail = async (email: string, promptTitle: string, amount: number) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email] Mock Receipt sent to ${email} for ${promptTitle}`);
    return;
  }

  try {
    await resend.emails.send({
      from: 'MAGHGO <receipts@maghgo.goatecch.tech>',
      to: email,
      subject: `Your Receipt for ${promptTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #00d2ff;">Thanks for your purchase!</h1>
          <p>You have successfully purchased <strong>${promptTitle}</strong> for ${formatUSD(amount)}.</p>
          <p>You can access your prompt immediately in your dashboard.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/orders" style="display: inline-block; padding: 10px 20px; background: linear-gradient(135deg, #00d2ff, #3a7bd5); color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Order</a>
        </div>
      `,
    });
  } catch (error) {
    console.error('[email] Error sending receipt email:', error);
  }
};
