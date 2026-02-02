declare module "tailwind-shades" {
  const shadesOf: (baseColor: string) => Record<string, string>;
  export = shadesOf;
}
