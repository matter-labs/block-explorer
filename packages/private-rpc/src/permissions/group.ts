import { Address, Hex } from 'viem';

export class Group {
  members: Set<Address>;

  constructor(members: Address[]) {
    this.members = new Set(members);
  }

  isMember(caller: Address): boolean {
    return this.members.has(caller);
  }
}

export class MethodRule {
  read: Group[];
  write: Group[];

  constructor(read: Group[], write: Group[]) {
    this.read = read;
    this.write = write;
  }

  canRead(caller: Address): boolean {
    return this.read.some((g) => g.isMember(caller));
  }

  canWrite(caller: Address): boolean {
    return this.write.some((g) => g.isMember(caller));
  }
}

export class ContractRule {
  address: Address;
  methods: Record<Hex, MethodRule>;

  constructor(address: Address, methods: Record<Hex, MethodRule>) {
    this.address = address;
    this.methods = methods;
  }

  canRead(caller: Address, calldata: Hex): boolean {
    const selector = calldata.substring(0, 10) as Hex;
    return !!this.methods[selector]?.canRead(caller);
  }

  canWrite(caller: Address, calldata: Hex): boolean {
    const selector = calldata.substring(0, 10) as Hex;
    return !!this.methods[selector]?.canWrite(caller);
  }
}
