import { Logger, Injectable, INestApplication, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { EventEmitter2, EventEmitterModule } from "@nestjs/event-emitter";
import { mock } from "jest-mock-extended";
import { DataSource } from "typeorm";
import { AppService } from "./app.service";
import { BalancesCleanerService } from "./balance";
import { CounterService } from "./counter";
import { BatchService } from "./batch";
import { BlockService } from "./block";
import { BlocksRevertService } from "./blocksRevert";
import { TokenOffChainDataSaverService } from "./token/tokenOffChainData/tokenOffChainDataSaver.service";
import runMigrations from "./utils/runMigrations";
import { BLOCKS_REVERT_DETECTED_EVENT } from "./constants";

jest.mock("./utils/runMigrations");

const blockNumber = 100;
@Injectable()
class SimulatedEmitter implements OnApplicationBootstrap {
  public constructor(private readonly eventEmitter: EventEmitter2) {}

  onApplicationBootstrap() {
    this.eventEmitter.emit(BLOCKS_REVERT_DETECTED_EVENT, {
      detectedIncorrectBlockNumber: blockNumber,
    });
  }
}

describe("AppService", () => {
  let app: INestApplication;
  let appService: AppService;
  let balancesCleanerService: BalancesCleanerService;
  let counterService: CounterService;
  let batchService: BatchService;
  let blockService: BlockService;
  let blocksRevertService: BlocksRevertService;
  let tokenOffChainDataSaverService: TokenOffChainDataSaverService;
  let dataSourceMock: DataSource;
  let configServiceMock: ConfigService;

  beforeEach(async () => {
    balancesCleanerService = mock<BalancesCleanerService>({
      start: jest.fn().mockResolvedValue(null),
      stop: jest.fn().mockResolvedValue(null),
    });
    counterService = mock<CounterService>({
      start: jest.fn().mockResolvedValue(null),
      stop: jest.fn().mockResolvedValue(null),
    });
    batchService = mock<BatchService>({
      start: jest.fn().mockResolvedValue(null),
      stop: jest.fn().mockResolvedValue(null),
    });
    blockService = mock<BlockService>({
      start: jest.fn().mockResolvedValue(null),
      stop: jest.fn().mockResolvedValue(null),
    });
    blocksRevertService = mock<BlocksRevertService>({
      handleRevert: jest.fn().mockResolvedValue(null),
    });
    tokenOffChainDataSaverService = mock<TokenOffChainDataSaverService>({
      start: jest.fn().mockResolvedValue(null),
      stop: jest.fn().mockResolvedValue(null),
    });
    dataSourceMock = mock<DataSource>();
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockReturnValue(false),
    });

    const module = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        AppService,
        SimulatedEmitter,
        {
          provide: BalancesCleanerService,
          useValue: balancesCleanerService,
        },
        {
          provide: CounterService,
          useValue: counterService,
        },
        {
          provide: BatchService,
          useValue: batchService,
        },
        {
          provide: BlockService,
          useValue: blockService,
        },
        {
          provide: BlocksRevertService,
          useValue: blocksRevertService,
        },
        {
          provide: TokenOffChainDataSaverService,
          useValue: tokenOffChainDataSaverService,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    module.useLogger(mock<Logger>());
    appService = module.get(AppService);

    app = module.createNestApplication();
  });

  describe("onModuleInit", () => {
    let migrationsRunFinishedResolve: () => void;
    let migrationsRunFinished: Promise<void>;

    beforeEach(() => {
      migrationsRunFinished = new Promise((resolve) => (migrationsRunFinishedResolve = resolve));
      (runMigrations as jest.Mock).mockImplementation(() => {
        migrationsRunFinishedResolve();
        return Promise.resolve();
      });
    });

    it("runs migrations", async () => {
      appService.onModuleInit();
      await migrationsRunFinished;
      expect(runMigrations).toBeCalledTimes(1);
      appService.onModuleDestroy();
    });

    it("starts counter service", async () => {
      appService.onModuleInit();
      await migrationsRunFinished;
      expect(counterService.start).toBeCalledTimes(1);
      appService.onModuleDestroy();
      expect(counterService.stop).toBeCalledTimes(1);
    });

    it("starts batch service", async () => {
      appService.onModuleInit();
      await migrationsRunFinished;
      expect(batchService.start).toBeCalledTimes(1);
      appService.onModuleDestroy();
      expect(batchService.stop).toBeCalledTimes(1);
    });

    it("starts block service", async () => {
      appService.onModuleInit();
      await migrationsRunFinished;
      expect(blockService.start).toBeCalledTimes(1);
      appService.onModuleDestroy();
      expect(blockService.stop).toBeCalledTimes(1);
    });

    it("starts old balances cleaner service", async () => {
      appService.onModuleInit();
      await migrationsRunFinished;
      expect(balancesCleanerService.start).toBeCalledTimes(1);
      appService.onModuleDestroy();
      expect(balancesCleanerService.stop).toBeCalledTimes(1);
    });

    it("does not start token offchain data saver service by default", async () => {
      appService.onModuleInit();
      await migrationsRunFinished;
      expect(tokenOffChainDataSaverService.start).not.toBeCalled();
      appService.onModuleDestroy();
    });

    it("does not start batches service when disableBatchesProcessing is true", async () => {
      (configServiceMock.get as jest.Mock).mockReturnValue(true);
      appService.onModuleInit();
      await migrationsRunFinished;
      expect(batchService.start).not.toBeCalled();
      appService.onModuleDestroy();
    });

    it("does not start counter service when disableCountersProcessing is true", async () => {
      (configServiceMock.get as jest.Mock).mockReturnValue(true);
      appService.onModuleInit();
      await migrationsRunFinished;
      expect(counterService.start).not.toBeCalled();
      appService.onModuleDestroy();
    });

    it("does not start old balances cleaner when disableOldBalancesCleaner is true", async () => {
      (configServiceMock.get as jest.Mock).mockReturnValue(true);
      appService.onModuleInit();
      await migrationsRunFinished;
      expect(balancesCleanerService.start).not.toBeCalled();
      appService.onModuleDestroy();
    });

    it("starts token offchain data saver service when enableTokenOffChainDataSaver is true", async () => {
      (configServiceMock.get as jest.Mock).mockReturnValue(true);
      appService.onModuleInit();
      await migrationsRunFinished;
      expect(tokenOffChainDataSaverService.start).toBeCalledTimes(1);
      appService.onModuleDestroy();
      expect(tokenOffChainDataSaverService.stop).toBeCalledTimes(1);
    });
  });

  describe("onModuleDestroy", () => {
    it("stops counter service", async () => {
      appService.onModuleDestroy();
      expect(counterService.stop).toBeCalledTimes(1);
    });

    it("stops batch service", async () => {
      appService.onModuleDestroy();
      expect(batchService.stop).toBeCalledTimes(1);
    });

    it("stops block service", async () => {
      appService.onModuleDestroy();
      expect(blockService.stop).toBeCalledTimes(1);
    });

    it("stops old balances cleaner service", async () => {
      appService.onModuleDestroy();
      expect(balancesCleanerService.stop).toBeCalledTimes(1);
    });

    it("stops token offchain data saver service", async () => {
      appService.onModuleDestroy();
      expect(tokenOffChainDataSaverService.stop).toBeCalledTimes(1);
    });
  });

  describe("Handling blocks revert event", () => {
    it("stops all the workers, handles blocks revert and then restarts the workers", async () => {
      (runMigrations as jest.Mock).mockResolvedValue(null);
      (configServiceMock.get as jest.Mock).mockImplementation((key) =>
        key === "tokens.enableTokenOffChainDataSaver" ? true : false
      );
      await app.init();

      expect(blockService.stop).toBeCalledTimes(1);
      expect(batchService.stop).toBeCalledTimes(1);
      expect(counterService.stop).toBeCalledTimes(1);
      expect(balancesCleanerService.stop).toBeCalledTimes(1);
      expect(tokenOffChainDataSaverService.stop).toBeCalledTimes(1);

      expect(blocksRevertService.handleRevert).toBeCalledWith(blockNumber);

      expect(blockService.start).toBeCalledTimes(2);
      expect(batchService.start).toBeCalledTimes(2);
      expect(counterService.start).toBeCalledTimes(2);
      expect(balancesCleanerService.start).toBeCalledTimes(2);
      expect(tokenOffChainDataSaverService.start).toBeCalledTimes(2);

      await app.close();
    });
  });
});
