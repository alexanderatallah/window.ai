/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "media",
  content: ["./**/*.tsx"],
  plugins: [require("@tailwindcss/line-clamp")]
}
