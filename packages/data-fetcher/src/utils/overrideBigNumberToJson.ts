import { BigNumber } from "ethers";

export default function overrideBigNumberToJson() {
  // override to customize JSON.stringify serialization for BigNumbers
  BigNumber.prototype.toJSON = function toJSON() {
    // return BigNumber string representation
    return this.toString();
  };
}
