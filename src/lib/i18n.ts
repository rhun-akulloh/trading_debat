export const locales = ["nl", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "nl";

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/** Replace `{name}` placeholders in a dictionary string. */
export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
