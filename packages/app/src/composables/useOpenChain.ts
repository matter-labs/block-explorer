import { $fetch } from "ohmyfetch";

interface OpenChainMethod {
  name: string;
  filtered: boolean;
}

interface OpenChainLookupResponse {
  ok: boolean;
  result: {
    function?: Record<string, OpenChainMethod[]>;
    event?: Record<string, OpenChainMethod[]>;
  };
}

// Parses the OpenChain API response to extract method/event names
function parseOpenChainResult(data: Record<string, OpenChainMethod[]> | undefined): Record<string, string> {
  const names: Record<string, string> = {};
  if (!data) return names;

  Object.entries(data).forEach(([hash, items]) => {
    if (Array.isArray(items)) {
      items.forEach((item) => {
        if (item?.name && item.name.includes("(")) {
          names[hash] = item.name;
        }
      });
    }
  });

  return names;
}

export async function fetchMethodNames(sighashes: string[]): Promise<Record<string, string>> {
  if (sighashes.length === 0) return {};

  try {
    const response = await $fetch<OpenChainLookupResponse>(
      "https://api.4byte.sourcify.dev/signature-database/v1/lookup",
      {
        method: "GET",
        params: { function: sighashes.join(","), filter: true },
        headers: { accept: "application/json" },
      }
    );
    // only care about functions here
    return parseOpenChainResult(response?.result?.function);
  } catch (error) {
    console.error("Error fetching method names:", error);
    return {};
  }
}

export async function fetchEventNames(topicHashes: string[]): Promise<Record<string, string>> {
  if (topicHashes.length === 0) return {};

  try {
    const response = await $fetch<OpenChainLookupResponse>(
      "https://api.4byte.sourcify.dev/signature-database/v1/lookup",
      {
        method: "GET",
        params: { event: topicHashes.join(","), filter: true },
        headers: { accept: "application/json" },
      }
    );
    // only care about events here
    return parseOpenChainResult(response?.result?.event);
  } catch (error) {
    console.error("Error fetching event names:", error);
    return {};
  }
}
