import HashLabel from "./HashLabel.vue";

import type { Placement } from "./HashLabel.vue";

export default {
  title: "Common/HashLabel",
  component: HashLabel,
};

type Args = {
  placement: Placement;
};

const Template = (args: Args) => ({
  components: { HashLabel },
  setup() {
    return { ...args };
  },
  template: `
    <HashLabel text="0x7fb0aabdf10d6a06a83eb842ad705dea57bcdf795f252687c01f277fef93b002" :placement="placement" class="block max-w-sm" />
  `,
});

export const Middle = Template.bind({}) as unknown as { args: Args };
Middle.args = {
  placement: "middle",
};

export const Left = Template.bind({}) as unknown as { args: Args };
Left.args = {
  placement: "left",
};

export const Right = Template.bind({}) as unknown as { args: Args };
Right.args = {
  placement: "right",
};
