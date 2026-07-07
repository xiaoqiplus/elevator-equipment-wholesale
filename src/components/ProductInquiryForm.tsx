"use client";

import { useState } from "react";

interface Props {
  productSku?: string;
  productName?: string;
}

export default function ProductInquiryForm({ productSku, productName }: Props) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    setLoading(true);
    try {
      let message = (form.elements.namedItem("message") as HTMLTextAreaElement).value;
      // Prepend product info if available
      if (productSku || productName) {
        const prefix = `[Inquiry about ${productName || "product"} (SKU: ${productSku || "N/A"})]\n`;
        message = prefix + message;
      }
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: (form.elements.namedItem("name") as HTMLInputElement).value,
          email: (form.elements.namedItem("email") as HTMLInputElement).value,
          message,
        }),
      });
      if (res.ok) setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border p-6">
      {productSku && (
        <p className="mb-3 text-xs text-slate-500">
          Inquiring about: <strong>{productName || "Product"} ({productSku})</strong>
        </p>
      )}
      <h3 className="mb-4 text-base font-bold text-slate-800">Quick Inquiry</h3>
      {sent ? (
        <p className="py-4 text-center font-semibold text-green-600">✅ Sent! We&apos;ll reply soon.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" name="name" placeholder="Your Name *" required
            className="h-10 w-full rounded border border-slate-300 px-3 text-xs focus:border-slate-500 focus:outline-none" />
          <input type="email" name="email" placeholder="Your Email *" required
            className="h-10 w-full rounded border border-slate-300 px-3 text-xs focus:border-slate-500 focus:outline-none" />
          <textarea name="message" placeholder="Your Inquiry *" required rows={4}
            className="w-full rounded border border-slate-300 px-3 py-2 text-xs focus:border-slate-500 focus:outline-none" />
          <button type="submit" disabled={loading}
            className="w-full rounded bg-slate-800 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors disabled:opacity-50">
            {loading ? "Sending..." : "Send Inquiry"}
          </button>
        </form>
      )}
    </div>
  );
}
