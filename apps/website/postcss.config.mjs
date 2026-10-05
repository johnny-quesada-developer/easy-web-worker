// Not @tailwindcss/vite: it binds to the hoisted vite 5 while Astro 7 runs its own vite 8, and
// fails with `createIdResolver is not a function`.
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
