import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Address } from "./address.entity";
import { AccountDto, AddressType, ContractDto } from "./dtos";
import { formatHexAddress } from "../common/utils";
import { getAddress as ethersGetAddress } from "ethers";
import { TransactionService } from "../transaction/transaction.service";
import { BalanceService } from "../balance/balance.service";
import { BlockService } from "../block/block.service";

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly transactionService: TransactionService,
    private readonly balanceService: BalanceService,
    private readonly blockService: BlockService
  ) {}

  public async findOne(address: string): Promise<Address> {
    return await this.addressRepository.findOneBy({ address });
  }

  public async findByAddresses(addresses: string[]): Promise<Address[]> {
    return await this.addressRepository.find({
      where: {
        address: In(addresses),
      },
    });
  }

  public async findFullAddress(address: string, includeBalances: boolean): Promise<AccountDto | ContractDto> {
    const [addressRecord, addressBalance] = await Promise.all([
      this.findOne(address),
      includeBalances ? this.balanceService.getBalances(address) : Promise.resolve({ blockNumber: 0, balances: {} }),
    ]);

    if (addressRecord?.bytecode.length > 2) {
      const totalTransactions = await this.transactionService.count({ "from|to": formatHexAddress(address) });
      return {
        type: AddressType.Contract,
        ...addressRecord,
        blockNumber: addressBalance.blockNumber || addressRecord.createdInBlockNumber,
        balances: addressBalance.balances,
        createdInBlockNumber: addressRecord.createdInBlockNumber,
        creatorTxHash: addressRecord.creatorTxHash,
        totalTransactions,
        creatorAddress: addressRecord.creatorAddress,
        isEvmLike: addressRecord.isEvmLike,
      };
    }

    if (addressBalance.blockNumber) {
      const [sealedNonce, verifiedNonce] = await Promise.all([
        this.transactionService.getAccountNonce({ accountAddress: address }),
        this.transactionService.getAccountNonce({ accountAddress: address, isVerified: true }),
      ]);

      return {
        type: AddressType.Account,
        address: ethersGetAddress(address),
        blockNumber: addressBalance.blockNumber,
        balances: addressBalance.balances,
        sealedNonce,
        verifiedNonce,
      };
    }

    return {
      type: AddressType.Account,
      address: ethersGetAddress(address),
      blockNumber: await this.blockService.getLastBlockNumber(),
      balances: {},
      sealedNonce: 0,
      verifiedNonce: 0,
    };
  }
}
