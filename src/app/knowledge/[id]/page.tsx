import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.knowledge.findUnique({ where: { id: params.id } });
  return { title: post?.title || "Knowledge" };
}

export default async function KnowledgeDetailPage({ params }: Props) {
  const post = await prisma.knowledge.findUnique({ where: { id: params.id } });
  if (!post) notFound();

  return (
    <div>
      <section className="border-b bg-slate-50">
        <div className="container mx-auto flex h-10 items-center gap-2 px-4 text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-600">Home</Link>
          <span>/</span>
          <Link href="/knowledge" className="hover:text-slate-600">Knowledge</Link>
          <span>/</span>
          <span className="text-slate-600">{post.title.slice(0, 40)}</span>
        </div>
      </section>

      <article className="container mx-auto max-w-4xl px-4 py-12">
        <Link href="/knowledge" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-4 w-4" /> Back to Knowledge
        </Link>

        <h1 className="mb-4 text-2xl font-bold text-slate-800 md:text-3xl">{post.title}</h1>
        <p className="mb-8 text-sm text-slate-400">
          {new Date(post.createdAt).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric"
          })}
        </p>

        {post.images && (
          <div className="mb-8">
            {post.images.split(",").slice(0, 1).map((img, i) => (
              <img key={i} src={img} alt={post.title}
                className="w-full max-w-2xl rounded-lg border bg-slate-50 object-cover h-64" />
            ))}
          </div>
        )}

        <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
          {post.content}
        </div>

        <div className="mt-12 rounded-lg border bg-slate-50 p-6 text-center">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Need Help with Elevator Parts?</h3>
          <p className="mb-4 text-sm text-slate-500">Contact our team for expert assistance</p>
          <Button asChild>
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </article>
    </div>
  );
}
