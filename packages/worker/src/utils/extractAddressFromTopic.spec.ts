import { extractAddressFromTopic } from "./extractAddressFromTopic";

describe("extractAddressFromTopic", () => {
  it("extracts address from a valid padded topic", () => {
    const topic = "0x" + "0".repeat(24) + "f39fd6e51aad88f6f4ce6ab8827279cfffb92266";
    expect(extractAddressFromTopic(topic)).toBe("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
  });

  it("extracts address from a topic with all-zero padding", () => {
    const topic = "0x" + "0".repeat(24) + "0000000000000000000000000000000000000001";
    expect(extractAddressFromTopic(topic)).toBe("0x0000000000000000000000000000000000000001");
  });

  it("returns null when topic has non-zero padding bytes", () => {
    const topic = "0x" + "1" + "0".repeat(23) + "f39fd6e51aad88f6f4ce6ab8827279cfffb92266";
    expect(extractAddressFromTopic(topic)).toBeNull();
  });

  it("returns null when topic is shorter than 66 chars", () => {
    expect(extractAddressFromTopic("0x" + "0".repeat(20))).toBeNull();
  });

  it("returns null when topic is longer than 66 chars", () => {
    expect(extractAddressFromTopic("0x" + "0".repeat(65))).toBeNull();
  });

  it("returns null when topic is null", () => {
    expect(extractAddressFromTopic(null)).toBeNull();
  });

  it("returns null when topic is undefined", () => {
    expect(extractAddressFromTopic(undefined)).toBeNull();
  });

  it("returns null when topic is an empty string", () => {
    expect(extractAddressFromTopic("")).toBeNull();
  });
});
