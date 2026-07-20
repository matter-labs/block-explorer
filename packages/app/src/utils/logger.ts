/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */

import { BrowserTracing } from "@sentry/tracing";
import * as Sentry from "@sentry/vue";

import type { Vue } from "@sentry/vue/types/types";
import type { Router } from "vue-router";

let sentryReady = false;

export function useSentry(
  app: Vue | Vue[],
  applicationId: string,
  appEnvironment: string,
  version: string,
  router: Router
) {
  if (applicationId?.length && process.env.NODE_ENV === "production") {
    Sentry.init({
      app,
      dsn: applicationId,
      integrations: [
        new BrowserTracing({
          routingInstrumentation: Sentry.vueRouterInstrumentation(router),
          tracePropagationTargets: [version],
        }),
      ],
      environment: appEnvironment,
      release: version,
      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 1.0,
      // Ignore reporting network errors as they are often caused by network issues
      ignoreErrors: [/Failed to fetch/, /NetworkError/],
    });
    sentryReady = true;
  }
}

export default {
  log(...data: any[]): void {
    console.log(...data);
  },

  error(e: any, ...data: any[]): void {
    if (sentryReady) {
      Sentry.captureException(e);
    }

    if (process.env.NODE_ENV !== "test") {
      console.error(e, ...data);
    }
  },

  warn(message: string, ...data: any[]): void {
    if (sentryReady) {
      Sentry.captureMessage(message);
    }

    if (process.env.NODE_ENV !== "test") {
      console.warn(message, ...data);
    }
  },
};
