"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Phone, Mail, ChevronDown } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      {/* Top bar */}
      <div className="hidden border-b bg-slate-50 md:block">
        <div className="container mx-auto flex h-9 items-center justify-between px-4">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <a href="mailto:info@quickeasyliftparts.com" className="flex items-center gap-1 hover:text-slate-800">
              <Mail className="h-3 w-3" /> info@quickeasyliftparts.com
            </a>
            <a href="tel:+86138xxxxxxx" className="flex items-center gap-1 hover:text-slate-800">
              <Phone className="h-3 w-3" /> +86 138-xxxx-xxxx
            </a>
          </div>
          <a href="https://wa.me/86138xxxxxxx" target="_blank" className="text-xs text-green-600 hover:text-green-700">
            💬 WhatsApp
          </a>
        </div>
      </div>

      {/* Main nav */}
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="QuickEase Lift Parts" className="h-9 w-auto" />
          <span className="text-lg font-bold tracking-tight text-slate-800">QuickEase<br />Lift Parts</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/contact" className="rounded-md bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors">
            Request a Quote
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t bg-white md:hidden">
          <div className="flex flex-col px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-600 py-1" onClick={() => setMobileOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link href="/contact" className="mt-2 rounded-md bg-slate-800 px-4 py-2 text-center text-sm font-medium text-white" onClick={() => setMobileOpen(false)}>
              Request a Quote
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
