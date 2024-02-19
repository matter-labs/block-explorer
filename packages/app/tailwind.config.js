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
          50: "#F3F5FF",
          100: "#D9D9F9",
          200: "#CBCBFF",
          300: "#8C8DFC",
          400: "#5D65B9",
          500: "#53579f",
          600: "#4E529A",
          700: "#32325D",
          800: "#27274E",
          900: "#11142B",
        },

        secondary: colors.yellow,
        neutral: colors.gray,

        success: colors.green,
        error: colors.red,
        warning: colors.yellow,
        design:{
          50: "#F3F5FF",
          100: "#D9D9F9",
          200: "#5089DD",
          300: "#8C8DFC",
          400: "#5D65B9",
          500: "#53579f",
          600: "#3C67E9",
          700: "#32325D",
          800: "#27274E",
          900: "#11142B",

        }
      
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
