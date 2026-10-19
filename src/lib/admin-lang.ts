import "server-only";
import { cookies } from "next/headers";
import { ADMIN_LANG_COOKIE, adminDicts, isAdminLang, type AdminLang } from "./admin-i18n";

/** The admin language lives in a plain cookie (not sensitive) so server and client always agree. */
export async function getAdminLang(): Promise<AdminLang> {
  const v = (await cookies()).get(ADMIN_LANG_COOKIE)?.value;
  return isAdminLang(v) ? v : "nl";
}

export async function getAdminDict() {
  const lang = await getAdminLang();
  return { lang, t: adminDicts[lang] };
}
