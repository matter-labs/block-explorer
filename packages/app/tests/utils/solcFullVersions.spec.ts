import { describe, expect, it, vi } from "vitest";

import { $fetch } from "ohmyfetch";

import { getSolcFullVersion, getSolcShortVersion } from "@/utils/solcFullVersions";

vi.mock("ohmyfetch", () => {
  return {
    $fetch: vi.fn(() => Promise.resolve()),
    FetchError: function error() {
      return;
    },
  };
});

describe("getSolcShortVersion", () => {
  it("returns short version for the full solc version", () => {
    expect(getSolcShortVersion("v0.8.14+commit.80d49f37")).toBe("0.8.14");
  });

  it("returns zkVM version unchanged", () => {
    expect(getSolcShortVersion("zkVM-0.8.29-1.0.1")).toBe("zkVM-0.8.29-1.0.1");
  });

  it("returns short version unchanged", () => {
    expect(getSolcShortVersion("0.8.14")).toBe("0.8.14");
  });
});

describe("getSolcFullVersion", () => {
  it("returns hardcoded solc versions without additional request to the API", async () => {
    expect(await getSolcFullVersion("0.4.10")).toBe("v0.4.10+commit.f0d539ae");
    expect(await getSolcFullVersion("0.8.29")).toBe("v0.8.29+commit.ab55807c");
    expect($fetch).toHaveBeenCalledTimes(0);
  });

  it("requests unknown solc version from the API", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mock = ($fetch as any).mockResolvedValueOnce({
      builds: [
        {
          version: "0.9.0",
          longVersion: "0.9.0+prerelease.abc123",
          prerelease: "123",
        },
        {
          version: "0.9.0",
          longVersion: "0.9.0+commit.abc123",
        },
      ],
    });
    expect(await getSolcFullVersion("0.9.0")).toBe("v0.9.0+commit.abc123");
    expect(await getSolcFullVersion("0.8.29")).toBe("v0.8.29+commit.ab55807c");
    expect(await getSolcFullVersion("0.9.0")).toBe("v0.9.0+commit.abc123");
    expect($fetch).toHaveBeenCalledTimes(1);
    mock.mockRestore();
  });

  it("returns version unchanged if the API call fails", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mock = ($fetch as any).mockRejectedValue(new Error("An error occurred"));
    expect(await getSolcFullVersion("0.9.1")).toBe("0.9.1");
    expect($fetch).toHaveBeenCalledTimes(1);
    mock.mockRestore();
  });
});
