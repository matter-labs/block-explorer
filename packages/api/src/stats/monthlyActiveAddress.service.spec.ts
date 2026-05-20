import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { mock } from "jest-mock-extended";
import { MonthlyActiveAddressCount } from "./monthlyActiveAddressCount.entity";
import { MonthlyActiveAddressService } from "./monthlyActiveAddress.service";

describe("MonthlyActiveAddressService", () => {
  let service: MonthlyActiveAddressService;
  let repositoryMock: Repository<MonthlyActiveAddressCount>;

  beforeEach(async () => {
    repositoryMock = mock<Repository<MonthlyActiveAddressCount>>({
      findOne: jest.fn(),
    });

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        MonthlyActiveAddressService,
        {
          provide: getRepositoryToken(MonthlyActiveAddressCount),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = app.get<MonthlyActiveAddressService>(MonthlyActiveAddressService);
  });

  describe("getCount", () => {
    it("appends the day, queries findOne, and returns the persisted count", async () => {
      (repositoryMock.findOne as jest.Mock).mockResolvedValueOnce({ month: "2026-05-01", count: 9876 });
      const result = await service.getCount("2026-05");
      expect(repositoryMock.findOne).toHaveBeenCalledWith({ where: { month: "2026-05-01" } });
      expect(result).toBe(9876);
    });

    it("returns 0 when there is no row for the given month", async () => {
      (repositoryMock.findOne as jest.Mock).mockResolvedValueOnce(null);
      const result = await service.getCount("2026-05");
      expect(result).toBe(0);
    });
  });
});
