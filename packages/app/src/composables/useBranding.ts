import { useTitle } from "@vueuse/core";

import useRouteTitle from "@/composables/useRouteTitle";
import useRuntimeConfig from "@/composables/useRuntimeConfig";

function updateMetaTag(selector: string, attribute: string, value: string): void {
  const element = document.querySelector(selector);
  if (element) {
    element.setAttribute(attribute, value);
  }
}

export default () => {
  const { title } = useRouteTitle();
  const { brandName, branding } = useRuntimeConfig();

  useTitle(title);

  const description = `${brandName} Block Explorer provides all the information to deep dive into transactions, blocks, contracts, and much more. Deep dive into ${brandName} and explore the network.`;

  updateMetaTag('meta[name="description"]', "content", description);
  if (title.value) {
    updateMetaTag('meta[property="og:title"]', "content", title.value);
    updateMetaTag('meta[property="og:image:alt"]', "content", title.value);
  }
  updateMetaTag('meta[property="og:description"]', "content", description);
  updateMetaTag('meta[property="og:image"]', "content", branding.ogImageUrl);

  updateMetaTag('link[rel="icon"][type="image/svg+xml"]', "href", branding.faviconUrl);
  updateMetaTag('link[rel="icon"][type="image/png"]', "href", branding.altFaviconUrl);
};
