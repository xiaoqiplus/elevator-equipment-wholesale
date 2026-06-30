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
              Professional elevator parts supplier. Quick Delivery. Easy Service. Zero Downtime.
            </p>
            <div className="flex gap-3">
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-xs">FB</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-xs">IN</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-xs">YT</a>
            </div>
          </div>

          {/* Product Categories */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Product Categories</h3>
            <div className="flex flex-col space-y-2 text-sm">
              <Link href="/products" className="text-slate-400 hover:text-white transition-colors">Elevator Door Parts</Link>
              <Link href="/products" className="text-slate-400 hover:text-white transition-colors">Elevator PCB Board</Link>
              <Link href="/products" className="text-slate-400 hover:text-white transition-colors">Elevator Inverter</Link>
              <Link href="/products" className="text-slate-400 hover:text-white transition-colors">Elevator Service Tool</Link>
              <Link href="/products" className="text-slate-400 hover:text-white transition-colors">Elevator Safety Parts</Link>
              <Link href="/products" className="text-slate-400 hover:text-white transition-colors">Escalator Parts</Link>
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
              <p>📞 +86 138-xxxx-xxxx</p>
              <p>💬 WhatsApp: +86 138-xxxx-xxxx</p>
              <p>📍 XX Province, China</p>
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
