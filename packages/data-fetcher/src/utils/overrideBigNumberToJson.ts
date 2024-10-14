import { BigNumber } from "zksync-web3";

import { BigNumber as BN2 } from "ethers";

export default function overrideBigNumberToJson() {
  // override to customize JSON.stringify serialization for BigNumbers
  BigNumber.prototype.toJSON = function toJSON() {
    // return BigNumber string representation
    return this.toString();
  };
  BN2.prototype.toJSON = function toJSON() {
    // return BigNumber string representation
    return this.toString();
  };
}
