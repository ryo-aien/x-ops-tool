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
        background: "var(--background)",
        foreground: "var(--foreground)",
        x: {
          bg:        "#000000",
          surface:   "#16181C",
          border:    "#2F3336",
          text:      "#E7E9EA",
          muted:     "#71767B",
          sub:       "#536471",
          blue:      "#1D9BF0",
          "blue-h":  "#1A8CD8",
          green:     "#00BA7C",
          red:       "#F4212E",
          yellow:    "#FFD400",
        },
      },
      borderColor: {
        DEFAULT: "#2F3336",
      },
    },
  },
  plugins: [],
};
export default config;
