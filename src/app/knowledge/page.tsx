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
              <article className="h-full overflow-hidden rounded-lg border transition-all hover:shadow-md hover:-translate-y-1">
                <div className="aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
                  {post.images ? (
                    <img src={post.images.split(",")[0]} alt={post.title}
                      className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl text-slate-300">📋</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="mb-1 text-xs text-slate-400">
                    {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <h2 className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-slate-600">{post.title}</h2>
                </div>
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
