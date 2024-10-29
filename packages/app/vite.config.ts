import { defineConfig } from "vite";

import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "url";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3010,
  },
  build: {
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Handle only third-party dependencies
          if (id.includes("node_modules")) {
            if (id.includes("ethers") || id.includes("@ethersproject")) {
              return "vendor-ethers";
            }
            if (id.includes("bn.js") || id.includes("bignumber.js")) {
              return "vendor-bn";
            }
            if (id.includes("vue/dist/vue")) return "vendor-vue";
            if (id.includes("vue-") || id.includes("@vue")) return "vendor-vue-libs";
            if (id.includes("@sentry")) return "vendor-sentry";
            if (id.includes("@headlessui") || id.includes("@heroicons") || id.includes("@tailwind")) return "vendor-ui";
            if (id.includes("@ethersproject")) return "vendor-eth";
            if (id.includes("@matterlabs")) return "vendor-matterlabs";
            if (id.includes("zksync-web3")) return "vendor-zksync";
            return "vendor"; // all other packages
          }
        },
      },
    },
  },
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["./tests/**/**.spec.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
    },
  },
  define: {
    __VUE_I18N_FULL_INSTALL__: true,
    __VUE_I18N_LEGACY_API__: false,
    __INTLIFY_PROD_DEVTOOLS__: false,
  },
  optimizeDeps: {
    include: [
      "vue",
      "vue-router",
      "vue-i18n",
      "@vueuse/core",
      "ethers",
      "@ethersproject/bignumber",
      "@ethersproject/providers",
      "bn.js",
      "bignumber.js",
      "zksync-web3",
    ],
  },
});
