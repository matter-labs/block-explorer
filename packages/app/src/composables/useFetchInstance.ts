import { $fetch } from "ohmyfetch";

import useContext from "./useContext";
import { appUrl, currentAppPath } from "../utils/basePath";

import type { Context } from "./useContext";
import type { FetchOptions, FetchResponse } from "ohmyfetch";

type OnResponse = (args: { response: FetchResponse<unknown> }) => void | Promise<void>;

export class FetchInstance {
  public static $fetch = $fetch;

  public static api(context = useContext()) {
    return this.withCredentials(context, context.currentNetwork.value.apiUrl, ({ response }) => {
      if (response.status !== 401 || !context.currentNetwork.value.prividium || !context.user.value.loggedIn) {
        return;
      }

      // API invalidated the session
      context.user.value = { loggedIn: false };
      window.location.href = `${appUrl("login")}?redirect=${encodeURIComponent(currentAppPath())}`;
    });
  }

  public static verificationApi(context = useContext()) {
    return this.withBaseUrl(context.currentNetwork.value.verificationApiUrl ?? "");
  }

  private static withCredentials(context: Context, baseUrl?: string, onResponse?: OnResponse) {
    const prividium = !!context.currentNetwork.value.prividium;
    if (prividium) {
      return baseUrl
        ? this.withBaseUrl(baseUrl).create({ credentials: "include", onResponse })
        : $fetch.create({ credentials: "include", onResponse });
    }

    return baseUrl ? this.withBaseUrl(baseUrl) : $fetch;
  }

  public static withBaseUrl(baseUrl: string) {
    const fetchConfig: FetchOptions = {
      baseURL: baseUrl,
    };
    return $fetch.create(fetchConfig);
  }
}
