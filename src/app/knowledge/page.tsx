import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Knowledge", description: "Elevator Industry Knowledge" };

export default async function KnowledgePage() {
  const articles = await prisma.knowledge.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <section className="bg-slate-800 py-12 text-center text-white">
        <h1 className="text-3xl font-bold md:text-4xl">Knowledge</h1>
        <p className="mt-2 text-slate-300">Elevator Industry Insights &amp; Guides</p>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((post) => (
            <Link key={post.id} href={`/knowledge/${post.id}`} className="group">
              <article className="h-full rounded-lg border p-5 transition-all hover:shadow-md hover:-translate-y-1">
                <p className="mb-2 text-xs text-slate-400">
                  {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <h2 className="mb-2 text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-slate-600">{post.title}</h2>
                <p className="text-xs text-slate-500 line-clamp-3">{post.summary || post.content?.slice(0, 200)}</p>
              </article>
            </Link>
          ))}
        </div>
        {articles.length === 0 && (
          <p className="py-20 text-center text-sm text-slate-400">No articles yet.</p>
        )}
      </section>
    </div>
  );
}
