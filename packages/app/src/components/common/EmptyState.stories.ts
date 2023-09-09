import EmptyState from "./EmptyState.vue";

export default {
  title: "Common/EmptyState",
  component: EmptyState,
};

type Args = {
  image: string;
  title: string;
  description: string;
};

const Template = (args: Args) => ({
  components: { EmptyState },
  setup() {
    return { ...args };
  },
  template: `
    <EmptyState>
    <template v-if="image" #image>
      <img :src="image" />
    </template>
    <template v-if="title" #title>
    {{ title }}
    </template>
    <template v-if="description" #description>
     {{ description }}
    </template>
    </EmptyState>
  `,
});

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = {
  image: "",
  title: "",
  description: "",
};

export const CustomSlots = Template.bind({}) as unknown as { args: Args };
CustomSlots.args = {
  image: "/images/empty-state/empty_balance.svg",
  title: "Title",
  description: "Description",
};
