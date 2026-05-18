export const revalidate = 300;

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Search, ArrowRight, Package, Cable, Wrench, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const iconMap: Record<string, typeof Package> = {
  Package,
  Cable,
  Wrench,
  Gauge,
};

const defaultIcons = [Package, Cable, Wrench, Gauge];

export default async function Home() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-16 pt-20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 md:pb-24 md:pt-28">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="container relative mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Elevator Equipment
              <br />
              <span className="text-primary/80">Wholesale</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Your One-Stop Shop for Lift & Electrical Parts
            </p>
            <p className="mb-10 text-sm text-muted-foreground md:text-base">
              Premium elevator components from leading manufacturers. Next-day
              delivery available on thousands of parts.
            </p>

            <div className="mx-auto mb-8 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by product name or SKU..."
                  className="h-12 pl-10 text-base shadow-sm"
                />
                <Button className="absolute right-1 top-1/2 h-10 -translate-y-1/2">
                  Search
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/products">
                  Browse Products <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight">
              Our Product Categories
            </h2>
            <p className="text-muted-foreground">
              Explore our wide range of elevator and lift components
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => {
              const Icon = defaultIcons[index % defaultIcons.length];
              return (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group"
                >
                  <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <CardHeader>
                      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg">
                        {category.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Browse our {category.name.toLowerCase()} collection
                      </p>
                      <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Browse Category{" "}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features / Trust Signals */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">
                Next-Day Delivery
              </h3>
              <p className="text-sm text-muted-foreground">
                Fast shipping on thousands of in-stock elevator parts
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">
                Genuine Parts
              </h3>
              <p className="text-sm text-muted-foreground">
                Sourced directly from leading manufacturers
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">
                Expert Support
              </h3>
              <p className="text-sm text-muted-foreground">
                Experienced team to help identify the right components
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
