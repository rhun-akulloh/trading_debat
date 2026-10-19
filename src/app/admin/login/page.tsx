import { redirect } from "next/navigation";
import { authConfigured, isAdmin } from "@/lib/auth";
import { getAdminDict } from "@/lib/admin-lang";
import { ForkliftMark } from "@/components/logo";
import { LoginForm } from "@/components/admin/login-form";
import { AdminLangSwitch } from "@/components/admin/lang-switch";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  const { t } = await getAdminDict();
  const configured = authConfigured();

  return (
    <main className="bg-brand-gradient relative grid min-h-screen place-items-center overflow-hidden px-4">
      <div className="mesh">
        <i className="-top-24 -right-16 size-96 bg-accent/45" />
        <i className="-bottom-32 left-10 size-96 bg-brand-2/70" style={{ animationDelay: "-9s" }} />
      </div>
      <div className="bg-surface shadow-lift relative w-full max-w-md rounded-xl p-8 sm:p-10">
        <div className="absolute top-5 right-5">
          <AdminLangSwitch />
        </div>
        <div className="mb-6 flex items-center gap-3">
          <ForkliftMark className="size-12" />
          <div>
            <h1 className="text-2xl font-extrabold">{t.login.title}</h1>
            <p className="text-sm text-muted">De Baat Trading</p>
          </div>
        </div>
        {configured ? (
          <LoginForm />
        ) : (
          <p role="alert" className="rounded-xl bg-accent/10 px-4 py-3 text-sm font-medium">
            {t.login.notConfigured}
          </p>
        )}
      </div>
    </main>
  );
}
