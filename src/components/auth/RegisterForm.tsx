"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";

interface RegisterFormProps {
  onSubmit?: (data: {
    email: string;
    password: string;
    name: string;
    companyName: string;
  }) => void;
  error?: string;
  isLoading?: boolean;
  isSuccess?: boolean;
}

export default function RegisterForm({
  onSubmit,
  error: externalError,
  isLoading: externalLoading,
  isSuccess = false,
}: RegisterFormProps) {
  let router: any = undefined;
  try {
    router = useRouter();
  } catch {}
  const isRouterAvailable = !!router;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [internalError, setInternalError] = useState<string | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalSuccess, setInternalSuccess] = useState(false);

  const isLoading = externalLoading ?? internalLoading;
  const displayError = externalError ?? internalError;
  const showSuccess = isSuccess || internalSuccess;

  if (showSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h2 className="mb-2 text-xl font-bold">注册成功</h2>
          <p className="mb-4 text-muted-foreground">
            请等待管理员审批您的账户。
          </p>
          <Button onClick={() => isRouterAvailable && router.push("/login")}>
            前往登录
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalError(null);

    // Validation — collect all errors
    const errors: string[] = [];
    if (!email.trim()) errors.push("请输入邮箱");
    if (!password) errors.push("请输入密码");
    if (!name.trim()) errors.push("请输入姓名");

    if (errors.length > 0) {
      setInternalError(errors.join("\n"));
      return;
    }

    if (onSubmit) {
      onSubmit({ email, password, name, companyName });
      return;
    }

    // Default: call register API
    setInternalLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, companyName }),
      });

      if (res.status === 409) {
        setInternalError("邮箱已被注册");
        return;
      }

      if (!res.ok) {
        throw new Error("注册失败");
      }

      setInternalSuccess(true);
    } catch (err) {
      setInternalError(
        err instanceof Error ? err.message : "注册失败"
      );
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl">注册</CardTitle>
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
            <label htmlFor="reg-email" className="text-sm font-medium">邮箱</label>
            <Input
              id="reg-email"
              type="email"
              placeholder="请输入邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="reg-password" className="text-sm font-medium">密码</label>
            <Input
              id="reg-password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="reg-name" className="text-sm font-medium">姓名</label>
            <Input
              id="reg-name"
              placeholder="请输入姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="reg-company" className="text-sm font-medium">公司名称</label>
            <Input
              id="reg-company"
              placeholder="请输入公司名称（可选）"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                注册中…
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                注册
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
