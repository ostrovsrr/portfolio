// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://rodion-ostrovskii.com',
  // Emit projects.html rather than projects/index.html, so the URLs the
  // site has always had (/projects, /qa-platform.html) keep working.
  build: { format: 'file' },
});
