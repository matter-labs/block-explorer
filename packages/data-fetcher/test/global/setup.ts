export default async () => {
  // Define BigInt toJSON method so it can be serialized with JSON.stringify
  // Otherwise, jest is unable to output some test entities in case of an error.
  BigInt.prototype.toJSON = function toJSON() {
    // return BigInt string representation
    return this.toString();
  };
};
