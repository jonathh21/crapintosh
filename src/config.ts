export const SITE_NAME = 'Crapintosh';
export const SITE_URL = 'https://crapintosh.co.uk';

// Where "express interest" submissions go. The site is fully static (Fastmail
// hosting can't run server code), so submissions POST to a third-party form
// service which emails your Fastmail inbox (e.g. Formspree, Web3Forms).
// If no endpoint is configured, the form falls back to opening a prefilled email.
export const INTEREST_ENDPOINT = import.meta.env.PUBLIC_INTEREST_ENDPOINT ?? '';
// Optional: some services (e.g. Web3Forms) need a public access key field.
export const INTEREST_ACCESS_KEY = import.meta.env.PUBLIC_INTEREST_ACCESS_KEY ?? '';
export const INTEREST_EMAIL = import.meta.env.PUBLIC_INTEREST_EMAIL ?? 'hello@crapintosh.co.uk';
