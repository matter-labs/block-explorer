import { hexArrayTransformer } from "./hexArray.transformer";

describe("hexArrayTransformer", () => {
  describe("to", () => {
    it("returns null for null input", () => {
      const result = hexArrayTransformer.to(null);
      expect(result).toBeNull();
    });

    it("returns bytes buffers for the hex values with no leading 0x", () => {
      const strValues = [
        "c94722ff13eacf53547c4741dab5228353a05938ffcdd5d4a2d533ae0e618287",
        "010000553109a66f1432eb2286c54694784d1b6993bc24a168be0a49b4d0fd45",
      ];
      const result = hexArrayTransformer.to(strValues);
      expect(result).toStrictEqual([Buffer.from(strValues[0], "hex"), Buffer.from(strValues[1], "hex")]);
    });

    it("returns bytes buffers for the hex values with leading 0x", () => {
      const strValues = [
        "0xc94722ff13eacf53547c4741dab5228353a05938ffcdd5d4a2d533ae0e618287",
        "0x010000553109a66f1432eb2286c54694784d1b6993bc24a168be0a49b4d0fd45",
      ];
      const result = hexArrayTransformer.to(strValues);
      expect(result.length).toBe(2);
      expect(result[0]).toStrictEqual(
        Buffer.from("c94722ff13eacf53547c4741dab5228353a05938ffcdd5d4a2d533ae0e618287", "hex")
      );
      expect(result[1]).toStrictEqual(
        Buffer.from("010000553109a66f1432eb2286c54694784d1b6993bc24a168be0a49b4d0fd45", "hex")
      );
    });
  });

  describe("from", () => {
    it("returns null for null input", () => {
      const result = hexArrayTransformer.from(null);
      expect(result).toBeNull();
    });

    it("returns string hex representations of the buffer array", () => {
      const bufferValues = [
        Buffer.from("c94722ff13eacf53547c4741dab5228353a05938ffcdd5d4a2d533ae0e618287", "hex"),
        Buffer.from("010000553109a66f1432eb2286c54694784d1b6993bc24a168be0a49b4d0fd45", "hex"),
      ];
      const result = hexArrayTransformer.from(bufferValues);
      expect(result).toStrictEqual([
        "0xc94722ff13eacf53547c4741dab5228353a05938ffcdd5d4a2d533ae0e618287",
        "0x010000553109a66f1432eb2286c54694784d1b6993bc24a168be0a49b4d0fd45",
      ]);
    });
  });
});
