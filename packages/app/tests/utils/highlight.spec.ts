import { describe, expect, it } from "vitest";

import { highlight } from "@/utils/highlight";

describe("highlight:", () => {
  it("highlights search text", () => {
    expect(highlight("any text", "te")).toEqual('any <mark class="mark">te</mark>xt');
  });

  it("highlights only a single hit", () => {
    expect(highlight("any text any text", "te")).toEqual('any <mark class="mark">te</mark>xt any text');
  });

  it("highlights in html", () => {
    expect(highlight("any <span>text</span>", "text")).toEqual(
      'any &lt;span&gt;<mark class="mark">text</mark>&lt;/span&gt;'
    );
  });

  it("escapes special html symbols", () => {
    expect(highlight(`any <>"'& text`, "text")).toEqual('any &lt;&gt;&quot;&#039;&amp; <mark class="mark">text</mark>');
  });

  it("returns original text when search is null", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(highlight("any text", null as any)).toEqual("any text");
  });

  it("returns original text when search is undefined", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(highlight("any text", undefined as any)).toEqual("any text");
  });

  it("returns original text when nothing found", () => {
    expect(highlight("any text", "ooops")).toEqual("any text");
  });

  it("handles search in different text case", () => {
    expect(highlight("any TEXT", "te")).toEqual('any <mark class="mark">TE</mark>XT');
  });

  it("handles multiple words", () => {
    expect(highlight("any random text", "random te")).toEqual('any <mark class="mark">random te</mark>xt');
  });
});
