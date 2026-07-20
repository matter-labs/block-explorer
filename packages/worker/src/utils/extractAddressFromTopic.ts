export const extractAddressFromTopic = (topic: string): string | null => {
  if (topic?.length === 66 && topic.slice(2, 26) === "0".repeat(24)) {
    return "0x" + topic.slice(26);
  }
  return null;
};
