export const SITE_NAME = 'Crapintosh';
export const SITE_URL = 'https://crapintosh.co.uk';

// Formspree form that receives "express interest" submissions. The form ID is
// public (it appears in the page HTML), so it's safe to keep in source control.
// Override with PUBLIC_INTEREST_ENDPOINT in .env, e.g. to point at a test form.
export const INTEREST_ENDPOINT =
  import.meta.env.PUBLIC_INTEREST_ENDPOINT || 'https://formspree.io/f/mvkzdkgv';

// "I have an idea for a t-shirt" submissions. Shares the interest form by default
// (they arrive with the subject "T-shirt idea"); set PUBLIC_IDEAS_ENDPOINT to split them out.
export const IDEAS_ENDPOINT = import.meta.env.PUBLIC_IDEAS_ENDPOINT || INTEREST_ENDPOINT;
