import { $fetch } from "ohmyfetch";

import useContext from "./useContext";

import type { Context } from "./useContext";
import type { FetchOptions } from "ohmyfetch";

export class FetchInstance {
  public static $fetch = $fetch;

  public static api(context = useContext()) {
    return this.withCredentials(context, context.currentNetwork.value.apiUrl);
  }

  public static prividiumProxy(context = useContext()) {
    const prividiumProxyUrl = context.currentNetwork.value.prividiumProxyUrl;
    if (!prividiumProxyUrl) {
      throw new Error("Prividium proxy URL is not set");
    }
    return this.withBaseUrl(prividiumProxyUrl);
  }

  public static verificationApi(context = useContext()) {
    return this.withBaseUrl(context.currentNetwork.value.verificationApiUrl ?? "");
  }

  public static withCredentials(context: Context, baseUrl?: string) {
    const prividium = !!context.currentNetwork.value.prividium;
    if (prividium) {
      return baseUrl
        ? this.withBaseUrl(baseUrl).create({ credentials: "include" })
        : $fetch.create({ credentials: "include" });
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
