/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Page & Backgrounds
        page: "var(--bg-page)",
        shell: "var(--bg-shell)",
        sidebar: "var(--bg-sidebar)",
        
        // Surfaces
        surface: {
          DEFAULT: "var(--bg-page)",
          card: "var(--surface-card)",
          deep: "var(--surface-deep)",
          input: "var(--surface-input)",
          hover: "var(--surface-hover)",
          light: "var(--surface-light)",
          dim: "#141414",
          bright: "#393838",
          container: {
            lowest: "#141414",
            low: "#19191C",
            DEFAULT: "#242426",
            high: "#393838",
            highest: "#48484B",
          }
        },

        // Text
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        "on-surface": "var(--text-primary)",
        "on-surface-variant": "var(--text-secondary)",
        "on-background": "var(--text-primary)",

        // Primary Action Orange
        primary: {
          DEFAULT: "var(--accent-primary)",
          hover: "var(--accent-primary-hover)",
          subtle: "var(--accent-primary-subtle)",
          border: "var(--accent-primary-border)",
          container: "var(--accent-primary)",
          "on-container": "#FAF9F7",
          fixed: "var(--accent-primary)",
        },

        // Semantic Accents
        success: {
          DEFAULT: "var(--status-success)",
          bg: "var(--status-success-bg)",
          border: "var(--status-success-border)",
        },
        warning: {
          DEFAULT: "var(--status-warning)",
          bg: "var(--status-warning-bg)",
          border: "var(--status-warning-border)",
        },
        info: {
          DEFAULT: "var(--status-info)",
          bg: "var(--status-info-bg)",
          border: "var(--status-info-border)",
        },
        danger: {
          DEFAULT: "var(--status-danger)",
          bg: "var(--status-danger-bg)",
          border: "var(--status-danger-border)",
        },
        error: "var(--status-danger)",

        // Soft Palette Tokens
        soft: {
          blue: "#38BDF8",
          pink: "#EF9BC2",
          lime: "#00FF88",
          yellow: "#FBBF24",
          peach: "#F1A38D",
          orange: "#00E676",
          green: "#00E676",
        },

        // Cyber Defense Tokens
        cyber: {
          bg: "#030706",
          card: "#06140c",
          surface: "#07170e",
          input: "#07170e",
          border: "rgba(0, 230, 118, 0.2)",
          emerald: "#00e676",
          neon: "#00ff88",
          glow: "rgba(0, 230, 118, 0.35)",
        },

        // Borders
        subtle: "var(--border-subtle)",
        outline: "rgba(255, 255, 255, 0.10)",
        "outline-variant": "rgba(255, 255, 255, 0.06)",
        
        // Brand & Control
        "btn-black": "#050505",
        tertiary: "var(--accent-primary)",
        "tertiary-container": "var(--accent-primary-subtle)",
        "on-tertiary-container": "var(--accent-primary)",
      },

      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },

      boxShadow: {
        card:   "0 8px 28px rgba(0, 0, 0, 0.18)",
        glass:  "0 20px 60px rgba(0, 0, 0, 0.35)",
        modal:  "0 28px 80px rgba(0, 0, 0, 0.42)",
        orange: "0 4px 14px rgba(242, 100, 12, 0.35)",
        "orange-lg": "0 6px 22px rgba(242, 100, 12, 0.42)",
        "glow-green": "0 0 12px rgba(25, 213, 138, 0.35)",
        "glow-orange": "0 0 12px rgba(242, 100, 12, 0.35)",
        "focus-orange": "0 0 0 3px rgba(242, 100, 12, 0.28)",
      },

      borderRadius: {
        card:  "16px",
        modal: "24px",
      },

      transitionDuration: {
        instant:  "80ms",
        fast:     "120ms",
        standard: "180ms",
        medium:   "240ms",
        slow:     "320ms",
        emphasis: "420ms",
      },

      transitionTimingFunction: {
        "out-smooth":  "cubic-bezier(0.22, 1, 0.36, 1)",
        "enter":       "cubic-bezier(0.22, 1, 0.36, 1)",
        "exit":        "cubic-bezier(0.4, 0, 1, 1)",
        "spring":      "cubic-bezier(0.34, 1.3, 0.64, 1)",
      },

      keyframes: {
        "page-enter": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97) translateY(6px)" },
          to:   { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "toast-enter": {
          from: { opacity: "0", transform: "translateX(100%) scale(0.96)" },
          to:   { opacity: "1", transform: "translateX(0) scale(1)" },
        },
        "drawer-open": {
          from: { opacity: "0", transform: "translateY(-6px) scale(0.98)" },
          to:   { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "badge-pop": {
          "0%":   { transform: "scale(1)" },
          "40%":  { transform: "scale(1.22)" },
          "100%": { transform: "scale(1)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":      { opacity: "0.5", transform: "scale(0.85)" },
        },
        "status-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(25, 213, 138, 0.40)" },
          "50%":      { boxShadow: "0 0 0 4px rgba(25, 213, 138, 0)" },
        },
        "scan-bar": {
          "0%":   { left: "-30%" },
          "100%": { left: "110%" },
        },
        "chip-appear": {
          from: { opacity: "0", transform: "scale(0.85) translateY(4px)" },
          to:   { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },

      animation: {
        "page-enter":    "page-enter 240ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-up":      "slide-up 180ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-in":      "scale-in 180ms cubic-bezier(0.34, 1.3, 0.64, 1) both",
        "fade-in":       "fade-in 180ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "toast-enter":   "toast-enter 180ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "drawer-open":   "drawer-open 180ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "badge-pop":     "badge-pop 200ms cubic-bezier(0.34, 1.3, 0.64, 1) both",
        "shimmer":       "shimmer 1.8s ease infinite",
        "pulse-dot":     "pulse-dot 2s ease-in-out infinite",
        "status-pulse":  "status-pulse 2s ease-in-out infinite",
        "chip-appear":   "chip-appear 120ms cubic-bezier(0.34, 1.3, 0.64, 1) both",
      },
    },
  },
  plugins: [],
}
