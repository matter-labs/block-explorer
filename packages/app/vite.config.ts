import { defineConfig } from "vite";

import vue from "@vitejs/plugin-vue";
import MagicString from "magic-string";
import { fileURLToPath, URL } from "url";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // Every build bakes the sentinel base, so the bundle is byte-identical for Docker and regular builds
  // (the runtime-asset-base plugin then turns it into a window.__ASSETS_BASE__ read). A single set of
  // chunk hashes means one Sentry sourcemap upload matches every deployment. The dev server serves its
  // own bundle (no CDN, no build-only plugin), so it just mounts at the app base path.
  base: command === "build" ? "/__ASSET_BASE__/" : process.env.APP_BASE || "/",
  server: {
    port: 3010,
  },
  build: {
    target: "esnext",
    sourcemap: "hidden",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("vue/dist/vue")) {
            return "v";
          }
          if (id.includes("vue-") || id.includes("@vue")) {
            return "vi";
          }
          if (id.includes("@sentry")) {
            return "s";
          }
          if (id.includes("@headlessui") || id.includes("@heroicons") || id.includes("@tailwind")) {
            return "t";
          }
          if (id.includes("@firebase")) {
            return "f";
          }
          if (id.includes("@matterlabs")) {
            return "m";
          }
          if (id.includes("/src/composables")) {
            return "cm";
          }
          if (id.includes("/src/components")) {
            return "cn";
          }
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
  plugins: [
    vue(),
    {
      name: "html-transform",
      transformIndexHtml(html) {
        // Docker: leave the sentinel + {{ }} templates for gomplate/sed to resolve at container start.
        if (process.env.DOCKER_BUILD === "true") {
          return html;
        }
        // Non-Docker: resolve the templates now and point the sentinel asset URLs at the
        // serving base — the CDN origin if STATIC_ASSETS_URL is set at build time, else the app base
        // The JS is untouched — it reads window.__ASSETS_BASE__.
        return replaceEnvVariables(html).replace(
          /\/__ASSET_BASE__\//g,
          (process.env.STATIC_ASSETS_URL || process.env.APP_BASE || "/").replace(/\/?$/, "/")
        );
      },
    },
    {
      // Every build bakes the asset base as the sentinel "/__ASSET_BASE__/". Rewrite the standalone
      // preload-base constant into a runtime read of window.__ASSETS_BASE__ (set by index.html), so the
      // served bundle resolves its lazy-chunk/CSS URLs at runtime and never has to be edited on disk —
      // which keeps the sourcemaps aligned and the bundle identical across Docker and regular builds. Done
      // with magic-string so the emitted .map tracks the edit. (Static image refs go through
      // resolveAsset(), so the sentinel only appears here as a standalone quoted token; image literals
      // like "/__ASSET_BASE__/images/x.svg" are intentionally not matched.)
      name: "runtime-asset-base",
      apply: "build",
      enforce: "post",
      renderChunk(code, chunk) {
        const s = new MagicString(code);
        // Narrow on purpose: only the standalone quoted token (the preload-base const), never a sentinel
        // embedded in a longer asset literal — those stay intact and are caught by the guard below.
        s.replaceAll(/(["'])\/__ASSET_BASE__\/\1/g, '(window.__ASSETS_BASE__||"/")');
        // A surviving sentinel means an asset got bundled as "/__ASSET_BASE__/assets/…" (e.g. an
        // `import x from "*.svg"`), which neither this plugin nor the runtime sed resolves — reference
        // such assets by path through resolveAsset() instead.
        if (s.toString().includes("/__ASSET_BASE__/")) {
          throw new Error(
            `Unresolved /__ASSET_BASE__/ left in ${chunk.fileName} — don't bundle asset imports; use resolveAsset() with a path.`
          );
        }
        if (!s.hasChanged()) {
          return null;
        }
        return { code: s.toString(), map: s.generateMap({ hires: true }) };
      },
    },
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    env: {
      TZ: "UTC-3",
    },
    setupFiles: ["./tests/setup.ts"],
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
}));

function replaceEnvVariables(template: string): string {
  // Resolves the gomplate-style placeholders used in index.html for the non-Docker (static) build.
  // (For Docker builds DOCKER_BUILD=true skips this and gomplate resolves them at container start.)
  // Supported forms:
  //   {{ getenv "VAR" }}
  //   {{ getenv "VAR" | default "fallback" }}
  //   {{ getenv "VAR" | default (print (getenv "APP_BASE" "/") "defaultValue") }}   (base-prefixed default)
  const regex =
    /\{\{\s*getenv\s*"([^"]+)"(?:\s*\|\s*default\s+(?:"([^"]*)"|\(\s*print\s+\(\s*getenv\s+"([^"]+)"\s+"([^"]*)"\s*\)\s+"([^"]*)"\s*\)))?\s*\}\}/g;

  return template.replace(regex, (_match, varName, quotedFallback, baseVar, baseDefault, defaultValue) => {
    let fallback = quotedFallback;
    if (fallback === undefined && baseVar !== undefined) {
      // default (print (getenv baseVar baseDefault) defaultValue)  ->  (APP_BASE || "/") + defaultValue
      fallback = (process.env[baseVar] ?? baseDefault ?? "") + (defaultValue ?? "");
    }
    // If env var exists, use it
    return process.env[varName] ?? fallback ?? "";
  });
}
