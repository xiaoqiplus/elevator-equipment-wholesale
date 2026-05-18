"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const mod = await import("next-auth");
        const session =
          typeof mod.default === "function" ? (mod.default as any)() : null;
        if (session?.user?.email) {
          router.push("/");
        }
      } catch {
        // next-auth not configured
      }
    })();
  }, [router]);

  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <RegisterForm />

        <p className="text-center text-sm text-muted-foreground">
          已有账户？{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline underline-offset-2"
          >
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
