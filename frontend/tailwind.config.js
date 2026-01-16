// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        gold: "#9E8F91",
        halloween: "#FF7518",
      },
    },
  },
  safelist: [
    "text-gold",
    "bg-gold",
    "text-halloween",
    "bg-halloween",
  ],
  plugins: [
    require("tailwind-scrollbar"),
  ],
};
