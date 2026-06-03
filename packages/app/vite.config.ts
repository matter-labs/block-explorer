import { defineConfig } from "vite";

import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "url";

// Base public path the app is served from.
// - VITE_BASE_PATH: explicit base path (e.g. "/explorer/") baked in at build time.
// - Docker builds (DOCKER_BUILD=true) use a relative base so the same image can be
//   served from any subpath, configured at container start via the BASE_PATH env var
//   (injected as a <base> tag in index.html, see Dockerfile and index.html).
// - Local dev/builds keep the default root base.
function resolveBase(): string {
  if (process.env.VITE_BASE_PATH) {
    const trimmed = process.env.VITE_BASE_PATH.replace(/^\/+|\/+$/g, "");
    return trimmed ? `/${trimmed}/` : "/";
  }
  return process.env.DOCKER_BUILD === "true" ? "./" : "/";
}

// Keep the <base> tag in index.html (filled from BASE_PATH by the html-transform
// plugin below) in sync with the build-time base for non-Docker dev/builds.
if (!process.env.BASE_PATH && process.env.VITE_BASE_PATH) {
  process.env.BASE_PATH = resolveBase();
}

// https://vitejs.dev/config/
export default defineConfig({
  base: resolveBase(),
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
        if (process.env.DOCKER_BUILD === "true") {
          return html;
        }
        return replaceEnvVariables(html);
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
});

function replaceEnvVariables(template: string): string {
  // Regex matches either:
  // {{ getenv "VAR" | default "fallback" }}  OR  {{ getenv "VAR" }}
  const regex = /\{\{\s*getenv\s*"([^"]+)"(?:\s*\|\s*default\s*"([^"]*)")?\s*\}\}/g;

  return template.replace(regex, (_, varName, fallback) => {
    // If env var exists, use it; else fallback if provided; else empty string
    return process.env[varName] ?? fallback ?? "";
  });
}
