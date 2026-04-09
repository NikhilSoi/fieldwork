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
        brand: {
          teal: '#3A9E82',
          navy: '#0B1F35',
          surface: '#111E2D',
          glass: 'rgba(255,255,255,0.05)',
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
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        'card': '0 4px 24px rgba(0,0,0,0.2)',
        'glow': '0 0 20px rgba(58,158,130,0.3)',
      },
      backdropBlur: {
        xs: '4px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-pip': 'pulsePip 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulsePip: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(58,158,130,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(58,158,130,0.6)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
