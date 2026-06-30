import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact Us", description: "Contact QuickEasy Lift Parts" };

export default function ContactPage() {
  return (
    <div>
      {/* Banner */}
      <section className="bg-slate-800 py-16 text-center text-white">
        <h1 className="text-3xl font-bold md:text-4xl">Contact Us</h1>
        <p className="mt-2 text-slate-300">Get in Touch with QuickEasy Lift Parts</p>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 md:grid-cols-2">
            {/* Contact details */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800">Get In Touch</h2>
              <div className="space-y-4 text-sm text-slate-600">
                <div className="rounded-lg border p-4">
                  <p className="font-semibold text-slate-800">📧 Email</p>
                  <p>info@quickeasyliftparts.com</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="font-semibold text-slate-800">📞 Phone</p>
                  <p>+86 138-xxxx-xxxx</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="font-semibold text-slate-800">💬 WhatsApp</p>
                  <p>+86 138-xxxx-xxxx</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="font-semibold text-slate-800">📍 Address</p>
                  <p>XX Province, China</p>
                </div>
              </div>
            </div>

            {/* QR / map */}
            <div className="flex items-center justify-center rounded-lg border bg-slate-50 p-10">
              <div className="text-center">
                <div className="mx-auto mb-4 h-40 w-40 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-sm">
                  QR Code
                </div>
                <p className="text-sm text-slate-500">Scan to contact us on WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
