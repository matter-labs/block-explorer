import { Address } from 'viem';

export class RpcService {
  private currentUser: Address;

  constructor(currentUser: Address) {
    this.currentUser = currentUser;
  }

  current_user() {
    return this.currentUser;
  }
}
