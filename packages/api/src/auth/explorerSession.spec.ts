import { HttpException } from "@nestjs/common";
import { ExplorerSessionVerifier, fetchExplorerSession } from "./explorerSession";

jest.mock("@nestjs/common", () => ({
  ...jest.requireActual("@nestjs/common"),
  Logger: jest.fn().mockReturnValue({
    warn: jest.fn(),
  }),
}));

describe("fetchExplorerSession", () => {
  const permissionsApiUrl = "https://permissions-api.example.com";
  const token = "mock-token";
  const expiresAt = new Date(2100, 0, 1).toISOString();
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  const mockCurrentSession = (session: Record<string, unknown>) =>
    fetchSpy.mockResolvedValueOnce({ status: 200, json: jest.fn().mockResolvedValue(session) });

  it("calls the current session endpoint with the bearer token", async () => {
    mockCurrentSession({ type: "user", expiresAt });

    await fetchExplorerSession(permissionsApiUrl, token);

    expect(fetchSpy).toHaveBeenCalledWith(new URL("https://permissions-api.example.com/api/auth/current-session"), {
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  it("accepts a user session without an oauth client (account session or legacy permissions API)", async () => {
    mockCurrentSession({ type: "user", expiresAt });

    await expect(fetchExplorerSession(permissionsApiUrl, token)).resolves.toEqual({ expiresAt });
  });

  it("accepts a user session with a null oauth client", async () => {
    mockCurrentSession({ type: "user", expiresAt, oauthClientId: null });

    await expect(fetchExplorerSession(permissionsApiUrl, token)).resolves.toEqual({ expiresAt });
  });

  it("accepts the explorer's own application session", async () => {
    mockCurrentSession({ type: "user", expiresAt, oauthClientId: "block-explorer" });

    await expect(fetchExplorerSession(permissionsApiUrl, token)).resolves.toEqual({ expiresAt });
  });

  it("rejects a session issued to another application", async () => {
    mockCurrentSession({ type: "user", expiresAt, oauthClientId: "some-dapp" });

    await expect(fetchExplorerSession(permissionsApiUrl, token)).rejects.toThrow(
      new HttpException("Token was not issued for the block explorer", 403)
    );
  });

  it("rejects a session that is not a user session", async () => {
    mockCurrentSession({ type: "service", expiresAt, oauthClientId: null });

    await expect(fetchExplorerSession(permissionsApiUrl, token)).rejects.toThrow(
      new HttpException("Token was not issued for the block explorer", 403)
    );
  });

  it("rejects an invalid or expired token", async () => {
    fetchSpy.mockResolvedValueOnce({ status: 401, json: jest.fn() });

    await expect(fetchExplorerSession(permissionsApiUrl, token)).rejects.toThrow(
      new HttpException("Invalid or expired token", 403)
    );
  });

  it("throws an upstream error, not an auth error, when the permissions API throttles", async () => {
    fetchSpy.mockResolvedValueOnce({ status: 429, json: jest.fn() });

    await expect(fetchExplorerSession(permissionsApiUrl, token)).rejects.toThrow(
      "Unexpected 429 response from permissions API"
    );
  });

  it("throws on a malformed response", async () => {
    mockCurrentSession({ invalid: "response" });

    await expect(fetchExplorerSession(permissionsApiUrl, token)).rejects.toThrow(
      /Invalid response from permissions API/
    );
  });
});

describe("ExplorerSessionVerifier", () => {
  const permissionsApiUrl = "https://permissions-api.example.com";
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    jest.useRealTimers();
  });

  const inOneHour = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const mockCurrentSession = (session: Record<string, unknown>) =>
    fetchSpy.mockResolvedValueOnce({ status: 200, json: jest.fn().mockResolvedValue(session) });
  const deferredCurrentSession = () => {
    let resolve: (value: unknown) => void;
    fetchSpy.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    return (session: Record<string, unknown>) => resolve({ status: 200, json: jest.fn().mockResolvedValue(session) });
  };

  it("verifies a token once and reuses the verdict", async () => {
    const verifier = new ExplorerSessionVerifier();
    mockCurrentSession({ type: "user", expiresAt: inOneHour(), oauthClientId: "block-explorer" });

    await verifier.verify(permissionsApiUrl, "token");
    await verifier.verify(permissionsApiUrl, "token");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("reuses the verdict established at login", async () => {
    const verifier = new ExplorerSessionVerifier();
    const expiresAt = inOneHour();
    mockCurrentSession({ type: "user", expiresAt });

    await expect(verifier.establish(permissionsApiUrl, "token")).resolves.toEqual({ expiresAt });
    await verifier.verify(permissionsApiUrl, "token");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("always fetches a fresh session on establish", async () => {
    const verifier = new ExplorerSessionVerifier();
    mockCurrentSession({ type: "user", expiresAt: inOneHour() });
    mockCurrentSession({ type: "user", expiresAt: inOneHour() });

    await verifier.establish(permissionsApiUrl, "token");
    await verifier.establish(permissionsApiUrl, "token");

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("verifies again once the session has expired", async () => {
    const now = new Date("2030-01-01T00:00:00.000Z");
    jest.useFakeTimers({ now });
    const verifier = new ExplorerSessionVerifier();
    mockCurrentSession({ type: "user", expiresAt: new Date(now.getTime() + 1000).toISOString() });
    fetchSpy.mockResolvedValueOnce({ status: 401, json: jest.fn() });

    await verifier.verify(permissionsApiUrl, "token");
    jest.setSystemTime(now.getTime() + 1001);

    await expect(verifier.verify(permissionsApiUrl, "token")).rejects.toThrow(
      new HttpException("Invalid or expired token", 403)
    );
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("does not remember a rejected token", async () => {
    const verifier = new ExplorerSessionVerifier();
    mockCurrentSession({ type: "user", expiresAt: inOneHour(), oauthClientId: "some-dapp" });
    mockCurrentSession({ type: "user", expiresAt: inOneHour(), oauthClientId: "some-dapp" });

    await expect(verifier.verify(permissionsApiUrl, "token")).rejects.toThrow(HttpException);
    await expect(verifier.verify(permissionsApiUrl, "token")).rejects.toThrow(HttpException);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("shares one upstream call between concurrent requests with the same token", async () => {
    const verifier = new ExplorerSessionVerifier();
    const resolveSession = deferredCurrentSession();

    const requests = Array.from({ length: 120 }, () => verifier.verify(permissionsApiUrl, "token"));
    resolveSession({ type: "user", expiresAt: inOneHour() });
    await Promise.all(requests);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("shares the upstream call between a login and concurrent requests", async () => {
    const verifier = new ExplorerSessionVerifier();
    const resolveSession = deferredCurrentSession();
    const expiresAt = inOneHour();

    const login = verifier.establish(permissionsApiUrl, "token");
    const request = verifier.verify(permissionsApiUrl, "token");
    resolveSession({ type: "user", expiresAt });

    await expect(login).resolves.toEqual({ expiresAt });
    await request;
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("shares a rejection between concurrent requests and verifies again afterwards", async () => {
    const verifier = new ExplorerSessionVerifier();
    const resolveSession = deferredCurrentSession();
    mockCurrentSession({ type: "user", expiresAt: inOneHour() });

    const requests = Array.from({ length: 3 }, () => verifier.verify(permissionsApiUrl, "token"));
    resolveSession({ type: "user", expiresAt: inOneHour(), oauthClientId: "some-dapp" });
    for (const request of requests) {
      await expect(request).rejects.toThrow(HttpException);
    }
    await verifier.verify(permissionsApiUrl, "token");

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("forgets the oldest verdict when full", async () => {
    const verifier = new ExplorerSessionVerifier(2);
    for (let i = 0; i < 4; i++) {
      mockCurrentSession({ type: "user", expiresAt: inOneHour() });
    }

    await verifier.verify(permissionsApiUrl, "token-a");
    await verifier.verify(permissionsApiUrl, "token-b");
    await verifier.verify(permissionsApiUrl, "token-c");
    await verifier.verify(permissionsApiUrl, "token-b");
    await verifier.verify(permissionsApiUrl, "token-a");

    expect(fetchSpy).toHaveBeenCalledTimes(4);
  });
});
