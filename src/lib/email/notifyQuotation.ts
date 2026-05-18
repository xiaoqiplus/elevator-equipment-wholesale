import { resend } from "./resend";

export interface QuotationNotification {
  id: string;
  status: string;
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  user: {
    email: string;
    name?: string | null;
    companyName?: string | null;
  };
  createdAt: Date | string;
}

/**
 * Send an email notification to the admin when a new quotation is submitted.
 * The email includes the customer's info and a product summary.
 *
 * Errors are caught and logged — they never propagate to the caller,
 * so a failed email does not block the API response.
 */
export async function notifyNewQuotation(
  quotation: QuotationNotification
): Promise<void> {
  if (!resend) {
    console.warn(
      "[notifyNewQuotation] Resend not configured — skipping email"
    );
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const customer = quotation.user;

  // Build product list HTML
  const productRows = quotation.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;font-family:monospace;">${item.sku}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${item.price.toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
      <h2 style="color:#1a1a2e;">新报价请求</h2>
      <p><strong>报价单编号：</strong>${quotation.id}</p>
      <p><strong>状态：</strong>${quotation.status}</p>
      <p><strong>提交时间：</strong>${new Date(quotation.createdAt).toLocaleString("zh-CN")}</p>

      <h3 style="margin-top:24px;color:#1a1a2e;">客户信息</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:4px 0;color:#666;">姓名</td><td>${customer.name || "未提供"}</td></tr>
        <tr><td style="padding:4px 0;color:#666;">邮箱</td><td>${customer.email}</td></tr>
        <tr><td style="padding:4px 0;color:#666;">公司</td><td>${customer.companyName || "未提供"}</td></tr>
      </table>

      <h3 style="margin-top:24px;color:#1a1a2e;">产品清单</h3>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="padding:8px;text-align:left;">产品名称</th>
            <th style="padding:8px;text-align:left;">SKU</th>
            <th style="padding:8px;text-align:center;">数量</th>
            <th style="padding:8px;text-align:right;">单价</th>
          </tr>
        </thead>
        <tbody>
          ${productRows}
        </tbody>
      </table>

      <p style="margin-top:24px;color:#666;font-size:12px;">
        此邮件由系统自动发送，请登录后台查看完整报价详情。
      </p>
      <p style="color:#666;font-size:12px;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/admin/quotations/${quotation.id}">
          查看报价单 → ${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/admin/quotations
        </a>
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Elevator Equipment <noreply@elevatorequipment.com>",
      to: adminEmail,
      subject: `新报价请求 #${quotation.id}`,
      html,
    });
  } catch (error) {
    console.error("[notifyNewQuotation] Failed to send email:", error);
    // Intentionally not throwing — email failure should not block the API
  }
}
