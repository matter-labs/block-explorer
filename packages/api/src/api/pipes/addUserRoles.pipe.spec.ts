import { AddUserRolesPipe } from "./addUserRoles.pipe";
import { ConfigService } from "@nestjs/config";
import { mock } from "jest-mock-extended";
import { InternalServerErrorException } from "@nestjs/common";
import { PrividiumApiError } from "../../errors/prividiumApiError";

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
      }),
    });

    const user = await pipe.transform({ address: "0x01", token: "token1" });
    expect(user.hasFullReadAccess).toBe(false);
  });

  it("sets hasFullReadAccess to false when roles have no systemPermissions", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: ["role1", "trader", "viewer"].map((r) => ({ roleName: r })),
      }),
    });

    const user = await pipe.transform({ address: "0x01", token: "token1" });
    expect(user.hasFullReadAccess).toBe(false);
  });

  it("sets hasFullReadAccess to false when roles have unrelated systemPermissions only", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [{ roleName: "deployer", systemPermissions: ["contract_deployment", "admin_read"] }],
      }),
    });

    const user = await pipe.transform({ address: "0x01", token: "token1" });
    expect(user.hasFullReadAccess).toBe(false);
  });

  it("sets hasFullReadAccess to true when a role has full_read_access permission", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [{ roleName: "admin", systemPermissions: ["full_read_access", "contract_deployment"] }],
      }),
    });

    const user = await pipe.transform({ address: "0x01", token: "token1" });
    expect(user.hasFullReadAccess).toBe(true);
  });

  it("sets hasFullReadAccess to true when a role has full_sequencer_rpc_access permission", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [{ roleName: "superuser", systemPermissions: ["full_sequencer_rpc_access"] }],
      }),
    });

    const user = await pipe.transform({ address: "0x01", token: "token1" });
    expect(user.hasFullReadAccess).toBe(true);
  });

  it("sets hasFullReadAccess to true when the permission is on any role in the list", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [
          { roleName: "trader", systemPermissions: ["contract_deployment"] },
          { roleName: "reader", systemPermissions: ["full_read_access"] },
        ],
      }),
    });

    const user = await pipe.transform({ address: "0x01", token: "token1" });
    expect(user.hasFullReadAccess).toBe(true);
  });

  it("keeps original address and token values", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: ["role1", "another", "trader"].map((r) => ({ roleName: r })),
      }),
    });

    const user = await pipe.transform({ address: "0x01", token: "token1" });
    expect(user.address).toEqual("0x01");
    expect(user.token).toEqual("token1");
  });

  it("throws if server returns incorrect body", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [{ badFormat: true }],
      }),
    });

    const pipe = new AddUserRolesPipe(configServiceMock);

    await expect(pipe.transform({ address: "0x01", token: "token1" })).rejects.toThrow(InternalServerErrorException);
  });

  it("throws if server returns non 200 status", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 401,
      json: jest.fn().mockResolvedValue({
        roles: [],
      }),
    });

    const pipe = new AddUserRolesPipe(configServiceMock);

    await expect(pipe.transform({ address: "0x01", token: "token1" })).rejects.toThrow(PrividiumApiError);
  });

  it("throws if server returns non parseable json", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockRejectedValue(new SyntaxError("bad JSON")),
    });

    const pipe = new AddUserRolesPipe(configServiceMock);

    await expect(pipe.transform({ address: "0x01", token: "token1" })).rejects.toThrow(InternalServerErrorException);
  });

  it("throws if server do not complete request", async () => {
    fetchSpy.mockRejectedValue(new Error("some error"));

    const pipe = new AddUserRolesPipe(configServiceMock);

    await expect(pipe.transform({ address: "0x01", token: "token1" })).rejects.toThrow(InternalServerErrorException);
  });
});
