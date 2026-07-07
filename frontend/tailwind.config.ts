import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        base:     'var(--bg-base)',
        surface:  'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        overlay:  'var(--bg-overlay)',
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: "var(--accent-foreground)",
          hover: "var(--accent-hover)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        positive: 'var(--positive)',
        negative: 'var(--negative)',
        warning:  'var(--warning)',
        
        // Shadcn mapped fallbacks
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        foreground: "var(--foreground)",
        background: "var(--background)",
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderColor: {
        subtle:  'var(--border-subtle)',
        default: 'var(--border-default)',
        strong:  'var(--border-strong)',
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        "margin-desktop": "32px",
        "gutter-mobile": "16px",
        unit: "8px",
        "gutter-desktop": "24px",
        "margin-mobile": "20px",
        "container-max": "100%"
      },
      fontFamily: {
        serif:  ['var(--font-serif)', 'Georgia', 'serif'],
        sans:   ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono:   ['var(--font-mono)', 'Menlo', 'monospace'],
        // Backward compatibility mappings
        "body-lg": ["var(--font-sans)", "sans-serif"],
        "headline-md": ["var(--font-serif)", "serif"],
        "body-md": ["var(--font-sans)", "sans-serif"],
        "data-mono": ["var(--font-mono)", "monospace"],
        "label-caps": ["var(--font-sans)", "sans-serif"],
        "display-lg": ["var(--font-serif)", "serif"],
        "headline-lg": ["var(--font-serif)", "serif"],
      },
      animation: {
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
      boxShadow: {
        'inset-top': 'var(--shadow-inset-top)',
        'elev': 'var(--shadow-elev)',
      },
      transitionTimingFunction: {
        'expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0'  },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
