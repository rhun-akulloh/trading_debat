import Link from "next/link";
import { getAdminDict } from "@/lib/admin-lang";

export default async function AdminNotFound() {
  const { t } = await getAdminDict();
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-extrabold">{t.notFound.title}</h1>
      <p className="mt-3 text-muted">{t.notFound.text}</p>
      <Link href="/admin" className="bg-accent-gradient mt-8 inline-flex rounded-full px-7 py-3.5 font-bold text-[#0b1f1d]">
        {t.common.back}
      </Link>
    </div>
  );
}
