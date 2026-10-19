import "server-only";
import crypto from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "./env";

const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const MAX_ACCOUNTS = 5;

/**
 * Admin accounts come from numbered environment variables:
 *   ADMIN_EMAIL / ADMIN_PASSWORD_HASH           (admin 1)
 *   ADMIN_EMAIL_2 / ADMIN_PASSWORD_HASH_2       (admin 2) … up to _5
 * Removing a pair immediately locks that person out, even if they are still logged in.
 */
function accounts() {
  const list: { email: string; hash: string }[] = [];
  for (let i = 1; i <= MAX_ACCOUNTS; i++) {
    const suffix = i === 1 ? "" : `_${i}`;
    const email = env(`ADMIN_EMAIL${suffix}`);
    const hash = env(`ADMIN_PASSWORD_HASH${suffix}`);
    if (email && hash) list.push({ email: email.toLowerCase(), hash });
  }
  return list;
}

export const authConfigured = () => accounts().length > 0 && (env("AUTH_SECRET")?.length ?? 0) >= 32;

const secretKey = () => new TextEncoder().encode(env("AUTH_SECRET"));

const digest = (s: string) => crypto.createHash("sha256").update(s).digest();

/**
 * Stored format: `scrypt:<salt hex>:<hash hex>` — generate one with `npm run admin:hash`.
 * (Not `$`-separated: Next.js expands `$word` inside .env files and would corrupt the value.)
 */
export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = crypto.scryptSync(password, Buffer.from(salt, "hex"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

// Verified against when the e-mail is unknown, so a wrong e-mail costs the same time as a wrong password.
const DUMMY_HASH = `scrypt:${"00".repeat(16)}:${"00".repeat(64)}`;

/** Returns the matching admin's e-mail address, or null. */
export function checkCredentials(email: string, password: string): string | null {
  if (!authConfigured()) return null;
  const wanted = digest(email.trim().toLowerCase());
  const match = accounts().find((a) => crypto.timingSafeEqual(wanted, digest(a.email)));
  const passOk = verifyPassword(password, match?.hash ?? DUMMY_HASH);
  return match && passOk ? match.email : null;
}

export async function startSession(email: string) {
  const token = await new SignJWT({ role: "admin", email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** The e-mail of the logged-in admin, or null. The account must still exist in the configuration. */
export async function getAdminEmail(): Promise<string | null> {
  if (!authConfigured()) return null;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const email = typeof payload.email === "string" ? payload.email : null;
    return payload.role === "admin" && email && accounts().some((a) => a.email === email) ? email : null;
  } catch {
    return null;
  }
}

export async function isAdmin() {
  return (await getAdminEmail()) !== null;
}

/** Call at the top of every admin page AND every server action — actions are public endpoints. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
