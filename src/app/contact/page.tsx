"use client";

import type { Metadata } from "next";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
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
        <p className="mt-2 text-slate-300">Get in Touch with QuickEase Lift Parts</p>
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
                  <a href="mailto:info@quickeaseliftparts.com" className="text-blue-600 hover:underline">info@quickeaseliftparts.com</a>
                </div>
                <div className="rounded-lg border p-5">
                  <p className="mb-1 font-semibold text-slate-800">📞 Phone</p>
                  <p>+86 13335386941</p>
                </div>
                <div className="rounded-lg border p-5">
                  <p className="mb-1 font-semibold text-slate-800">💬 WhatsApp</p>
                  <a href="https://wa.me/8613335386941" target="_blank" className="text-green-600 hover:underline">Chat on WhatsApp</a>
                </div>
                <div className="rounded-lg border p-5">
                  <p className="mb-1 font-semibold text-slate-800">📍 Address</p>
                  <p>Shaanxi, China</p>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div>
              <h2 className="mb-6 text-xl font-bold text-slate-800">Send Us a Message</h2>
              {sent ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
                  <p className="text-lg font-semibold text-green-700">✅ Message Sent!</p>
                  <p className="mt-2 text-sm text-green-600">We will get back to you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="h-12 w-full rounded-lg border border-slate-300 px-4 text-sm focus:border-slate-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
                    <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="h-12 w-full rounded-lg border border-slate-300 px-4 text-sm focus:border-slate-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="h-12 w-full rounded-lg border border-slate-300 px-4 text-sm focus:border-slate-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Message *</label>
                    <textarea required rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-500 focus:outline-none" />
                  </div>
                  <Button type="submit" disabled={loading} size="lg" className="w-full bg-slate-800 hover:bg-slate-700 text-base py-3 h-auto">
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
