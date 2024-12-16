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
    const response = await $fetch<OpenChainResponse>("https://api.openchain.xyz/signature-database/v1/lookup", {
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
      if (Array.isArray(methods)) {
        methods.forEach((method) => {
          if (typeof method === "object" && method.name && method.name.split("(").length > 1) {
            methodNames[sighash] = method.name.split("(")[0];
          }
        });
      }
    });
    return methodNames;
  } catch (error) {
    console.error("Error fetching method names:", error);
    return {};
  }
}
