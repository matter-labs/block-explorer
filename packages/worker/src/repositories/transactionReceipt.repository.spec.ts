import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { BaseRepository } from "./base.repository";
import { TransactionReceiptRepository } from "./transactionReceipt.repository";
import { TransactionReceipt } from "../entities";
import { UnitOfWork } from "../unitOfWork";

describe("TransactionReceiptRepository", () => {
  let repository: TransactionReceiptRepository;
  let unitOfWorkMock: UnitOfWork;

  beforeEach(async () => {
    unitOfWorkMock = mock<UnitOfWork>();

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionReceiptRepository,
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get<TransactionReceiptRepository>(TransactionReceiptRepository);
  });

  it("extends BaseRepository<TransactionReceipt>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<TransactionReceipt>);
  });
});
