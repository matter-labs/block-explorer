import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { EntityManager } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { BaseRepository } from "./base.repository";
import { LogRepository } from "./log.repository";
import { VisibleLogRepository } from "./visibleLog.repository";
import { Log } from "../entities";
import { UnitOfWork } from "../unitOfWork";

describe("LogRepository", () => {
  let repository: LogRepository;
  let unitOfWorkMock: UnitOfWork;
  let entityManagerMock: EntityManager;
  let visibleLogRepositoryMock: VisibleLogRepository;

  let configServiceMock: ConfigService;

  beforeEach(async () => {
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockReturnValue(false),
    });
    unitOfWorkMock = mock<UnitOfWork>({
      getTransactionManager: jest
        .fn()
        .mockReturnValue(mock<EntityManager>({ insert: jest.fn().mockResolvedValue(null) })),
    });
    entityManagerMock = mock<EntityManager>();
    visibleLogRepositoryMock = mock<VisibleLogRepository>({
      addMany: jest.fn().mockResolvedValue(null),
    });

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        LogRepository,
        {
          provide: EntityManager,
          useValue: entityManagerMock,
        },
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
        {
          provide: VisibleLogRepository,
          useValue: visibleLogRepositoryMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    repository = app.get<LogRepository>(LogRepository);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("extends BaseRepository<Log>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<Log>);
  });

  describe("addMany", () => {
    const logs: Partial<Log>[] = [
      {
        number: 1,
        transactionHash: "0xhash",
        address: "0xcontract",
        logIndex: 0,
        blockNumber: 10,
        transactionFrom: "0xsender",
        transactionTo: "0xreceiver",
        topics: [],
      },
    ];

    describe("when prividium.enabled is true and disableTxVisibilityByTopics is false", () => {
      beforeEach(() => {
        (configServiceMock.get as jest.Mock).mockImplementation((key: string) => key === "prividium.enabled");
      });

      it("inserts visible log rows for transactionFrom, transactionTo, and address", async () => {
        await repository.addMany(logs);
        expect(visibleLogRepositoryMock.addMany).toBeCalledTimes(1);
        const rows = (visibleLogRepositoryMock.addMany as jest.Mock).mock.calls[0][0];
        const viewers = rows.map((r) => r.visibleBy);
        expect(viewers).toContain("0xsender");
        expect(viewers).toContain("0xreceiver");
        expect(viewers).toContain("0xcontract");
      });

      it("includes topic-derived addresses in visible log rows", async () => {
        const topicAddress = "0x" + "0".repeat(24) + "f39fd6e51aad88f6f4ce6ab8827279cfffb92266";
        const logsWithTopics: Partial<Log>[] = [{ ...logs[0], topics: ["0xevent", topicAddress] }];
        await repository.addMany(logsWithTopics);
        const rows = (visibleLogRepositoryMock.addMany as jest.Mock).mock.calls[0][0];
        const viewers = rows.map((r) => r.visibleBy);
        expect(viewers).toContain("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
      });

      it("does not insert visible logs when disableTxVisibilityByTopics is true", async () => {
        (configServiceMock.get as jest.Mock).mockReturnValue(true);
        await repository.addMany(logs);
        expect(visibleLogRepositoryMock.addMany).not.toBeCalled();
      });
    });

    describe("when prividium.enabled is false", () => {
      it("does not insert visible log rows", async () => {
        await repository.addMany(logs);
        expect(visibleLogRepositoryMock.addMany).not.toBeCalled();
      });
    });
  });
});
