// Usage:
//   npm run admin:hash -- "a long password"             → for admin 1  (ADMIN_PASSWORD_HASH)
//   npm run admin:hash -- "a long password" --slot 2    → for admin 2  (ADMIN_PASSWORD_HASH_2), up to 5
import crypto from "node:crypto";

const args = process.argv.slice(2);
const slotAt = args.findIndex((a) => a === "--slot" || a.startsWith("--slot="));
let slot = 1;
if (slotAt >= 0) {
  slot = Number(args[slotAt].includes("=") ? args[slotAt].split("=")[1] : args[slotAt + 1]);
  args.splice(slotAt, args[slotAt].includes("=") ? 1 : 2);
}
const password = args[0];
if (!password || password.length < 10 || !Number.isInteger(slot) || slot < 1 || slot > 5) {
  console.error('Usage: npm run admin:hash -- "a password of at least 10 characters" [--slot 1-5]');
  process.exit(1);
}
const suffix = slot === 1 ? "" : `_${slot}`;
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password, salt, 64);
console.log(`\nADMIN_EMAIL${suffix}=<this person's e-mail address>`);
console.log(`ADMIN_PASSWORD_HASH${suffix}=scrypt:${salt.toString("hex")}:${hash.toString("hex")}\n`);
if (slot === 1) {
  console.log("AUTH_SECRET (one for the whole site — only needed once, keep it private):");
  console.log(crypto.randomBytes(32).toString("hex") + "\n");
}
