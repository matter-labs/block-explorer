const colors = require("tailwindcss/colors");
// const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./src/**/*.{html,js,ts,vue}"],
  theme: {
    container: false,
    extend: {
      boxShadow: {
        soft: "2px 4px 12px rgba(0, 0, 0, 0.04)",
      },
      colors: {
        black: "#131313",
        blue: "#0071e3",
        "blue-lightest": "#f5f5f7",
        gray: "#6e6e73",
        "gray-2": "#888",
        secondary: "#0071e3",
        "error-red": "#ff4f00",
        neutral: colors.gray,
        success: colors.green,
        error: colors.red,
        warning: colors.yellow,
      },
      fontFamily: {
        sans: [
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
        ],
      },
      fontSize: {
        "2xs": "0.5rem",
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
        ".text-nowrap": {
          textWrap: "nowrap",
        },
      });
    },
  ],
};
