import MemoryBadge from "./MemoryBadge.vue";

export default {
  title: "Debugger/MemoryBadge",
  component: MemoryBadge,
};

type Args = {
  text: string;
  memoryDirection: string;
  defaultColor: string;
};

const Template = (args: Args) => ({
  components: { MemoryBadge },
  setup() {
    return { ...args };
  },
  template: `<div class="inline-block text-center"><MemoryBadge class="block max-w-sm !w-[60px] py-0 px-1" :text="text" :memory-direction="memoryDirection" :default-color="defaultColor" /></div>`,
});

export const ReadMemory = Template.bind({}) as unknown as { args: Args };
ReadMemory.args = {
  text: "0x0",
  memoryDirection: "Read",
  defaultColor: "transparent",
};
export const WriteMemory = Template.bind({}) as unknown as { args: Args };
WriteMemory.args = {
  text: "0x0",
  memoryDirection: "Write",
  defaultColor: "transparent",
};
