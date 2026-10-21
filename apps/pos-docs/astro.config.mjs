import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import { sidebar } from './content-map.mjs';
import mermaidFigures from './scripts/remark-mermaid.mjs';

export default defineConfig({
  site: 'https://pos-platform-tau.vercel.app',
  base: '/guide',
  trailingSlash: 'always',
  output: 'static',
  outDir: '../../dist/apps/pos-docs/guide',
  publicDir: './static',
  build: { inlineStylesheets: 'never' },
  // Documentation has its own CSS pipeline; the workspace PostCSS config serves Angular.
  vite: { css: { postcss: { plugins: [] } }, build: { assetsInlineLimit: 0 } },
  markdown: { processor: unified({ remarkPlugins: [mermaidFigures] }) },
  integrations: [starlight({
    title: 'POS Platform',
    description: 'Arquitectura, implementación y evidencia técnica del POS corporativo multipaís.',
    locales: { root: { label: 'Español', lang: 'es' } },
    sidebar,
    customCss: ['./src/styles/custom.css'],
    components: { Footer: './src/components/DocsFooter.astro' },
    social: [{ icon: 'github', label: 'Repositorio POS Platform', href: 'https://github.com/floxcristian/pos-platform' }],
    tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
    expressiveCode: { themes: ['github-light', 'github-dark'] },
    pagination: false,
    credits: false,
    favicon: '/favicon.svg',
  })],
});
