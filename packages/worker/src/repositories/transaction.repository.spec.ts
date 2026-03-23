import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { EntityManager } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { BaseRepository } from "./base.repository";
import { TransactionRepository } from "./transaction.repository";
import { AddressTransactionRepository } from "./addressTransaction.repository";
import { VisibleTransactionRepository } from "./visibleTransaction.repository";
import { AddressVisibleTransactionRepository } from "./addressVisibleTransaction.repository";
import { Transaction } from "../entities";
import { UnitOfWork } from "../unitOfWork";

describe("TransactionRepository", () => {
  let repository: TransactionRepository;
  let addressTransactionRepositoryMock: AddressTransactionRepository;
  let visibleTransactionRepositoryMock: VisibleTransactionRepository;
  let addressVisibleTransactionRepositoryMock: AddressVisibleTransactionRepository;
  let unitOfWorkMock: UnitOfWork;
  let entityManagerMock: EntityManager;

  let configServiceMock: ConfigService;

  beforeEach(async () => {
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockReturnValue(false),
    });
    entityManagerMock = mock<EntityManager>({
      insert: jest.fn().mockResolvedValue(null),
    });
    unitOfWorkMock = mock<UnitOfWork>({
      getTransactionManager: jest.fn().mockReturnValue(entityManagerMock),
    });
    addressTransactionRepositoryMock = mock<AddressTransactionRepository>({
      addMany: jest.fn().mockResolvedValue(null),
    });
    visibleTransactionRepositoryMock = mock<VisibleTransactionRepository>({
      addMany: jest.fn().mockResolvedValue(null),
    });
    addressVisibleTransactionRepositoryMock = mock<AddressVisibleTransactionRepository>({
      addMany: jest.fn().mockResolvedValue(null),
    });

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionRepository,
        {
          provide: AddressTransactionRepository,
          useValue: addressTransactionRepositoryMock,
        },
        {
          provide: VisibleTransactionRepository,
          useValue: visibleTransactionRepositoryMock,
        },
        {
          provide: AddressVisibleTransactionRepository,
          useValue: addressVisibleTransactionRepositoryMock,
        },
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    repository = app.get<TransactionRepository>(TransactionRepository);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("extends BaseRepository<Transaction>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<Transaction>);
  });

  describe("add", () => {
    const record = {
      number: 1,
      hash: "hash",
      from: "aaa",
      to: "bbb",
    };

    it("inserts transaction with fromToMin/fromToMax computed", async () => {
      await repository.add(record);
      // "aaa" <= "bbb" so fromToMin="aaa", fromToMax="bbb"
      expect(entityManagerMock.insert).toBeCalledWith(Transaction, {
        ...record,
        fromToMin: "aaa",
        fromToMax: "bbb",
      });
      expect(entityManagerMock.insert).toBeCalledTimes(1);
    });

    it("inserts transaction with fromToMin/fromToMax reversed when from > to", async () => {
      const reversedRecord = { ...record, from: "zzz", to: "aaa" };
      await repository.add(reversedRecord);
      expect(entityManagerMock.insert).toBeCalledWith(Transaction, {
        ...reversedRecord,
        fromToMin: "aaa",
        fromToMax: "zzz",
      });
    });

    it("inserts address transaction for from and to addresses", async () => {
      await repository.add(record);

      expect(addressTransactionRepositoryMock.addMany).toBeCalledWith([
        {
          address: "aaa",
          from: "aaa",
          to: "bbb",
          hash: "hash",
          transactionHash: "hash",
        },
        {
          address: "bbb",
          from: "aaa",
          to: "bbb",
          hash: "hash",
          transactionHash: "hash",
        },
      ]);
      expect(addressTransactionRepositoryMock.addMany).toBeCalledTimes(1);
    });

    it("passes logs to the repository.add call", async () => {
      const logs = [{ topics: ["0xevent"] }];
      await repository.add(record, logs);
      expect(entityManagerMock.insert).toBeCalledTimes(1);
    });

    describe("when prividium.enabled is true and disableTxVisibilityByTopics is false", () => {
      beforeEach(() => {
        (configServiceMock.get as jest.Mock).mockImplementation((key: string) => key === "prividium.enabled");
      });

      it("inserts visible transaction rows for from and to", async () => {
        await repository.add(record);
        expect(visibleTransactionRepositoryMock.addMany).toBeCalledTimes(1);
        const visibleRows = (visibleTransactionRepositoryMock.addMany as jest.Mock).mock.calls[0][0];
        const visibleBy = visibleRows.map((r) => r.visibleBy);
        expect(visibleBy).toContain(record.from);
        expect(visibleBy).toContain(record.to);
      });

      it("inserts address visible transaction rows (cross-party, from !== to)", async () => {
        await repository.add(record);
        expect(addressVisibleTransactionRepositoryMock.addMany).toBeCalledTimes(1);
        const rows = (addressVisibleTransactionRepositoryMock.addMany as jest.Mock).mock.calls[0][0];
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.every((r) => r.address !== r.visibleBy)).toBe(true);
      });

      it("includes topic-derived viewers in visible transaction rows", async () => {
        const topicAddress = "0x" + "0".repeat(24) + "f39fd6e51aad88f6f4ce6ab8827279cfffb92266";
        const logs = [{ topics: ["0xevent", topicAddress] }];
        await repository.add(record, logs);
        const visibleRows = (visibleTransactionRepositoryMock.addMany as jest.Mock).mock.calls[0][0];
        const viewers = visibleRows.map((r) => r.visibleBy);
        expect(viewers).toContain("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
      });

      it("does not insert visible transactions when disableTxVisibilityByTopics is true", async () => {
        (configServiceMock.get as jest.Mock).mockReturnValue(true);
        await repository.add(record);
        expect(visibleTransactionRepositoryMock.addMany).not.toBeCalled();
        expect(addressVisibleTransactionRepositoryMock.addMany).not.toBeCalled();
      });
    });

    describe("when prividium.enabled is false", () => {
      it("does not insert visible transaction rows", async () => {
        await repository.add(record);
        expect(visibleTransactionRepositoryMock.addMany).not.toBeCalled();
        expect(addressVisibleTransactionRepositoryMock.addMany).not.toBeCalled();
      });
    });
  });
});
