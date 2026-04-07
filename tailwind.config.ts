import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#F4F7F5',
          secondary: '#EEF2EF',
          dark: '#0B1F35',
          elevated: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#3A9E82',
          hover: '#2D8A6E',
          light: '#E8F5F1',
        },
        text: {
          primary: '#0B1F35',
          secondary: '#4A5568',
          muted: '#718096',
          inverse: '#F4F7F5',
        },
        border: {
          DEFAULT: '#D1D9D4',
          strong: '#A8B8B0',
        },
        success: '#3A9E82',
        danger: '#E53E3E',
        warning: '#D97706',
        team: {
          blue: '#378ADD',
          green: '#1D9E75',
          orange: '#D85A30',
          purple: '#7F77DD',
        },
      },
      fontFamily: {
        display: ['var(--font-sora)', 'var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'var(--font-geist-mono)', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};
export default config;
