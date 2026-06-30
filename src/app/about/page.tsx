import type { Metadata } from "next";

export const metadata: Metadata = { title: "About Us", description: "About QuickEase Lift Parts" };

export default function AboutPage() {
  return (
    <div>
      {/* Banner */}
      <section className="bg-slate-800 py-16 text-center text-white">
        <h1 className="text-3xl font-bold md:text-4xl">About Us</h1>
        <p className="mt-2 text-slate-300">QuickEase Lift Parts — Your Trusted Elevator Parts Partner</p>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-2xl font-bold text-slate-800">QuickEase Lift Parts</h2>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>
              QuickEase Lift Parts is a professional elevator parts supplier dedicated to providing high-quality components
              for elevator maintenance companies, installation contractors, and elevator manufacturers worldwide.
            </p>
            <p>
              <strong>Quick Delivery. Easy Service. Zero Downtime.</strong> — These three principles drive everything we do.
              We maintain extensive inventory of elevator parts across all major systems: door systems, control systems,
              traction systems, cables, safety components, and more.
            </p>
            <p>
              Our product range covers all major elevator brands including Otis, Kone, Schindler, Mitsubishi, ThyssenKrupp,
              Hitachi, Fujitec, and many more. We work directly with certified manufacturers to ensure every part meets
              or exceeds OEM specifications.
            </p>
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center text-2xl font-bold text-slate-800">Why Us</h2>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {[
              { title: "Extensive Inventory", desc: "Thousands of elevator parts in stock, ready to ship." },
              { title: "Brand Coverage", desc: "Compatible with Otis, Kone, Schindler, Mitsubishi, ThyssenKrupp and more." },
              { title: "Quality Assurance", desc: "All parts sourced from ISO-certified manufacturers." },
              { title: "Fast Shipping", desc: "Most orders processed and shipped within 24 hours." },
              { title: "Technical Support", desc: "Experienced team to help you find the right parts." },
              { title: "Competitive Pricing", desc: "Factory-direct pricing with volume discounts available." },
            ].map((item, i) => (
              <div key={i} className="rounded-lg border bg-white p-5">
                <h3 className="mb-1 font-semibold text-slate-800">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
