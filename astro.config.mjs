// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://crapintosh.co.uk',
  // Pages build to folder/index.html, so links use trailing slashes for static hosts.
  trailingSlash: 'always',
});
