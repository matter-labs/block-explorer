import { setTimeout } from "timers/promises";

export default async (
  conditionPredicate: () => boolean,
  maxWaitTime = 30000,
  conditionCheckInterval = 5000
): Promise<void> => {
  const checkInterval = Math.min(maxWaitTime, conditionCheckInterval);
  const checkIterations = Math.ceil(maxWaitTime / checkInterval);

  for (let i = 0; i < checkIterations; i++) {
    if (conditionPredicate()) {
      return;
    }
    await setTimeout(checkInterval);
  }
};
