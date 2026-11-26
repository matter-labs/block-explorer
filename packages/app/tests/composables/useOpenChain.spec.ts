import { beforeEach, describe, expect, it, type SpyInstance, vi } from "vitest";

import { $fetch } from "ohmyfetch";

import { fetchEventNames, fetchMethodNames } from "@/composables/useOpenChain";

vi.mock("ohmyfetch", () => ({
  $fetch: vi.fn(),
}));

const TRANSFER_OWNERSHIP_SIGHASH = "0xf2fde38b";
const TRANSFER_EVENT_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const mockLookupResponse = (result: Record<string, unknown>) =>
  ($fetch as unknown as SpyInstance).mockResolvedValueOnce({ ok: true, result });

describe("useOpenChain:", () => {
  beforeEach(() => {
    ($fetch as unknown as SpyInstance).mockReset();
  });

  describe("fetchMethodNames:", () => {
    it("picks the signature used by a verified contract over a colliding one listed after it", async () => {
      // actual response for transferOwnership(address)
      mockLookupResponse({
        function: {
          [TRANSFER_OWNERSHIP_SIGHASH]: [
            { name: "transferOwnership(address)", filtered: false, hasVerifiedContract: true },
            {
              name: "_SIMONdotBLACK_(int8[],uint256,address,bytes8,int96)",
              filtered: false,
              hasVerifiedContract: false,
            },
          ],
        },
      });
      const names = await fetchMethodNames([TRANSFER_OWNERSHIP_SIGHASH]);
      expect(names).toEqual({ [TRANSFER_OWNERSHIP_SIGHASH]: "transferOwnership(address)" });
    });

    it("picks the signature used by a verified contract when it is not listed first", async () => {
      mockLookupResponse({
        function: {
          [TRANSFER_OWNERSHIP_SIGHASH]: [
            {
              name: "_SIMONdotBLACK_(int8[],uint256,address,bytes8,int96)",
              filtered: false,
              hasVerifiedContract: false,
            },
            { name: "transferOwnership(address)", filtered: false, hasVerifiedContract: true },
          ],
        },
      });
      const names = await fetchMethodNames([TRANSFER_OWNERSHIP_SIGHASH]);
      expect(names).toEqual({ [TRANSFER_OWNERSHIP_SIGHASH]: "transferOwnership(address)" });
    });

    it("picks the first signature when none is used by a verified contract", async () => {
      mockLookupResponse({
        function: {
          "0x12345678": [
            { name: "first(uint256)", filtered: false },
            { name: "second(address)", filtered: false },
          ],
        },
      });
      const names = await fetchMethodNames(["0x12345678"]);
      expect(names).toEqual({ "0x12345678": "first(uint256)" });
    });

    it("skips filtered signatures", async () => {
      mockLookupResponse({
        function: {
          "0x12345678": [
            { name: "spam(uint256)", filtered: true, hasVerifiedContract: true },
            { name: "real(address)", filtered: false },
          ],
          "0x87654321": [{ name: "onlySpam(uint256)", filtered: true }],
        },
      });
      const names = await fetchMethodNames(["0x12345678", "0x87654321"]);
      expect(names).toEqual({ "0x12345678": "real(address)" });
    });

    it("skips names without a parameter list", async () => {
      mockLookupResponse({
        function: {
          "0x12345678": [
            { name: "invalid", filtered: false, hasVerifiedContract: true },
            { name: "valid(uint256)", filtered: false },
          ],
        },
      });
      const names = await fetchMethodNames(["0x12345678"]);
      expect(names).toEqual({ "0x12345678": "valid(uint256)" });
    });

    it("returns an empty object without requesting when there are no sighashes", async () => {
      const names = await fetchMethodNames([]);
      expect(names).toEqual({});
      expect($fetch).not.toHaveBeenCalled();
    });

    it("returns an empty object when the request fails", async () => {
      vi.spyOn(console, "error").mockImplementationOnce(() => undefined);
      ($fetch as unknown as SpyInstance).mockRejectedValueOnce(new Error("network error"));
      const names = await fetchMethodNames([TRANSFER_OWNERSHIP_SIGHASH]);
      expect(names).toEqual({});
    });
  });

  describe("fetchEventNames:", () => {
    it("picks the signature used by a verified contract", async () => {
      mockLookupResponse({
        event: {
          [TRANSFER_EVENT_TOPIC]: [
            { name: "Transfer(address,address,uint256)", filtered: false, hasVerifiedContract: true },
            { name: "Collision(bytes32)", filtered: false, hasVerifiedContract: false },
          ],
        },
      });
      const names = await fetchEventNames([TRANSFER_EVENT_TOPIC]);
      expect(names).toEqual({ [TRANSFER_EVENT_TOPIC]: "Transfer(address,address,uint256)" });
    });
  });
});
