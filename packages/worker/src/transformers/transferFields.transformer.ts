import { ValueTransformer } from "typeorm";
import { TransferFields } from "../transfer/interfaces/transfer.interface";
import { bigNumberTransformer } from "./bigNumber.transformer";

export const transferFieldsTransformer: ValueTransformer = {
  to(fields: TransferFields | null): Record<string, any> | null {
    if (!fields || !fields.tokenId) {
      return fields;
    }

    fields.tokenId = bigNumberTransformer.to(fields.tokenId);
    return fields;
  },
  from(fields: Record<string, any> | null): TransferFields | null {
    if (!fields || !fields.tokenId) {
      return fields;
    }

    fields.tokenId = bigNumberTransformer.from(fields.tokenId);
    return fields;
  },
};
