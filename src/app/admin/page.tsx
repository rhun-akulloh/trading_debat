import Link from "next/link";
import { ExternalLink, LogOut, Plus } from "lucide-react";
import { logout } from "./actions";
import { getAdminEmail, requireAdmin } from "@/lib/auth";
import { getAdminDict } from "@/lib/admin-lang";
import { fmt } from "@/lib/i18n";
import { getStore, listAll } from "@/lib/store";
import { imageStorageReady } from "@/lib/images";
import { ForkliftMark } from "@/components/logo";
import { ProductList } from "@/components/admin/product-list";
import { AdminLangSwitch } from "@/components/admin/lang-switch";

export async function generateMetadata() {
  return { title: (await getAdminDict()).t.list.title };
}
export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdmin();
  const { t } = await getAdminDict();
  const adminEmail = await getAdminEmail();
  const store = getStore();
  // A broken database must not turn the whole admin into a blank "server error" — say what's wrong instead.
  // (Only a logged-in admin sees this, and the message never contains the connection string.)
  let products: Awaited<ReturnType<typeof listAll>> = [];
  let dbError = "";
  try {
    products = await listAll();
  } catch (e) {
    console.error("[admin] could not load products", e);
    dbError = (e instanceof Error ? e.message : String(e)).replace(/postgres(ql)?:\/\/\S+/gi, "[connection string]").slice(0, 240);
  }
  const photosReady = imageStorageReady();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ForkliftMark className="size-11" />
          <div>
            <h1 className="text-2xl font-extrabold">{t.list.title}</h1>
            <p className="text-sm text-muted">{dbError ? "" : fmt(t.list.total, { n: products.length })}</p>
            {adminEmail && <p className="text-xs text-muted">{fmt(t.common.signedInAs, { email: adminEmail })}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminLangSwitch />
          <Link href="/nl" target="_blank" className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold hover:border-accent">
            <ExternalLink className="size-4" /> {t.common.viewSite}
          </Link>
          <form action={logout}>
            <button className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold hover:border-red-500 hover:text-red-500">
              <LogOut className="size-4" /> {t.common.logout}
            </button>
          </form>
          {store.writable && !dbError && (
            <Link href="/admin/products/new" className="bg-accent-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-[#0b1f1d] shadow-md">
              <Plus className="size-4" /> {t.list.newProduct}
            </Link>
          )}
        </div>
      </header>

      {dbError && (
        <p role="alert" className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm font-medium">
          <b>{t.list.dbErrorTitle}</b> {t.list.dbErrorHelp} <code className="break-words">{dbError}</code>
        </p>
      )}
      {!store.writable && (
        <p role="alert" className="mb-6 rounded-2xl border border-accent/40 bg-accent/10 px-5 py-4 text-sm font-medium">
          <b>{t.list.noDbTitle}</b> {t.list.noDbText}
        </p>
      )}
      {store.writable && !photosReady && (
        <p role="alert" className="mb-6 rounded-2xl border border-accent/40 bg-accent/10 px-5 py-4 text-sm font-medium">
          <b>{t.list.noPhotosTitle}</b> {t.list.noPhotosText}
        </p>
      )}

      <ProductList products={products} writable={store.writable} />
    </div>
  );
}
