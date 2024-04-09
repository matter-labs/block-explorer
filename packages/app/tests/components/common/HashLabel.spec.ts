import { describe, expect, it } from "vitest";

import { render } from "@testing-library/vue";
import { mount } from "@vue/test-utils";

import HashLabel, { shortenFitText } from "@/components/common/HashLabel.vue";

describe("HashLabel:", () => {
  it("correctly renders value", async () => {
    const { getAllByText } = render(HashLabel, {
      props: {
        text: "0xaBEA9132b05A70803a4E85094fD0e1800777fBEF",
      },
    });

    expect(getAllByText("0xaBEA9132b05A70803a4E85094fD0e1800777fBEF")).toBeTruthy();
  });

  it("does not render icon container when default slot is not provided", () => {
    const { container } = render(HashLabel, {
      props: {
        text: "0xaBEA9132b05A70803a4E85094fD0e1800777fBEF",
      },
    });

    expect(container.querySelector(".icon")?.innerHTML).not.toBeDefined();
  });

  it("text is updated on text property update", async () => {
    const { rerender, getAllByText } = render(HashLabel, {
      props: {
        text: "0x286fa01d8cbcee191d6cf0ada2f1684ff763b4bf7e7daf58aa4f73d34b1a7a39",
      },
    });

    await rerender({
      text: "0xaBEA9132b05A70803a4E85094fD0e1800777fBEF",
    });

    expect(getAllByText("0xaBEA9132b05A70803a4E85094fD0e1800777fBEF")).toBeTruthy();
  });

  describe("shortenFitText:", () => {
    it("correctly cuts text that doesn't fit", () => {
      expect(
        shortenFitText("0x286fa01d8cbcee191d6cf0ada2f1684ff763b4bf7e7daf58aa4f73d34b1a7a39", "middle", 505, 8.5)
      ).toEqual("0x286fa01d8cbcee191d6cf0ad...bf7e7daf58aa4f73d34b1a7a39");
    });
    it("correctly cuts text if rootWidth and singleCharacterWidth isn't specified", () => {
      expect(shortenFitText("0x286fa01d8cbcee191d6cf0ada2f1684ff763b4bf7e7daf58aa4f73d34b1a7a39", "middle")).toEqual(
        "0x286fa01d8cb...f73d34b1a7a39"
      );
    });
    it("correctly returns text that fully fits", () => {
      const text = "0x286fa01d8cbcee191d6cf0ada2f1684ff763b4bf7e7daf58aa4f73d34b1a7a39";
      const letterWidth = 8;
      expect(
        shortenFitText(
          "0x286fa01d8cbcee191d6cf0ada2f1684ff763b4bf7e7daf58aa4f73d34b1a7a39",
          "middle",
          text.length * letterWidth,
          letterWidth
        )
      ).toEqual("0x286fa01d8cbcee191d6cf0ada2f1...63b4bf7e7daf58aa4f73d34b1a7a39");
    });
  });

  it("renders default empty slot", () => {
    const { container } = render(HashLabel, {
      props: {
        text: "0xaBEA9132b05A70803a4E85094fD0e1800777fBEF",
      },
    });

    expect(container.querySelector(".icon")?.innerHTML).toBeFalsy;
  });

  it("renders icon slot", () => {
    const { container } = render(HashLabel, {
      props: {
        text: "0xaBEA9132b05A70803a4E85094fD0e1800777fBEF",
      },
      slots: {
        default: {
          template: "Icon slot",
        },
      },
    });

    expect(container.querySelector(".icon")?.innerHTML).toBe("Icon slot");
  });

  it("correctly renders shortenFitText when subtraction props exist", async () => {
    const wrapper = mount(HashLabel, {
      props: {
        text: "0xaBEA9132b05A70803a4E85094fD0e1800777fBEF",
        subtraction: 5,
      },
    });

    expect(
      shortenFitText(
        "0x286fa01d8cbcee191d6cf0ada2f1684ff763b4bf7e7daf58aa4f73d34b1a7a39",
        "middle",
        505,
        8.5,
        wrapper.vm.subtraction
      )
    ).toEqual("0x286fa01d8cbcee191d6cf0...7e7daf58aa4f73d34b1a7a39");
  });
  it("correctly renders shortenFitText if placement is left", async () => {
    const wrapper = mount(HashLabel, {
      props: {
        text: "0xaBEA9132b05A70803a4E85094fD0e1800777fBEF",
        placement: "left",
      },
    });

    expect(
      shortenFitText(
        "0x286fa01d8cbcee191d6cf0ada2f1684ff763b4bf7e7daf58aa4f73d34b1a7a39",
        wrapper.vm.placement,
        500,
        8.5
      )
    ).toEqual("0x286fa01d8cbcee191d6cf0ad...7a39");
  });
  it("correctly renders shortenFitText if placement is right", async () => {
    const wrapper = mount(HashLabel, {
      props: {
        text: "0xaBEA9132b05A70803a4E85094fD0e1800777fBEF",
        placement: "right",
      },
    });

    expect(
      shortenFitText(
        "0x286fa01d8cbcee191d6cf0ada2f1684ff763b4bf7e7daf58aa4f73d34b1a7a39",
        wrapper.vm.placement,
        500,
        8.5
      )
    ).toEqual("0x286...bf7e7daf58aa4f73d34b1a7a39");
  });
  it("correctly renders shortenFitText if placement is middle", async () => {
    const wrapper = mount(HashLabel, {
      props: {
        text: "0xaBEA9132b05A70803a4E85094fD0e1800777fBEF",
        placement: "middle",
      },
    });

    expect(
      shortenFitText(
        "0x286fa01d8cbcee191d6cf0ada2f1684ff763b4bf7e7daf58aa4f73d34b1a7a39",
        wrapper.vm.placement,
        500,
        8.5
      )
    ).toEqual("0x286fa01d8cbcee191d6cf0ad...bf7e7daf58aa4f73d34b1a7a39");
  });
});
