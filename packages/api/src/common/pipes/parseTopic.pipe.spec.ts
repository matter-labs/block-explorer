import { BadRequestException } from "@nestjs/common";
import { ParseTopicPipe } from "./parseTopic.pipe";

describe("ParseTopicPipe", () => {
  const validTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

  let pipe: ParseTopicPipe;

  beforeEach(() => {
    pipe = new ParseTopicPipe();
  });

  describe("transform", () => {
    describe("when topic is not required", () => {
      it("allows null values for a single topic", () => {
        pipe = new ParseTopicPipe({ required: false });
        const result = pipe.transform(null);
        expect(result).toBeNull();
      });

      it("allows null values for topic list", () => {
        pipe = new ParseTopicPipe({ required: false, each: true });
        const result = pipe.transform(null);
        expect(result).toEqual(null);
      });
    });

    it("does not allow topic list when each flag is false", () => {
      pipe = new ParseTopicPipe({ required: false });
      expect(() => pipe.transform([validTopic])).toThrowError(new BadRequestException("Invalid topic format"));
    });

    it("does not allow single topic when each flag is true", () => {
      pipe = new ParseTopicPipe({ required: false, each: true });
      expect(() => pipe.transform(validTopic)).toThrowError(new BadRequestException("Invalid topic format"));
    });

    it("throws a BadRequestException if topic is not valid", () => {
      expect(() => pipe.transform("invalidTopicParam")).toThrowError(new BadRequestException("Invalid topic format"));
    });

    it("throws a BadRequestException if topic is missing 0x prefix", () => {
      expect(() => pipe.transform(validTopic.slice(2))).toThrowError(new BadRequestException("Invalid topic format"));
    });

    it("throws a BadRequestException if topic is too short", () => {
      expect(() => pipe.transform("0xddf252ad1be2c89b")).toThrowError(new BadRequestException("Invalid topic format"));
    });

    it("throws a BadRequestException if topic contains invalid hex characters", () => {
      expect(() => pipe.transform("0xzdf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef")).toThrowError(
        new BadRequestException("Invalid topic format")
      );
    });

    it("returns lower case topic when called with a single topic", () => {
      const topic = "0xDDF252AD1BE2C89B69C2B068FC378DAA952BA7F163C4A11628F55A4DF523B3EF";
      const transformedTopic = pipe.transform(topic);
      expect(transformedTopic).toBe(topic.toLowerCase());
    });

    it("returns lower case topics when called with topic list", () => {
      pipe = new ParseTopicPipe({ required: true, each: true });
      const topics = [
        "0xDDF252AD1BE2C89B69C2B068FC378DAA952BA7F163C4A11628F55A4DF523B3EF",
        "0x8C5BE1E5EBEC7D5BD14F71427D1E84F3DD0314C0F7B2291E5B200AC8C7C3B925",
      ];
      const transformedTopics = pipe.transform(topics);
      expect(transformedTopics).toEqual(topics.map((t) => t.toLowerCase()));
    });

    it("throws a BadRequestException with a custom message when it is provided", () => {
      pipe = new ParseTopicPipe({ required: true, errorMessage: "Custom error message" });
      expect(() => pipe.transform("invalidTopic")).toThrowError(new BadRequestException("Custom error message"));
    });
  });
});
