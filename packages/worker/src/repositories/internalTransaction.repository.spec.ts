import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { InternalTransactionRepository } from "./internalTransaction.repository";
import { UnitOfWork } from "../unitOfWork";
import { AddressInternalTransactionRepository } from "./addressInternalTransaction.repository";

describe("InternalTransactionRepository", () => {
  let repository: InternalTransactionRepository;
  let unitOfWorkMock: UnitOfWork;
  let addressInternalTransactionRepositoryMock: AddressInternalTransactionRepository;

  beforeEach(async () => {
    unitOfWorkMock = mock<UnitOfWork>();
    addressInternalTransactionRepositoryMock = mock<AddressInternalTransactionRepository>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InternalTransactionRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
        {
          provide: AddressInternalTransactionRepository,
          useValue: addressInternalTransactionRepositoryMock,
        },
      ],
    }).compile();

    repository = module.get<InternalTransactionRepository>(InternalTransactionRepository);
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });
});
