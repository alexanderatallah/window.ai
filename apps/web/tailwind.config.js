module.exports = {
  presets: [require("@vercel/examples-ui/tailwind")],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@vercel/examples-ui/**/*.js"
  ],
  plugins: [require("windy-radix-palette")]
}
