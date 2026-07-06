import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * Los colores se resuelven a variables CSS (definidas en globals.css) para
 * soportar tema claro/oscuro sin duplicar la config. Los valores concretos
 * provienen del Design System de marca (dorado / negro / crema).
 */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'var(--surface-base)',
          raised: 'var(--surface-raised)',
          sunken: 'var(--surface-sunken)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        content: {
          DEFAULT: 'var(--content)',
          secondary: 'var(--content-secondary)',
          muted: 'var(--content-muted)',
        },
        brand: {
          DEFAULT: 'var(--brand)',
          deep: 'var(--brand-deep)',
          tint: 'var(--brand-tint)',
          foreground: 'var(--on-brand)',
        },
        action: {
          DEFAULT: 'var(--action)',
          foreground: 'var(--on-action)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
        ring: 'var(--ring)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        script: ['var(--font-script)', 'cursive'],
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
      },
      boxShadow: {
        'elevation-1': '0 1px 2px rgba(27,26,24,0.04), 0 1px 3px rgba(27,26,24,0.06)',
        'elevation-2': '0 4px 12px rgba(27,26,24,0.06)',
        'elevation-3': '0 8px 24px rgba(27,26,24,0.08)',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
