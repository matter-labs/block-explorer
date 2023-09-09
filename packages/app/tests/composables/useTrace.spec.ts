import { computed, nextTick, ref } from "vue";

import { describe, expect, it } from "vitest";

import useTrace, { type TraceFile, useTraceNavigation } from "@/composables/useTrace";

describe("useTrace:", () => {
  it("creates useTrace composable", () => {
    const result = useTrace();

    expect(result.upload).toBeDefined();
    expect(result.file).toBeDefined();
    expect(result.hasError).toBeDefined();
  });

  describe("upload:", () => {
    it("sets hasError to true when failed to parse file", async () => {
      const file = new File(["Hello World"], "foo.json", {
        type: "application/json",
      });

      const { upload, hasError } = useTrace();

      await upload([file]).catch(() => null);

      expect(hasError.value).toEqual(true);
    });

    it("sets hasError to false when file parsed successfully", async () => {
      const { upload, hasError } = useTrace();

      await upload([
        new File(
          ['{"sources":{"0x00":{"assembly_code":"\\t.text\\n\\t.file\\t\\"HelloWorld.sol\\"\\nHello\\nWorld\\n"}}}'],
          "foo.json",
          {
            type: "application/json",
          }
        ),
      ]).catch(() => null);

      expect(hasError.value).toEqual(false);
    });

    it("sets file when file parsed successfully", async () => {
      const { upload, file } = useTrace();

      await upload([
        new File(
          ['{"sources":{"0x00":{"assembly_code":"\\t.text\\n\\t.file\\t\\"HelloWorld.sol\\"\\nHello\\nWorld\\n"}}}'],
          "foo.json",
          {
            type: "application/json",
          }
        ),
      ]).catch(() => null);

      expect(file.value).toEqual({
        sources: {
          "0x00": {
            assembly_code: '\t.text\n\t.file\t"HelloWorld.sol"\nHello\nWorld\n',
          },
        },
      });
    });
  });
});

describe("useTraceNavigation:", () => {
  it("creates useTraceNavigation composable", () => {
    const file = computed<TraceFile | null>(() => null);
    const result = useTraceNavigation(file);

    expect(result.activeStep).toBeDefined();
    expect(result.index).toBeDefined();
    expect(result.total).toBeDefined();
    expect(result.goTo).toBeDefined();
    expect(result.navigateToLine).toBeDefined();
    expect(result.getActiveLines).toBeDefined();
    expect(result.activeLines).toBeDefined();
  });

  it("returns null index by default", () => {
    const file = computed<TraceFile | null>(() => ({
      sources: { "0x": { active_lines: [], assembly_code: "", pc_line_mapping: { 1: 5 } } },
      steps: [
        {
          pc: 1,
          contract_address: "0x",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any,
    }));
    const result = useTraceNavigation(file);
    expect(result.index.value).toEqual(null);
  });

  it("returns total number of steps", () => {
    const file = computed<TraceFile | null>(() => ({
      sources: { "0x": { active_lines: [], assembly_code: "", pc_line_mapping: [] } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      steps: [{} as any, {} as any],
    }));
    const result = useTraceNavigation(file);
    expect(result.total.value).toEqual(2);
  });

  it("navigates to next step", () => {
    const file = computed<TraceFile | null>(() => ({
      sources: { "0x": { active_lines: [], assembly_code: "", pc_line_mapping: [] } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      steps: [{} as any, {} as any],
    }));
    const result = useTraceNavigation(file, { index: 0 });
    result.goTo(result.index.value! + 1);
    expect(result.index.value).toEqual(1);
  });

  it("navigates to previous step", () => {
    const file = computed<TraceFile | null>(() => ({
      sources: { "0x": { active_lines: [], assembly_code: "", pc_line_mapping: [] } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      steps: [{} as any, {} as any],
    }));
    const result = useTraceNavigation(file, { index: 1 });
    result.goTo(result.index.value! - 1);
    expect(result.index.value).toEqual(0);
  });

  it("does not go below 0", () => {
    const file = computed<TraceFile | null>(() => ({
      sources: { "0x": { active_lines: [], assembly_code: "", pc_line_mapping: [] } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      steps: [{} as any, {} as any],
    }));
    const result = useTraceNavigation(file);
    result.goTo(-1);
    expect(result.index.value).toEqual(0);
  });

  it("does not go above total length", () => {
    const file = computed<TraceFile | null>(() => ({
      sources: { "0x": { active_lines: [], assembly_code: "", pc_line_mapping: [] } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      steps: [{} as any, {} as any],
    }));
    const result = useTraceNavigation(file, { index: 1 });
    result.goTo(result.index.value! + 1);
    expect(result.index.value).toEqual(1);
  });

  it("resets navigation index when file changed", async () => {
    const file = ref<TraceFile | null>({
      sources: { "0x": { active_lines: [], assembly_code: "", pc_line_mapping: [] } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      steps: [{} as any, {} as any],
    });

    const result = useTraceNavigation(
      computed<TraceFile | null>(() => file.value),
      { index: 2 }
    );

    file.value = {
      sources: { "0x": { active_lines: [], assembly_code: "", pc_line_mapping: [] } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      steps: [{} as any, {} as any, {} as any],
    };

    await nextTick();
    expect(result.index.value).toEqual(null);
  });
  it("navigates to a specific line", () => {
    const file = computed<TraceFile | null>(() => ({
      sources: { "0x": { active_lines: [], assembly_code: "", pc_line_mapping: { 1: 1, 2: 2, 3: 3 } } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      steps: [
        {
          pc: 1,
          contract_address: "0x",
        },
        {
          pc: 2,
          contract_address: "0x",
        },
        {
          pc: 3,
          contract_address: "0x",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any,
    }));
    const result = useTraceNavigation(file);
    result.navigateToLine({ line: 3, address: "0x" });

    expect(result.index.value).toEqual(2);
  });
  it("returns active lines", () => {
    const file = computed<TraceFile | null>(() => ({
      sources: { "0x": { active_lines: [2, 3, 5], assembly_code: "", pc_line_mapping: { 1: 1, 2: 2, 3: 3 } } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      steps: [
        {
          pc: 1,
          contract_address: "0x",
        },
        {
          pc: 2,
          contract_address: "0x",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any,
    }));
    const result = useTraceNavigation(file, { index: 1 });
    result.getActiveLines();
    expect(result.activeLines.value).toEqual({ "0x": [2, 3] });
  });
});
