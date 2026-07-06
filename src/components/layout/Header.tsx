"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Phone, Mail, ChevronDown } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/knowledge", label: "Knowledge" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact Us" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      {/* Top bar */}
      <div className="hidden border-b bg-slate-800 md:block">
        <div className="container mx-auto flex h-9 items-center justify-between px-4">
          <div className="flex items-center gap-4 text-xs text-slate-300">
            <a href="mailto:info@quickeasyliftparts.com" className="flex items-center gap-1 hover:text-white transition-colors">
              <Mail className="h-3 w-3" /> info@quickeasyliftparts.com
            </a>
            <a href="tel:+8617791693312" className="flex items-center gap-1 hover:text-white transition-colors">
              <Phone className="h-3 w-3" /> +86 17791693312 / +86 13335386941
            </a>
          </div>
          <a href="https://wa.me/8617791693312" target="_blank" className="text-xs text-green-400 hover:text-green-300 transition-colors">
            💬 WhatsApp
          </a>
        </div>
      </div>

      {/* Main nav */}
      <div className="bg-slate-900 border-b border-slate-700">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo_transparent.png" alt="QuickEase Lift Parts" className="h-8 w-auto" />
            <span className="text-base font-bold tracking-tight text-white">QuickEase<br />Lift Parts</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                    active
                      ? "bg-white text-slate-900"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <form action="/search" method="GET" className="relative">
              <input
                type="text"
                name="q"
                placeholder="Search products..."
                className="h-8 w-44 rounded-md border border-slate-600 bg-slate-800 px-3 pr-8 text-xs text-slate-200 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </form>
            <Link href="/contact" className="rounded-md bg-white px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors">
              Request a Quote
            </Link>
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-700 bg-slate-900 md:hidden">
          <div className="flex flex-col px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-800"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link href="/contact" className="mt-2 rounded-md bg-white px-4 py-2 text-center text-sm font-medium text-slate-900" onClick={() => setMobileOpen(false)}>
              Request a Quote
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
