declare global {
  interface BigInt {
    toJSON(): number;
  }
}

export default function overrideBigIntToJson() {
  // override to customize JSON.stringify serialization for BigInt
  BigInt.prototype.toJSON = function toJSON() {
    // return BigInt string representation
    return this.toString();
  };
}
