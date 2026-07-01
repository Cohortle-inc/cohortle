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
        
        // Cohortle Brand Colours
        primary: {
          DEFAULT: "var(--primary)",      // #391D65 - Deep Purple
          light: "var(--primary-light)",  // #ECDCFF - Light Purple
          hover: "var(--primary-hover)",  // #2d1750 - Darker Purple
        },
        
        secondary: "var(--secondary)",

        "primary-accent": "var(--primary-accent)",
        "foreground-accent": "var(--foreground-accent)",
        "hero-background": "var(--hero-background)",
      },
    },
  },
  plugins: [],
};
export default config;
