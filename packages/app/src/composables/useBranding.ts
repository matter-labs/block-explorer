import { useFavicon } from "@vueuse/core";

import useRuntimeConfig from "@/composables/useRuntimeConfig";

function updateMetaTag(selector: string, attribute: string, value: string): void {
  const element = document.querySelector(selector);
  if (element) {
    element.setAttribute(attribute, value);
  }
}

export default () => {
  const { brandName, branding } = useRuntimeConfig();

  const applyBranding = () => {
    const title = `${brandName} Block Explorer`;
    const description = `${brandName} Block Explorer provides all the information to deep dive into transactions, blocks, contracts, and much more. Deep dive into ${brandName} and explore the network.`;

    document.title = title;

    updateMetaTag('meta[name="description"]', "content", description);
    updateMetaTag('meta[property="og:title"]', "content", title);
    updateMetaTag('meta[property="og:description"]', "content", description);
    updateMetaTag('meta[property="og:image"]', "content", branding.ogImageUrl);
    updateMetaTag('meta[property="og:image:alt"]', "content", title);

    updateMetaTag('link[rel="alternate icon"]', "href", branding.faviconUrl);

    useFavicon(branding.altFaviconUrl);
  };

  return {
    applyBranding,
    brandName,
    branding,
  };
};
