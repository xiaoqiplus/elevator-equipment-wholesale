"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User } from "lucide-react";

export default function Header() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 text-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <line x1="9" y1="6" x2="15" y2="6" />
            <line x1="12" y1="6" x2="12" y2="18" />
          </svg>
          <span className="text-xl font-bold tracking-tight">
            Elevator Equipment
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/products"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Products
          </Link>
          <Link
            href="/categories"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Categories
          </Link>
          <Link
            href="/brands"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Brands
          </Link>
          <Link
            href="/quotation"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Quotation Cart
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {isLoading ? (
            // Loading state — show placeholder
            <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
          ) : isAuthenticated ? (
            // Logged in
            <>
              <Link
                href="/account"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <User className="h-4 w-4" />
                {user?.name ?? user?.email}
              </Link>

              {(user as any)?.isApproved && (
                <Badge variant="secondary" className="text-xs">
                  已认证
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                退出
              </Button>
            </>
          ) : (
            // Not logged in
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">登录</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">注册</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
