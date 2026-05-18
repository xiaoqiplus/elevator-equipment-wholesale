"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-6xl font-bold text-destructive">500</h1>
      <h2 className="mb-2 text-2xl font-semibold">出错了</h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        服务器遇到了问题，请稍后重试。如果问题持续存在，请联系我们。
      </p>
      <div className="flex gap-4">
        <Button onClick={reset}>重试</Button>
        <Button variant="outline" asChild>
          <Link href="/">返回首页</Link>
        </Button>
      </div>
    </div>
  );
}
