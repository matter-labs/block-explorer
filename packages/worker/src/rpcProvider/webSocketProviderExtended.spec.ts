import { WebSocketProviderExtended } from "./webSocketProviderExtended";

let openCallback: () => void;
let closeCallback: () => void;
let pongCallback: () => void;

const expectedPongBack = 15000;
const checkInterval = 7000;

jest.useFakeTimers();

jest.mock("ethers", () => {
  return {
    providers: {
      WebSocketProvider: class {
        public _websocket;
        constructor() {
          this._websocket = {
            on: jest.fn().mockImplementation((event: string, callback: () => void) => {
              if (event === "open") {
                openCallback = callback;
              } else if (event === "close") {
                closeCallback = callback;
              } else if (event === "pong") {
                pongCallback = callback;
              }
            }),
            ping: jest.fn(),
            terminate: jest.fn(),
          };
        }
      },
    },
  };
});

jest.mock("@nestjs/common", () => {
  return {
    Logger: function () {
      return { debug: jest.fn(), error: jest.fn() };
    },
  };
});

describe("WebSocketProviderExtended", () => {
  let wsProvider: WebSocketProviderExtended;

  beforeEach(async () => {
    wsProvider = new WebSocketProviderExtended("test");
  });

  describe("open event", () => {
    it("changes the state to open", () => {
      openCallback();
      expect(wsProvider.getState()).toBe("open");
    });

    it("pings the socket", () => {
      openCallback();
      jest.advanceTimersByTime(checkInterval * 2);
      expect(wsProvider._websocket.ping).toHaveBeenCalledTimes(2);
    });

    it("if no reply terminates the socket", () => {
      openCallback();
      jest.advanceTimersByTime(checkInterval + expectedPongBack);
      expect(wsProvider._websocket.terminate).toHaveBeenCalledTimes(1);
    });

    it("if pong received does not terminate the socket", () => {
      openCallback();
      jest.advanceTimersByTime(checkInterval);
      pongCallback();
      jest.advanceTimersByTime(expectedPongBack);
      expect(wsProvider._websocket.terminate).toHaveBeenCalledTimes(0);
    });
  });

  describe("close event", () => {
    it("changes the state to closed", () => {
      closeCallback();
      expect(wsProvider.getState()).toBe("closed");
    });

    it("deactives handlers", () => {
      openCallback();
      jest.advanceTimersByTime(checkInterval);
      closeCallback();
      jest.advanceTimersByTime(checkInterval);
      expect(wsProvider._websocket.ping).toHaveBeenCalledTimes(1);
    });
  });

  it("state is connecting", () => {
    expect(wsProvider.getState()).toBe("connecting");
  });
});
