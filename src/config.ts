export const SITE_NAME = 'Crapintosh';
export const SITE_URL = 'https://crapintosh.co.uk';

// Formspree form that receives "express interest" submissions. The form ID is
// public (it appears in the page HTML), so it's safe to keep in source control.
// Override with PUBLIC_INTEREST_ENDPOINT in .env, e.g. to point at a test form.
export const INTEREST_ENDPOINT =
  import.meta.env.PUBLIC_INTEREST_ENDPOINT || 'https://formspree.io/f/mvkzdkgv';
