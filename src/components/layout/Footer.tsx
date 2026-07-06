import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">QuickEase Lift Parts</h3>
            <p className="mb-4 text-sm leading-relaxed">
              XI'AN QUICKEASE LIFT PARTS CO., Ltd - Professional elevator parts supplier
            </p>
            <div className="flex gap-3">
              <Link href="https://facebook.com" target="_blank" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">f</Link>
              <Link href="https://linkedin.com" target="_blank" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">in</Link>
              <Link href="https://youtube.com" target="_blank" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">▶</Link>
            </div>
          </div>

          {/* Product Categories */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Product Categories</h3>
            <div className="flex flex-col space-y-2 text-sm">
              <Link href="/categories/elevator-door-parts" className="text-slate-400 hover:text-white transition-colors">Elevator Door Parts</Link>
              <Link href="/categories/elevator-pcb" className="text-slate-400 hover:text-white transition-colors">Elevator PCB Board</Link>
              <Link href="/categories/elevator-inverter" className="text-slate-400 hover:text-white transition-colors">Elevator Inverter</Link>
              <Link href="/categories/elevator-service-tool" className="text-slate-400 hover:text-white transition-colors">Elevator Service Tool</Link>
              <Link href="/categories/elevator-safety-parts" className="text-slate-400 hover:text-white transition-colors">Elevator Safety Parts</Link>
              <Link href="/categories/escalator-parts" className="text-slate-400 hover:text-white transition-colors">Escalator Parts</Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Quick Links</h3>
            <div className="flex flex-col space-y-2 text-sm">
              <Link href="/" className="text-slate-400 hover:text-white transition-colors">Home</Link>
              <Link href="/about" className="text-slate-400 hover:text-white transition-colors">About Us</Link>
              <Link href="/products" className="text-slate-400 hover:text-white transition-colors">Products</Link>
              <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">Contact Us</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Contact Us</h3>
            <div className="space-y-3 text-sm text-slate-400">
              <p>📧 info@quickeasyliftparts.com</p>
              <p>📞 +86 17791693312 / +86 13335386941</p>
              <p>💬 WhatsApp: +86 17791693312 / +86 13335386941</p>
              <p>📍 Shaanxi, China</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} QuickEase Lift Parts. All Rights Reserved.
      </div>
    </footer>
  );
}
