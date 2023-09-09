import MetadataBlock from "./MetadataBlock.vue";

import type { TraceFile, TraceStep } from "@/composables/useTrace";

export default {
  title: "Debugger/MetadataBlock",
  component: MetadataBlock,
};

type Args = {
  metadata: TraceStep;
  file: TraceFile;
};

const Template = (args: Args) => ({
  components: { MetadataBlock },
  setup() {
    return { ...args };
  },
  template: `<MetadataBlock :metadata="metadata" :file="file"/>`,
});

const metadata = {
  contract_address: "0xdeadbeef00000000000000000000000000000000",
  registers: [
    "0x0",
    "0x4",
    "0x0",
    "0xffffff",
    "0x0",
    "0x0",
    "0x0",
    "0x0",
    "0x0",
    "0x0",
    "0x0",
    "0x0",
    "0x0",
    "0x0",
    "0x0",
  ],
  pc: 1,
  sp: 0,
  set_flags: ["eq"],
  skip_cycle: false,
  code_page_index: 4,
  heap_page_index: 5,
  stack_page_index: 12,
  calldata_page_index: 3,
  returndata_page_index: 0,
  register_interactions: { "1": "Write", "4": "Read" },
  memory_interactions: [
    {
      memory_type: "heap",
      page: 5,
      address: 524286,
      value: "0000000000000000000000000000000000000000000000000000000000000000",
      direction: "Read",
    },
    {
      memory_type: "heap",
      page: 5,
      address: 524286,
      value: "0000000000000000000000000000000000000000000000000000000000000004",
      direction: "Write",
    },
  ],
  memory_snapshots: [],
  error: null,
};

const file = {
  sources: {
    "0x00": {
      assembly_code: `\t.text\t.file\t"HelloWorld.sol"Hello\nWorld`,
      active_lines: [],
      pc_line_mapping: {},
    },
  },
  steps: [],
};

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = {
  metadata,
  file,
};
