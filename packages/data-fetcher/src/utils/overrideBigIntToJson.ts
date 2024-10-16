declare global {
  interface BigInt {
    toJSON(): number;
  }
}

export default function overrideBigIntToJson() {
  // override to customize JSON.stringify serialization for BigNumbers
  BigInt.prototype.toJSON = function toJSON() {
    // return BigNumber string representation
    return this.toString();
  };
}
