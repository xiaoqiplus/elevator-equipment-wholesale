import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFY_EMAIL } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || "465"),
    secure: SMTP_PORT !== "587",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function POST(request: Request) {
  try {
    const { name, email, phone, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 });
    }

    // Save to database
    const contact = await prisma.contactMessage.create({
      data: { name, email, phone: phone || null, message },
    });

    // Send email notification (best-effort)
    try {
      const transporter = createTransporter();
      if (transporter) {
        const notifyEmail = process.env.NOTIFY_EMAIL || "info@quickeaseliftparts.com";
        const isProductInquiry = message.startsWith("[Inquiry about");
        const subject = isProductInquiry
          ? `New Product Inquiry from ${name}`
          : `New Contact Message from ${name}`;
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: notifyEmail,
          subject,
          text: [
            `Name: ${name}`,
            `Email: ${email}`,
            `Phone: ${phone || "N/A"}`,
            "",
            `Message:`,
            message,
          ].join("\n"),
        });
      }
    } catch (emailErr) {
      console.error("Email send failed (non-fatal):", emailErr);
    }

    return NextResponse.json({ success: true, id: contact.id });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
