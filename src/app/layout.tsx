import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Elevator Equipment Wholesale - Lift & Electrical Parts",
    template: "%s | Elevator Equipment Wholesale",
  },
  description:
    "Your One-Stop Shop for Lift & Electrical Parts. Browse and request quotes for elevator components online. Premium elevator equipment from leading manufacturers.",
  keywords: [
    "elevator equipment",
    "lift parts",
    "elevator components",
    "electrical parts wholesale",
    "elevator manufacturer",
    "lift spare parts",
    "Otis parts",
    "Siemens elevator",
  ],
  openGraph: {
    title: "Elevator Equipment Wholesale",
    description:
      "Your One-Stop Shop for Lift & Electrical Parts. Browse and request quotes for elevator components online.",
    type: "website",
    locale: "en_US",
    siteName: "Elevator Equipment Wholesale",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
