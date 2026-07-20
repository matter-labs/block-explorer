import { Injectable } from "@nestjs/common";
import { Transfer } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { BaseRepository } from "./base.repository";
import { AddressTransferRepository } from "./addressTransfer.repository";
import { computeFromToMinMax } from "../utils/computeFromToMinMax";

@Injectable()
export class TransferRepository extends BaseRepository<Transfer> {
  public constructor(unitOfWork: UnitOfWork, private readonly addressTransferRepository: AddressTransferRepository) {
    super(Transfer, unitOfWork);
  }

  public override async addMany(records: Partial<Transfer>[]): Promise<void> {
    const recordsToAdd = records.map((record) => ({ ...record, ...computeFromToMinMax(record.from, record.to) }));
    await super.addMany(recordsToAdd);

    const addressTransfers = recordsToAdd.flatMap((record) => {
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
