// Single source of truth for company details.
// (The old site had conflicting addresses, delivery prices and company names — see README.)
export const site = {
  name: "De Baat Trading",
  legalName: "De Baat Handelsonderneming",
  owner: "Mitchell de Baat",
  phone: "06 - 18 89 31 30",
  phoneHref: "+31618893130",
  email: "info@debaattrading.nl",
  address: {
    street: "Tweede Tochtweg 143A",
    postcode: "2913 LR",
    city: "Nieuwerkerk aan den IJssel",
    country: "NL",
  },
  kvk: "58834753",
  iban: "NL60 INGB 0006 2692 14",
  facebook: "https://www.facebook.com/mitchell.debaat",
  vatRate: 0.21,
  deliveryPrice: 100, // excl. VAT, within the Netherlands
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://debaattrading.nl",
} as const;

export const fullAddress = `${site.address.street}, ${site.address.postcode} ${site.address.city}`;

export const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;
export const mapsLinkUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
