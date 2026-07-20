/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  extends: ["@matterlabs/eslint-config-vue"],
  env: {
    "vue/setup-compiler-macros": true,
  },
  globals: {
    BigInt: true,
  },
};
