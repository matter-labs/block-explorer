import { $fetch } from "ohmyfetch";

interface OpenChainMethod {
  name: string;
  filtered: boolean;
}
interface OpenChainResponse {
  ok: boolean;
  result: {
    function: Record<string, OpenChainMethod[]>;
  };
}
export async function fetchMethodNames(sighashes: string[]): Promise<Record<string, string>> {
  try {
    const response = await $fetch<OpenChainResponse>("https://api.4byte.sourcify.dev/signature-database/v1/lookup", {
      method: "GET",
      params: {
        function: sighashes.join(","),
        filter: true,
      },
      headers: {
        accept: "application/json",
      },
    });
    const result = response?.result?.function ?? {};
    const methodNames: Record<string, string> = {};
    Object.entries(result).forEach(([sighash, methods]) => {
      // Ensure methods is an array of the expected shape
      if (Array.isArray(methods) && methods.length > 0) {
        const method = methods[0];
        if (typeof method === "object" && method.name) {
          // Store the full signature, not just the method name
          // e.g. "transfer(address,uint256)" instead of "transfer"
          methodNames[sighash] = method.name;
        }
      }
    });
    return methodNames;
  } catch (error) {
    console.error("Error fetching method names:", error);
    return {};
  }
}

interface OpenChainEventResponse {
  ok: boolean;
  result: {
    event: Record<string, OpenChainMethod[]>;
  };
}

export async function fetchEventNames(topicHashes: string[]): Promise<Record<string, string>> {
  try {
    const response = await $fetch<OpenChainEventResponse>(
      "https://api.4byte.sourcify.dev/signature-database/v1/lookup",
      {
        method: "GET",
        params: {
          event: topicHashes.join(","),
          filter: true,
        },
        headers: {
          accept: "application/json",
        },
      }
    );
    const result = response?.result?.event ?? {};
    const eventNames: Record<string, string> = {};
    Object.entries(result).forEach(([topicHash, events]) => {
      // Ensure events is an array of the expected shape
      if (Array.isArray(events) && events.length > 0) {
        const event = events[0];
        if (typeof event === "object" && event.name) {
          // Store the full signature, e.g. "Transfer(address,address,uint256)"
          eventNames[topicHash] = event.name;
        }
      }
    });
    return eventNames;
  } catch (error) {
    console.error("Error fetching event names:", error);
    return {};
  }
}
