import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminDict } from "@/lib/admin-lang";
import { getStore } from "@/lib/store";
import { ProductForm } from "@/components/admin/product-form";
import { AdminLangSwitch } from "@/components/admin/lang-switch";

export async function generateMetadata() {
  return { title: (await getAdminDict()).t.form.editMetaTitle };
}
export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const store = getStore();
  if (!store.writable) redirect("/admin");
  const { t } = await getAdminDict();
  const { id } = await params;
  const product = await store.getById(id);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-accent">
          <ArrowLeft className="size-4" /> {t.common.back}
        </Link>
        <AdminLangSwitch />
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">{product.title.nl}</h1>
        <Link href={`/nl/products/${product.slug}`} target="_blank" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-2 hover:text-accent">
          {t.common.viewOnSite} <ExternalLink className="size-4" />
        </Link>
      </div>
      <ProductForm product={product} nextArticle={product.article} />
    </div>
  );
}
