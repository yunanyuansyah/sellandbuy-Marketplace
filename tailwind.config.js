/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,ejs,js,vue,jsx,ts,tsx}"],
  theme: {
    fontFamily: {
      saira: ['"Saira Semi Condensed"', "sans-serif"],
    },
    extend: {
      width: {
        btn: "80px",
        "btn-lg": "120px",
        "btn-xl": "160px",
        "btn-pfl": "23px",
        "btn-pfl-lg": "30px",
      },

      height: {
        btn: "40px",
      },

      padding: {
        4: "0.75rem",
        5: "1rem",
      },
    },
  },
  plugins: [],
};
