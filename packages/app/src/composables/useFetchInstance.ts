import { $fetch } from "ohmyfetch";

import useContext from "./useContext";

import type { Context } from "./useContext";
import type { FetchOptions, FetchResponse } from "ohmyfetch";

type OnResponse = (args: { response: FetchResponse<unknown> }) => void | Promise<void>;

export class FetchInstance {
  public static $fetch = $fetch;

  public static api(context = useContext()) {
    return this.withCredentials(context, context.currentNetwork.value.apiUrl, ({ response }) => {
      // For prividium response of 401 when the context indicates that the server logged out
      // the user. To avoid complex state management, we force
      // refresh preserving the current url as redirect url after login
      if (context.currentNetwork.value.prividium && context.user.value.loggedIn && response.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    });
  }

  public static verificationApi(context = useContext()) {
    return this.withBaseUrl(context.currentNetwork.value.verificationApiUrl ?? "");
  }

  public static withCredentials(context: Context, baseUrl?: string, onResponse?: OnResponse) {
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
