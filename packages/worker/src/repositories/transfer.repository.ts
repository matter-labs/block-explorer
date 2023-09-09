import { Injectable } from "@nestjs/common";
import { Transfer } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";
import { AddressTransferRepository } from "./addressTransfer.repository";

@Injectable()
export class TransferRepository extends BaseRepository<Transfer> {
  public constructor(unitOfWork: UnitOfWork, private readonly addressTransferRepository: AddressTransferRepository) {
    super(Transfer, unitOfWork);
  }

  public override async addMany(records: Partial<Transfer>[]): Promise<void> {
    await super.addMany(records);

    const addressTransfers = records.flatMap((record) => {
      const { number, ...addressTransfer } = record;
      const transferNumber = Number(number);

      if (addressTransfer.from === addressTransfer.to) {
        return { ...addressTransfer, address: record.from, transferNumber };
      }
      return [
        {
          ...addressTransfer,
          address: record.from,
          transferNumber,
        },
        {
          ...addressTransfer,
          address: record.to,
          transferNumber,
        },
      ];
    });

    return this.addressTransferRepository.addMany(addressTransfers);
  }
}
