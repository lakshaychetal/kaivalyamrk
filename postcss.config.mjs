/**
 * PostCSS configuration for the Kaivalyam Homestay Website.
 *
 * Tailwind CSS v4 is consumed through its dedicated PostCSS plugin
 * (`@tailwindcss/postcss`). The Tailwind entry point and the semantic-token
 * layer (CSS variables / `@theme`) are wired in `src/app/globals.css`.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
