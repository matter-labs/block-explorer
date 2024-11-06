import { Address, Hex } from 'viem';

export class AccessRules {
  members: Set<Address>;

  constructor(members: Address[]) {
    this.members = new Set(members);
  }

  isMember(caller: Address): boolean {
    return this.members.has(caller);
  }
}

export class MethodRule {
  read: AccessRules[];
  write: AccessRules[];

  constructor(read: AccessRules[], write: AccessRules[]) {
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

export interface AccessRule {
  canDo(user: Address): boolean;
}

export class PublicRule implements AccessRule {
  canDo(_address: Address): boolean {
    return true;
  }
}

export class AccessDeniedRule implements AccessRule {
  canDo(_address: Address): boolean {
    return false;
  }
}

export class GroupRule implements AccessRule {
  members: Set<Address>;

  constructor(members: Address[]) {
    this.members = new Set(members);
  }

  canDo(address: Address): boolean {
    return this.members.has(address);
  }
}

export class Permission {
  key: string;
  rule: AccessRule;

  constructor(key: string, rule: AccessRule) {
    this.key = key;
    this.rule = rule;
  }

  static contractRead(
    addr: Address,
    method: Hex,
    rule: AccessRule,
  ): Permission {
    return new this(`read_contract:${addr}:${method}`, rule);
  }

  static contractWrite(
    addr: Address,
    method: Hex,
    rule: AccessRule,
  ): Permission {
    return new this(`write_contract:${addr}:${method}`, rule);
  }
}
