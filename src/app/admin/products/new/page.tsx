import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminDict } from "@/lib/admin-lang";
import { getStore, listAll } from "@/lib/store";
import { ProductForm } from "@/components/admin/product-form";
import { AdminLangSwitch } from "@/components/admin/lang-switch";

export async function generateMetadata() {
  return { title: (await getAdminDict()).t.form.newTitle };
}
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin();
  if (!getStore().writable) redirect("/admin");
  const { t } = await getAdminDict();
  const all = await listAll();
  const nextArticle = String(Math.max(999, ...all.map((p) => parseInt(p.article, 10) || 0)) + 1);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-accent">
          <ArrowLeft className="size-4" /> {t.common.back}
        </Link>
        <AdminLangSwitch />
      </div>
      <h1 className="mb-6 text-3xl font-extrabold">{t.form.newTitle}</h1>
      <ProductForm nextArticle={nextArticle} />
    </div>
  );
}
