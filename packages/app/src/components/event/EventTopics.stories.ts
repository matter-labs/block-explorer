import EventTopics from "@/components/event/EventTopics.vue";

import type { InputType } from "@/composables/useEventLog";
import type { TransactionEvent } from "@/composables/useEventLog";

export default {
  title: "components/Event/EventTopics",
  component: EventTopics,
};

type Args = {
  topics: string[];
  event?: TransactionEvent;
  popoverPlacement?: "top" | "bottom";
  showCopyButton?: boolean;
};

const topics: string[] = [
  "0x5548c837ab068cf56a2c2479df0882a4922fd203edb7517321831d95078c5f62",
  "0x0000000000000000000000001e98677895078dd55bf59236b8bc477ab4e962c3",
  "0x000000000000000000000000a2faa945acadaed59797c40f906f9936906b9621",
];

const event: TransactionEvent = {
  name: "Deposit",
  inputs: [
    {
      name: "user",
      type: "address" as InputType,
      value: "0x1e98677895078dd55bf59236B8bC477AB4e962c3",
    },
    {
      name: "lpToken",
      type: "string" as InputType,
      value: "0xA2fAA945acaDaed59797C40F906F9936906b9621",
    },
  ],
};

const Template = (args: Args) => ({
  components: { EventTopics },
  setup() {
    return { args };
  },
  template: `<EventTopics v-bind="args" />`,
});

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = {
  topics,
};

export const FilteredTypes = Template.bind({}) as unknown as { args: Args };
FilteredTypes.args = {
  topics,
  event,
};

export const LastItem = Template.bind({}) as unknown as { args: Args };
LastItem.args = {
  topics,
  popoverPlacement: "top",
};

export const WithCopyButton = Template.bind({}) as unknown as { args: Args };
WithCopyButton.args = {
  topics,
  event,
  showCopyButton: true,
};
