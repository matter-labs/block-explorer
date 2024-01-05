import { ResponseTransformInterceptor } from "./responseTransform.interceptor";
import { of } from "rxjs";
import { BigNumber } from "ethers";

const interceptor = new ResponseTransformInterceptor();

describe("ResponseTransformInterceptor", () => {
  const incomingData = [
    {
      block: {
        hash: "0x4ff36eaafc4ad3f777849432f8aa72e0304fa8ee4b454cb5c672ffa8ae6c996e",
        number: 14360,
        gasLimit: BigNumber.from("0xffffffff"),
        gasUsed: BigNumber.from("0x035436"),
        transactions: ["0x32c35e0bf5076712ea7982ae573da291d4aefddcb5a57fc8c5be9e96c593e9c2"],
      },
    },
    {
      block: {
        hash: "0x7c17a9583d454914d142575b0158881e6dc5ce004c8e14f3bd6a49e22a8c6ee7",
        number: 14361,
        gasLimit: BigNumber.from("0xffffffff"),
        gasUsed: BigNumber.from("0x02afe7"),
        transactions: ["0x3007860374485c9de9cf1dce1e285865b63ce15558e69d99d1a0300684b8e12e"],
      },
    },
  ];

  it("transforms the data", (done) => {
    expect.assertions(1);
    const interceptorObservable = interceptor.intercept({} as any, { handle: () => of(incomingData) });
    interceptorObservable.subscribe({
      next: (val) => {
        expect(val).toEqual([
          {
            block: {
              hash: "0x4ff36eaafc4ad3f777849432f8aa72e0304fa8ee4b454cb5c672ffa8ae6c996e",
              number: 14360,
              gasLimit: "4294967295",
              gasUsed: "218166",
              transactions: ["0x32c35e0bf5076712ea7982ae573da291d4aefddcb5a57fc8c5be9e96c593e9c2"],
            },
          },
          {
            block: {
              hash: "0x7c17a9583d454914d142575b0158881e6dc5ce004c8e14f3bd6a49e22a8c6ee7",
              number: 14361,
              gasLimit: "4294967295",
              gasUsed: "176103",
              transactions: ["0x3007860374485c9de9cf1dce1e285865b63ce15558e69d99d1a0300684b8e12e"],
            },
          },
        ]);
      },
      complete: () => done(),
    });
  });

  it("returns null for null incoming data", (done) => {
    expect.assertions(1);
    const interceptorObservable = interceptor.intercept({} as any, { handle: () => of(null) });
    interceptorObservable.subscribe({
      next: (val) => {
        expect(val).toBeNull();
      },
      complete: () => done(),
    });
  });
});
