import { Entity } from "typeorm";
import { Transaction } from "./transaction.entity";

@Entity({ name: "transactions" })
export class TransactionDetails extends Transaction {
  public get gasUsed(): string {
    return this.transactionReceipt ? this.transactionReceipt.gasUsed : null;
  }

  toJSON(): any {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { transactionReceipt, ...restFields } = super.toJSON();
    return {
      ...restFields,
      gasUsed: this.gasUsed,
    };
  }
}
