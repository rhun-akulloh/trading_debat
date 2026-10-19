/**
 * Reads an environment variable and forgives the usual copy-paste mistakes:
 * surrounding quotes (`KEY='value'` copied from a .env file), leading/trailing spaces or newlines.
 * Returns undefined for missing or empty values.
 */
export function env(name: string): string | undefined {
  let v = process.env[name]?.trim();
  if (!v) return undefined;
  const quoted = v.match(/^(['"])([\s\S]*)\1$/);
  if (quoted) v = quoted[2].trim();
  return v || undefined;
}

/** A Postgres URL, also tolerating a pasted `psql '…'` command from the Neon dashboard. */
export function databaseUrl(): string | undefined {
  const v = env("DATABASE_URL");
  if (!v) return undefined;
  const psql = v.match(/^psql\s+(['"]?)([\s\S]*?)\1$/);
  return (psql ? psql[2] : v).trim();
}
