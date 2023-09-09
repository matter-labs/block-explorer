import * as timers from "timers/promises";
import waitFor from "./waitFor";

describe("waitFor", () => {
  beforeEach(() => {
    jest.spyOn(timers, "setTimeout").mockResolvedValue(null);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("resolves as soon as conditionPredicate returns true", async () => {
    const conditionPredicate = jest
      .fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    await waitFor(conditionPredicate);

    expect(conditionPredicate).toBeCalledTimes(3);
    expect(timers.setTimeout).toBeCalledTimes(2);
    expect(timers.setTimeout).toBeCalledWith(5000);
  });

  it("resolves as soon as maxWaitTime is reached if conditionPredicate is falsy", async () => {
    const maxWaitTime = 100000;
    const conditionCheckInterval = 2000;
    const numberOfChecks = maxWaitTime / conditionCheckInterval;
    const conditionPredicate = jest.fn().mockReturnValue(false);
    await waitFor(conditionPredicate, maxWaitTime, conditionCheckInterval);

    expect(conditionPredicate).toBeCalledTimes(numberOfChecks);
    expect(timers.setTimeout).toBeCalledTimes(numberOfChecks);
    expect(timers.setTimeout).toBeCalledWith(conditionCheckInterval);
  });

  it("uses default maxWaitTime and conditionCheckInterval when not provided", async () => {
    const conditionPredicate = jest.fn().mockReturnValue(false);
    await waitFor(conditionPredicate);

    expect(conditionPredicate).toBeCalledTimes(6);
    expect(timers.setTimeout).toBeCalledTimes(6);
    expect(timers.setTimeout).toBeCalledWith(5000);
  });

  describe("when conditionCheckInterval > maxWaitTime", () => {
    it("resolves as soon as conditionCheckInterval is reached if conditionPredicate is falsy", async () => {
      const maxWaitTime = 1000;
      const conditionCheckInterval = 2000;
      const numberOfChecks = 1;
      const conditionPredicate = jest.fn().mockReturnValue(false);
      await waitFor(conditionPredicate, maxWaitTime, conditionCheckInterval);

      expect(conditionPredicate).toBeCalledTimes(numberOfChecks);
      expect(timers.setTimeout).toBeCalledTimes(numberOfChecks);
      expect(timers.setTimeout).toBeCalledWith(maxWaitTime);
    });
  });
});
