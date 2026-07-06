// @ts-check
import base from './base.mjs';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';

/**
 * Extensión de la config base para la app Next.js (`@faviola/web`).
 * Añade el plugin oficial de Next y los globals de navegador.
 */
export default [
  ...base,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
];
