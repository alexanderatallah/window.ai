/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true,
  mode: "jit",
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {},
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/line-clamp"),
    require("@tailwindcss/container-queries"),
    require("tailwind-scrollbar"),
    require("daisyui"),
  ],
  daisyui: {
    prefix: "daisy-",
  },
};
