import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/ComingSoon";
import { categories, getCategory } from "@/lib/placeholder-data";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/shop/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: "Category not found" };
  return { title: category.name, description: category.description };
}

export default async function CategoryPage({
  params,
}: PageProps<"/shop/category/[slug]">) {
  const { slug } = await params;
  const category = getCategory(slug);
  // Unknown slugs should 404 rather than render an empty shell.
  if (!category) notFound();

  return (
    <ComingSoon title={category.name} phase="Phase 1">
      <p>{category.description}</p>
      <p className="mt-3">
        Products in this category arrive with the catalogue.
      </p>
    </ComingSoon>
  );
}
