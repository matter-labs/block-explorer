import shadesOf from "tailwind-shades";
import tailwindColors from "tailwindcss/colors";

import type { ColorsConfig, ColorShades } from "@/configs";

const defaultColors: ColorsConfig = {
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
  secondary: tailwindColors.yellow,
  neutral: tailwindColors.gray,
  success: tailwindColors.green,
  error: tailwindColors.red,
  warning: tailwindColors.yellow,
};

export default function setColorScheme(colors: ColorsConfig = defaultColors) {
  const root = document.documentElement;

  for (const color of Object.keys(defaultColors) as Array<keyof typeof defaultColors>) {
    let shades = colors[color] || (defaultColors[color] as string | ColorShades);

    if (typeof shades === "string") {
      if (typeof tailwindColors[shades as keyof typeof tailwindColors] === "object") {
        shades = tailwindColors[shades as keyof typeof tailwindColors];
      } else {
        shades = shadesOf(shades) as ColorShades;
      }
    }

    const shadesObj = shades as Record<string, string>;
    for (const level of Object.keys(shadesObj)) {
      root.style.setProperty(`--color-${color}-${level}`, hexToRgb(shadesObj[level]));
    }
  }
}

function hexToRgb(hex: string) {
  // Remove the leading '#' if present
  hex = hex.replace(/^#/, "");

  // Handle short form (#FFF)
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `${r} ${g} ${b}`;
}
