import { z } from "zod";
import { site } from "./site";

export type Shipping = "pickup" | "delivery";
export type Payment = "transfer" | "cash";

export function computeTotals(prices: number[], shipping: Shipping) {
  const subtotal = prices.reduce((a, b) => a + b, 0);
  const shippingCost = shipping === "delivery" ? site.deliveryPrice : 0;
  const base = subtotal + shippingCost;
  const vat = Math.round(base * site.vatRate * 100) / 100;
  return { subtotal, shippingCost, vat, total: Math.round((base + vat) * 100) / 100 };
}

const text = (max = 200) => z.string().trim().max(max);
const required = (max = 200) => text(max).min(1);

export const orderSchema = z
  .object({
    items: z.array(z.string()).min(1).max(50),
    shipping: z.enum(["pickup", "delivery"]),
    payment: z.enum(["transfer", "cash"]),
    acceptTerms: z.literal(true),
    locale: z.enum(["nl", "en"]),
    website: z.string().max(0).optional(), // honeypot
    customer: z.object({
      company: text().optional(),
      name: required(),
      address: required(),
      postcode: required(20),
      city: required(),
      phone: required(30).regex(/^[+\d][\d\s().-]{5,}$/),
      email: required(254).email(),
      note: text(2000).optional(),
    }),
  })
  .refine((o) => !(o.payment === "cash" && o.shipping !== "pickup"), { path: ["payment"] });

export type OrderInput = z.infer<typeof orderSchema>;

export function makeOrderNumber(now = new Date()) {
  const d = now.toISOString().slice(2, 10).replace(/-/g, "");
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DB-${d}-${r}`;
}
