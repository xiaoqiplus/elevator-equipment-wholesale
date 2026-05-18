import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-6xl font-bold text-muted-foreground">404</h1>
      <h2 className="mb-2 text-2xl font-semibold">页面未找到</h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        您访问的页面不存在或已被移除。请检查链接是否正确。
      </p>
      <Button asChild>
        <Link href="/">返回首页</Link>
      </Button>
    </div>
  );
}
