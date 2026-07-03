import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://christianpasinrey.github.io',
  base: '/el-motivo/',
  integrations: [sitemap()],
});
