"use client";

import { useState } from "react";
import { useSiteConfig } from "@/lib/site-config-context";

export default function ContactPage() {
  const cfg = useSiteConfig();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="bg-slate-800 py-16 text-center text-white">
        <h1 className="text-3xl font-bold md:text-4xl">Contact Us</h1>
        <p className="mt-2 text-slate-300">
          Get in Touch with QuickEase Lift Parts
        </p>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 md:grid-cols-2">
            {/* Contact details */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800">Get In Touch</h2>
              <div className="space-y-4 text-sm text-slate-600">
                <div className="rounded-lg border p-5">
                  <p className="mb-1 font-semibold text-slate-800">📧 Email</p>
                  <a
                    href={`mailto:${cfg.contact_email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {cfg.contact_email}
                  </a>
                </div>
                <div className="rounded-lg border p-5">
                  <p className="mb-1 font-semibold text-slate-800">📞 Phone</p>
                  <p>{cfg.contact_phone}</p>
                </div>
                <div className="rounded-lg border p-5">
                  <p className="mb-1 font-semibold text-slate-800">
                    💬 WhatsApp
                  </p>
                  <a
                    href={`https://wa.me/${cfg.contact_whatsapp?.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    className="text-blue-600 hover:underline"
                  >
                    {cfg.contact_whatsapp}
                  </a>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div>
              <h2 className="mb-6 text-xl font-bold text-slate-800">
                Send a Message
              </h2>
              {sent ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
                  <p className="text-lg">✅</p>
                  <p className="mt-2 text-sm text-green-700">
                    Message sent successfully! We&apos;ll get back to you soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Your Name *"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
                  />
                  <input
                    type="email"
                    placeholder="Your Email *"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
                  />
                  <input
                    type="tel"
                    placeholder="Your Phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
                  />
                  <textarea
                    placeholder="Your Message *"
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    required
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? "⏳ Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
