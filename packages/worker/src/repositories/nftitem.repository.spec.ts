import { Test, TestingModule } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { EntityManager } from "typeorm";
import { BaseRepository } from "./base.repository";
import { NftItem } from "../entities";
import { UnitOfWork } from "../unitOfWork";
import { NftItemRepository } from "./nftItem.repository";

describe("NftItemRepository", () => {
  let repository: NftItemRepository;
  let unitOfWorkMock: UnitOfWork;
  let entityManagerMock: EntityManager;

  beforeEach(async () => {
    unitOfWorkMock = mock<UnitOfWork>();
    entityManagerMock = mock<EntityManager>();

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        NftItemRepository,
        {
          provide: EntityManager,
          useValue: entityManagerMock,
        },
        {
          provide: UnitOfWork,
          useValue: unitOfWorkMock,
        },
      ],
    }).compile();

    repository = app.get<NftItemRepository>(NftItemRepository);
  });

  it("extends BaseRepository<NftItem>", () => {
    expect(repository).toBeInstanceOf(BaseRepository<NftItem>);
  });
});
