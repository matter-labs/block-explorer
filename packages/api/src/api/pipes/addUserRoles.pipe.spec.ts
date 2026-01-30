import { AddUserRolesPipe } from "./addUserRoles.pipe";
import { ConfigService } from "@nestjs/config";
import { mock } from "jest-mock-extended";
import { InternalServerErrorException } from "@nestjs/common";
import { PrividiumApiError } from "../../errors/prividiumApiError";

describe("AddUserRolesPipe", () => {
  let fetchSpy: jest.SpyInstance;
  let configServiceMock: ConfigService;
  let pipe: AddUserRolesPipe;
  const adminRoleName = "admin";

  const configServiceValues = {
    "prividium.permissionsApiUrl": "https://permissions-api.example.com",
    "prividium.adminRoleName": adminRoleName,
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

  it("sets is admin to false when empty list of roles is returned", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [],
      }),
    });

    const user = await pipe.transform({ address: "0x01", token: "token1" });
    expect(user.isAdmin).toBe(false);
  });

  it("sets is admin to false when there there is a list of roles but non of them is admin", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: ["role1", "trader", "admi", "dmin"].map((r) => ({ roleName: r })),
      }),
    });

    const user = await pipe.transform({ address: "0x01", token: "token1" });
    expect(user.isAdmin).toBe(false);
  });

  it("sets is admin to true when user has admin role", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: [adminRoleName].map((r) => ({ roleName: r })),
      }),
    });

    const user = await pipe.transform({ address: "0x01", token: "token1" });
    expect(user.isAdmin).toBe(true);
  });

  it("sets received roles into roles array", async () => {
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValue({
        roles: ["role1", "another", "trader"].map((r) => ({ roleName: r })),
      }),
    });

    const user = await pipe.transform({ address: "0x01", token: "token1" });
    expect(user.roles).toEqual(["role1", "another", "trader"]);
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
