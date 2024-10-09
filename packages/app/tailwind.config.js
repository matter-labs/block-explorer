const colors = require("tailwindcss/colors");
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./src/**/*.{html,js,ts,vue}"],
  theme: {
    container: false,
    extend: {
      fontFamily: {
        sans: ["Roboto", ...defaultTheme.fontFamily.sans],
        mono: ["Roboto Mono", ...defaultTheme.fontFamily.mono],
      },
      colors: {
        primary: {
          50: "#FAFAFA",
          100: "#FAFAFA",
          200: "#E7E8E9",
          300: "#CFD1D4",
          400: "#B7BABE",
          500: "#9FA3A9",
          600: "#70747D",
          700: "#404652",
          800: "#1F2D45",
          900: "#19253A",
          1000: "#172135",
          1100: "#131D2E",
          1200: "#0D1420",
          1300: "#0A111C",
        },
        secondary: colors.yellow,
        neutral: colors.gray,

        success: colors.green,
        error: colors.red,
        warning: colors.yellow,
      },
      screens: {
        xs: "480px",
        "4xl": "1920px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    function ({ addComponents }) {
      addComponents({
        ".container": {
          maxWidth: "90%",
          marginLeft: "auto",
          marginRight: "auto",
          "@screen xl": {
            maxWidth: "1240px",
          },
        },
      });
    },
  ],
};
