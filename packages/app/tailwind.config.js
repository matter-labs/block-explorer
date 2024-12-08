const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,vue}"],
  presets: [require("@treasure-dev/tailwind-config")],
  theme: {
    container: false,
    extend: {
      colors: {
        // success: {
        //   100: "#A0F0A0",
        //   200: "#4FC74F",
        //   300: "#5FBC17",
        //   400: "#245134",
        //   500: "#162A2B",
        //   600: "#162A2B",
        // },
        // warning: {
        //   100: "#FFD697",
        //   200: "#FABC5F",
        //   300: "#F0AA40",
        //   400: "#D68A18",
        //   500: "#594320",
        //   600: "#594320",
        // },
        glass: {
          ruby: "#DC262610",
          warning: "#D68A1810",
          success: "#4FC74F10",
          base: "#40465225",
          sapphire: "#337FAA10",
        },
        cream: "#FFFCF5",
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
