import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        inter: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      colors: {
        // Updated Kiya Lottery Color Palette (Indigo/Purple)
        "kiya-dark": "hsl(var(--kiya-dark))", // #1a133b
        "kiya-surface": "hsl(var(--kiya-surface))", // #241a47
        "kiya-text": "hsl(var(--kiya-text))", // #FFFFFF
        "kiya-text-secondary": "hsl(var(--kiya-text-secondary))", // #b3a6d6
        "kiya-primary": "hsl(var(--kiya-primary))", // #6c2bd7
        "kiya-primary-dark": "hsl(var(--kiya-primary-dark))", // #4b1a99
        "kiya-teal": "hsl(var(--kiya-teal))", // #a763ff
        "kiya-teal-light": "hsl(var(--kiya-teal-light))", // #d1b3ff
        "kiya-red": "hsl(var(--kiya-red))",
        "kiya-green": "hsl(var(--kiya-green))",
        "kiya-warning": "hsl(var(--kiya-warning))",

        // Maintain compatibility with existing components
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
      fontSize: {
        "page-title": ["1.75rem", { lineHeight: "2rem", fontWeight: "600" }],
        "section-heading": [
          "1.375rem",
          { lineHeight: "1.75rem", fontWeight: "600" },
        ],
        "card-title": ["1.25rem", { lineHeight: "1.5rem", fontWeight: "500" }],
        body: ["0.9375rem", { lineHeight: "1.375rem", fontWeight: "400" }],
        button: ["0.9375rem", { lineHeight: "1.375rem", fontWeight: "500" }],
        label: ["0.8125rem", { lineHeight: "1.125rem", fontWeight: "400" }],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "slide-up": {
          from: {
            transform: "translateY(100%)",
            opacity: "0",
          },
          to: {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
          },
          to: {
            opacity: "1",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
