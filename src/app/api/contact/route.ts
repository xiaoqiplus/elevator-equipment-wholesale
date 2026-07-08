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
    await prisma.contactMessage.create({
      data: { name, email, phone: phone || null, message },
    });

    // Send email notification
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
        html: `
          <h2>${subject}</h2>
          <table style="border-collapse:collapse;width:100%;max-width:500px">
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Name</td><td style="padding:8px;border:1px solid #ddd">${name}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Phone</td><td style="padding:8px;border:1px solid #ddd">${phone || "N/A"}</td></tr>
          </table>
          <h3>Message:</h3>
          <pre style="background:#f5f5f5;padding:12px;border-radius:4px;white-space:pre-wrap">${message}</pre>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
