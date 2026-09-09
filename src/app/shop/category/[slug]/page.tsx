import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShopListing, type ShopSearchParams } from "@/components/ShopListing";
import { getCategories, getCategoryBySlug } from "@/lib/catalog";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/shop/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description: category.description ?? undefined,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/shop/category/[slug]">) {
  const { slug } = await params;
  const search = (await searchParams) as ShopSearchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-faint">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/shop" className="transition-colors hover:text-clay">
              Shop
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-ink-soft">{category.name}</li>
        </ol>
      </nav>

      <header className="mb-8">
        <h1 className="font-display text-4xl text-ink sm:text-5xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-soft">
            {category.description}
          </p>
        )}
      </header>

      <ShopListing
        categorySlug={slug}
        searchParams={search}
        basePath={`/shop/category/${slug}`}
      />
    </div>
  );
}
