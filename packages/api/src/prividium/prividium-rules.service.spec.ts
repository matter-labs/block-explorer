import { PrividiumRulesService, EVENT_PERMISSION_RULES_VERSION } from "./prividium-rules.service";
import { PrividiumApiError } from "../errors/prividiumApiError";

describe("PrividiumRulesService", () => {
  const permissionsApiUrl = "https://permissions.test";
  const token = "token-123";
  const mockConfigService = { get: jest.fn().mockReturnValue(permissionsApiUrl) } as any;

  const makeResponse = (data: unknown, status = 200) =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: jest.fn().mockResolvedValue(data),
    } as any as Response);

  const sampleRules = [
    {
      contractAddress: "0xabc",
      topic0: "0xdead",
      topic1: null,
      topic2: null,
      topic3: null,
    },
  ];

  beforeEach(() => {
    jest
      .spyOn(global, "fetch")
      .mockResolvedValue(makeResponse({ version: EVENT_PERMISSION_RULES_VERSION, rules: sampleRules }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns rules when version matches the expected literal", async () => {
    const service = new PrividiumRulesService(mockConfigService);
    const result = await service.fetchEventPermissionRules(token);
    expect(result).toEqual(sampleRules);
    expect(global.fetch).toHaveBeenCalledWith(new URL("/api/check/event-permission-rules", permissionsApiUrl), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  it("throws when response version does not match", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(makeResponse({ version: "2", rules: sampleRules }));
    const service = new PrividiumRulesService(mockConfigService);

    await expect(service.fetchEventPermissionRules(token)).rejects.toBeInstanceOf(PrividiumApiError);
    await expect(service.fetchEventPermissionRules(token)).rejects.toThrow("Invalid permission rules response");
  });

  it("throws when response is missing version", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(makeResponse({ rules: sampleRules }));
    const service = new PrividiumRulesService(mockConfigService);

    await expect(service.fetchEventPermissionRules(token)).rejects.toBeInstanceOf(PrividiumApiError);
    await expect(service.fetchEventPermissionRules(token)).rejects.toThrow("Invalid permission rules response");
  });
});
