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
        outline: "var(--outline)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        "on-secondary-fixed-variant": "var(--on-secondary-fixed-variant)",
        "on-tertiary-fixed-variant": "var(--on-tertiary-fixed-variant)",
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        "on-secondary-fixed": "var(--on-secondary-fixed)",
        "secondary-container": "var(--secondary-container)",
        "on-tertiary-fixed": "var(--on-tertiary-fixed)",
        "on-tertiary": "var(--on-tertiary)",
        "tertiary-fixed": "var(--tertiary-fixed)",
        "surface-container": "var(--surface-container)",
        "secondary-fixed": "var(--secondary-fixed)",
        "primary-fixed": "var(--primary-fixed)",
        "on-error-container": "var(--on-error-container)",
        "tertiary-fixed-dim": "var(--tertiary-fixed-dim)",
        "surface-container-low": "var(--surface-container-low)",
        "secondary-fixed-dim": "var(--secondary-fixed-dim)",
        "surface-tint": "var(--surface-tint)",
        "on-tertiary-container": "var(--on-tertiary-container)",
        "on-surface": "var(--on-surface)",
        "on-background": "var(--on-background)",
        "on-surface-variant": "var(--on-surface-variant)",
        "on-primary-fixed": "var(--on-primary-fixed)",
        "outline-variant": "var(--outline-variant)",
        "on-error": "var(--on-error)",
        "on-primary-fixed-variant": "var(--on-primary-fixed-variant)",
        "primary-container": "var(--primary-container)",
        "inverse-on-surface": "var(--inverse-on-surface)",
        "primary-fixed-dim": "var(--primary-fixed-dim)",
        "inverse-primary": "var(--inverse-primary)",
        "surface-variant": "var(--surface-variant)",
        "surface-container-highest": "var(--surface-container-highest)",
        "inverse-surface": "var(--inverse-surface)",
        surface: "var(--surface)",
        "error-container": "var(--error-container)",
        background: "var(--background)",
        "on-secondary-container": "var(--on-secondary-container)",
        "on-secondary": "var(--on-secondary)",
        "on-primary-container": "var(--on-primary-container)",
        "surface-dim": "var(--surface-dim)",
        "surface-bright": "var(--surface-bright)",
        "on-primary": "var(--on-primary)",
        "surface-container-lowest": "var(--surface-container-lowest)",
        "tertiary-container": "var(--tertiary-container)",
        tertiary: "var(--tertiary)",
        error: "var(--error)",
        "surface-container-high": "var(--surface-container-high)",
        
        // Shadcn mapped fallbacks to the new theme
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        foreground: "var(--foreground)",
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
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
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        "margin-desktop": "64px",
        "gutter-mobile": "16px",
        unit: "8px",
        "gutter-desktop": "32px",
        "margin-mobile": "20px",
        "container-max": "1440px"
      },
      fontFamily: {
        "body-lg": ["var(--font-sans)", "sans-serif"],
        "headline-md": ["var(--font-display)", "sans-serif"],
        "body-md": ["var(--font-sans)", "sans-serif"],
        "data-mono": ["var(--font-mono)", "monospace"],
        "label-caps": ["var(--font-sans)", "sans-serif"],
        "display-lg": ["var(--font-display)", "sans-serif"],
        "headline-lg": ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        "body-lg": ["20px", { lineHeight: "1.6", letterSpacing: "0em", fontWeight: "400" }],
        "headline-md": ["28px", { lineHeight: "1.3", letterSpacing: "0.01em", fontWeight: "400" }],
        "body-md": ["17px", { lineHeight: "1.6", letterSpacing: "0em", fontWeight: "400" }],
        "data-mono": ["15px", { lineHeight: "1.1", letterSpacing: "0.02em", fontWeight: "500" }],
        "label-caps": ["13px", { lineHeight: "1.1", letterSpacing: "0.18em", fontWeight: "600" }],
        "display-lg": ["54px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "400" }],
        "headline-lg": ["36px", { lineHeight: "1.2", letterSpacing: "0em", fontWeight: "400" }]
      }
    },
  },
  plugins: [],
} satisfies Config;

export default config;
