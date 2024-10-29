import overrideBigIntToJson from "./overrideBigIntToJson";

describe("overrideBigIntToJson", () => {
  it("overrides BigInt toJson function", () => {
    overrideBigIntToJson();
    const jsonValue = BigInt("1500000000000000000000000000000000").toJSON();
    expect(jsonValue).toBe("1500000000000000000000000000000000");
  });
});
