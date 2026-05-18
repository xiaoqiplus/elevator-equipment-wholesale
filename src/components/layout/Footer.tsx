import Link from "next/link";
import { Phone, Mail, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Company Info */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Elevator Equipment</h3>
            <p className="text-sm text-muted-foreground">
              Your trusted partner for elevator and lift components since 2010.
              Specializing in high-quality elevator equipment wholesale.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/products" className="hover:text-foreground transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-foreground transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/brands" className="hover:text-foreground transition-colors">
                  Brands
                </Link>
              </li>
              <li>
                <Link href="/quotation" className="hover:text-foreground transition-colors">
                  Request a Quote
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Contact Us</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+44 7507 940266</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>sales@elevatorequipment.com</span>
              </li>
              <li>
                <Link
                  href="https://wa.me/447507940266"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat on WhatsApp</span>
                </Link>
              </li>
            </ul>

            {/* WhatsApp Floating Button */}
            <div className="mt-4">
              <Link
                href="https://wa.me/447507940266"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-green-600 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp Inquiry
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Elevator Equipment Wholesale. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
