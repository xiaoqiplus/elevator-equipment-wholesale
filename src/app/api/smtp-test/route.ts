import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const dynamic = 'force-dynamic';

export async function GET() {
  const result: any = { env: {}, smtp: null, error: null };

  // Check what env vars are available (hide password)
  result.env.host = process.env.SMTP_HOST ? "✅" : "❌";
  result.env.port = process.env.SMTP_PORT || "465";
  result.env.user = process.env.SMTP_USER ? "✅" : "❌";
  result.env.pass = process.env.SMTP_PASS ? `✅ (${process.env.SMTP_PASS.length} chars)` : "❌";
  result.env.notify = process.env.NOTIFY_EMAIL || "(not set)";

  // Try to connect
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.hostinger.com",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true,
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    });
    
    // Verify connection
    const verify = await transporter.verify();
    result.smtp = verify ? "✅ Connection OK" : "❌ Failed";
    
    // Send a test
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const info = await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.SMTP_USER,
        subject: "SMTP Test from QuickEase",
        text: "If you receive this, SMTP is working!",
      });
      result.sent = `✅ Message sent: ${info.messageId}`;
    }
  } catch (err: any) {
    result.error = err.message?.substring(0, 300);
    result.code = err.code;
  }

  return NextResponse.json(result);
}
