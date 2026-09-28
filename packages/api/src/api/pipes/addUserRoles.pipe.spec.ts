import { AddUserRolesPipe } from "./addUserRoles.pipe";
import { ConfigService } from "@nestjs/config";
import { mock } from "jest-mock-extended";
import { BadGatewayException } from "@nestjs/common";
import { PrividiumApiError } from "../../errors/prividiumApiError";
import { NO_WALLET_VIEWER } from "../../common/constants";

describe("AddUserRolesPipe", () => {
  let fetchSpy: jest.SpyInstance;
  let configServiceMock: ConfigService;
  let pipe: AddUserRolesPipe;

  const configServiceValues = {
    "prividium.permissionsApiUrl": "https://permissions-api.example.com",
  };

  beforeEach(() => {
    configServiceMock = mock<ConfigService>({
      get: jest.fn().mockImplementation((key: string) => configServiceValues[key]),
    });
    fetchSpy = jest.spyOn(global, "fetch");
    pipe = new AddUserRolesPipe(configServiceMock);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("sets hasFullReadAccess to false when empty list of roles is returned", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [],
        wallets: [{ walletAddress: "0x01" }],
      }),
    });

    const user = await pipe.transform({ address: "0x01", wallets: ["0x01"], token: "token1" });
    expect(user.hasFullReadAccess).toBe(false);
  });

  it("sets hasFullReadAccess to false when roles have no systemPermissions", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: ["role1", "trader", "viewer"].map((r) => ({ roleName: r })),
        wallets: [{ walletAddress: "0x01" }],
      }),
    });

    const user = await pipe.transform({ address: "0x01", wallets: ["0x01"], token: "token1" });
    expect(user.hasFullReadAccess).toBe(false);
  });

  it("sets hasFullReadAccess to false when roles have unrelated systemPermissions only", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [{ roleName: "deployer", systemPermissions: ["contract_deployment", "admin_read"] }],
        wallets: [{ walletAddress: "0x01" }],
      }),
    });

    const user = await pipe.transform({ address: "0x01", wallets: ["0x01"], token: "token1" });
    expect(user.hasFullReadAccess).toBe(false);
  });

  it("sets hasFullReadAccess to true when a role has full_read_access permission", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [{ roleName: "admin", systemPermissions: ["full_read_access", "contract_deployment"] }],
        wallets: [{ walletAddress: "0x01" }],
      }),
    });

    const user = await pipe.transform({ address: "0x01", wallets: ["0x01"], token: "token1" });
    expect(user.hasFullReadAccess).toBe(true);
  });

  it("sets hasFullReadAccess to true when a role has full_sequencer_rpc_access permission", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [{ roleName: "superuser", systemPermissions: ["full_sequencer_rpc_access"] }],
        wallets: [{ walletAddress: "0x01" }],
      }),
    });

    const user = await pipe.transform({ address: "0x01", wallets: ["0x01"], token: "token1" });
    expect(user.hasFullReadAccess).toBe(true);
  });

  it("sets hasAdminRead to false when no role has admin_read permission", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [{ roleName: "trader", systemPermissions: ["contract_deployment"] }],
        wallets: [{ walletAddress: "0x01" }],
      }),
    });

    const user = await pipe.transform({ address: "0x01", wallets: ["0x01"], token: "token1" });
    expect(user.hasAdminRead).toBe(false);
  });

  it("sets hasAdminRead to true when a role has admin_read permission", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [{ roleName: "admin", systemPermissions: ["admin_read", "full_read_access"] }],
        wallets: [{ walletAddress: "0x01" }],
      }),
    });

    const user = await pipe.transform({ address: "0x01", wallets: ["0x01"], token: "token1" });
    expect(user.hasAdminRead).toBe(true);
  });

  it("sets hasAdminRead independently from hasFullReadAccess", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [{ roleName: "sequencer", systemPermissions: ["full_sequencer_rpc_access"] }],
        wallets: [{ walletAddress: "0x01" }],
      }),
    });

    const user = await pipe.transform({ address: "0x01", wallets: ["0x01"], token: "token1" });
    expect(user.hasFullReadAccess).toBe(true);
    expect(user.hasAdminRead).toBe(false);
  });

  it("sets hasFullReadAccess to true when the permission is on any role in the list", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [
          { roleName: "trader", systemPermissions: ["contract_deployment"] },
          { roleName: "reader", systemPermissions: ["full_read_access"] },
        ],
        wallets: [{ walletAddress: "0x01" }],
      }),
    });

    const user = await pipe.transform({ address: "0x01", wallets: ["0x01"], token: "token1" });
    expect(user.hasFullReadAccess).toBe(true);
  });

  it("keeps original address and token values", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: ["role1", "another", "trader"].map((r) => ({ roleName: r })),
        wallets: [{ walletAddress: "0x01" }],
      }),
    });

    const user = await pipe.transform({ address: "0x01", wallets: ["0x01"], token: "token1" });
    expect(user.address).toEqual("0x01");
    expect(user.token).toEqual("token1");
  });

  it("ignores read permissions granted by organization-scoped roles", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [
          {
            roleName: "org-reader",
            organizationId: "org-a",
            systemPermissions: ["full_read_access", "full_sequencer_rpc_access", "admin_read"],
          },
        ],
        wallets: [{ walletAddress: "0x01" }],
      }),
    });

    const user = await pipe.transform({ address: "0x01", wallets: ["0x01"], token: "token1" });
    expect(user.hasFullReadAccess).toBe(false);
    expect(user.hasAdminRead).toBe(false);
  });

  it("grants read permissions from zone-level roles", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [
          { roleName: "org-admin", organizationId: "org-a", systemPermissions: ["contract_deployment"] },
          { roleName: "zone-reader", organizationId: null, systemPermissions: ["full_read_access", "admin_read"] },
        ],
        wallets: [{ walletAddress: "0x01" }],
      }),
    });

    const user = await pipe.transform({ address: "0x01", wallets: ["0x01"], token: "token1" });
    expect(user.hasFullReadAccess).toBe(true);
    expect(user.hasAdminRead).toBe(true);
  });

  it("replaces cached wallets with the live wallet list", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [],
        wallets: [{ walletAddress: "0x01" }],
      }),
    });

    const user = await pipe.transform({ address: "0x01", wallets: ["0x01", "0x02"], token: "token1" });
    expect(user.wallets).toEqual(["0x01"]);
  });

  it("throws PrividiumApiError 401 if the selected wallet is no longer associated with the user", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [{ roleName: "admin", systemPermissions: ["full_read_access"] }],
        wallets: [{ walletAddress: "0x01" }],
      }),
    });

    await expect(pipe.transform({ address: "0x02", wallets: ["0x01", "0x02"], token: "token1" })).rejects.toThrow(
      new PrividiumApiError("Authentication failed", 401)
    );
  });

  it("matches the selected wallet case-insensitively", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [],
        wallets: [{ walletAddress: "0xabcd" }],
      }),
    });

    const user = await pipe.transform({ address: "0xABCD", wallets: ["0xABCD"], token: "token1" });
    expect(user.address).toEqual("0xABCD");
  });

  it("does not require a wallet for walletless sessions", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [],
        wallets: [],
      }),
    });

    const user = await pipe.transform({ address: NO_WALLET_VIEWER, wallets: [], token: "token1" });
    expect(user.address).toEqual(NO_WALLET_VIEWER);
    expect(user.wallets).toEqual([]);
  });

  it("does not require a wallet when no address is selected", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [{ roleName: "admin", systemPermissions: ["full_read_access"] }],
        wallets: [],
      }),
    });

    const user = await pipe.transform({ address: "", wallets: [], token: "token1" });
    expect(user.hasFullReadAccess).toBe(true);
  });

  it("throws if server returns no wallets", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [],
      }),
    });

    await expect(pipe.transform({ address: "0x01", wallets: ["0x01"], token: "token1" })).rejects.toThrow(
      BadGatewayException
    );
  });

  it("throws if server returns incorrect body", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [{ badFormat: true }],
      }),
    });

    const pipe = new AddUserRolesPipe(configServiceMock);

    await expect(pipe.transform({ address: "0x01", wallets: ["0x01"], token: "token1" })).rejects.toThrow(
      BadGatewayException
    );
  });

  it("throws PrividiumApiError if server returns 401", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 401,
      json: jest.fn().mockResolvedValue({
        roles: [],
      }),
    });

    const pipe = new AddUserRolesPipe(configServiceMock);

    await expect(pipe.transform({ address: "0x01", wallets: ["0x01"], token: "token1" })).rejects.toThrow(
      PrividiumApiError
    );
  });

  it("throws BadGatewayException if server returns a non-401 error status", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 503,
      json: jest.fn().mockResolvedValue({}),
    });

    const pipe = new AddUserRolesPipe(configServiceMock);

    await expect(pipe.transform({ address: "0x01", wallets: ["0x01"], token: "token1" })).rejects.toThrow(
      BadGatewayException
    );
  });

  it("throws if server returns non parseable json", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockRejectedValue(new SyntaxError("bad JSON")),
    });

    const pipe = new AddUserRolesPipe(configServiceMock);

    await expect(pipe.transform({ address: "0x01", wallets: ["0x01"], token: "token1" })).rejects.toThrow(
      BadGatewayException
    );
  });

  it("throws if server do not complete request", async () => {
    fetchSpy.mockRejectedValue(new Error("some error"));

    const pipe = new AddUserRolesPipe(configServiceMock);

    await expect(pipe.transform({ address: "0x01", wallets: ["0x01"], token: "token1" })).rejects.toThrow(
      BadGatewayException
    );
  });
});
