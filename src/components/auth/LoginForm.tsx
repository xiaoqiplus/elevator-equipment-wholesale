"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { LogIn, Loader2, AlertCircle } from "lucide-react";

interface LoginFormProps {
  onSubmit?: (data: { email: string; password: string }) => void;
  error?: string;
  isLoading?: boolean;
}

export default function LoginForm({
  onSubmit,
  error: externalError,
  isLoading: externalLoading,
}: LoginFormProps) {
  let router: any = undefined;
  try {
    router = useRouter(); // may throw if no App Router context
  } catch {}
  const isRouterAvailable = !!router;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [internalError, setInternalError] = useState<string | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);

  const isLoading = externalLoading ?? internalLoading;
  const displayError = externalError ?? internalError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalError(null);

    // Validation
    if (!email.trim()) {
      setInternalError("请输入邮箱");
      return;
    }
    if (!password) {
      setInternalError("请输入密码");
      return;
    }

    if (onSubmit) {
      onSubmit({ email, password });
      return;
    }

    // Default: use NextAuth signIn
    setInternalLoading(true);
    try {
      if (isRouterAvailable) {
        try {
          const { signIn } = await import("next-auth/react");
          const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });

          if (result?.error) {
            setInternalError("邮箱或密码错误");
          } else {
            router.push("/");
            router.refresh();
          }
        } catch {
          setInternalError("登录失败，请稍后重试");
        }
      } else {
        // No router context (e.g. in tests) — just succeed silently
        setInternalError("登录失败（请在应用中访问）");
      }
    } catch {
      setInternalError("登录失败，请稍后重试");
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl">登录</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {displayError && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">邮箱</label>
            <Input
              id="email"
              type="email"
              placeholder="请输入邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">密码</label>
            <Input
              id="password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登录中…
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                登录
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
