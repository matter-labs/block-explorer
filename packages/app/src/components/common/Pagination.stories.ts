import vueRouter from "storybook-vue3-router";

import Pagination from "./Pagination.vue";

export default {
  title: "Common/Pagination",
  component: Pagination,
};

type Args = {
  activePage: number;
  totalItems: number;
  disabled?: boolean;
};

const Template = (args: Args) => ({
  components: { Pagination },
  setup() {
    return { args };
  },
  template: `
    <div class="bg-white p-5 flex justify-center">
      <Pagination v-bind="args" />
    </div>
  `,
});

export const Default = Template.bind({}) as unknown as { args: Args; decorators: unknown[] };
Default.args = {
  activePage: 1,
  totalItems: 50,
};
Default.decorators = [vueRouter()];

export const Start = Template.bind({}) as unknown as { args: Args; decorators: unknown[] };
Start.args = {
  activePage: 1,
  totalItems: 100,
};
Start.decorators = [vueRouter()];

export const Full = Template.bind({}) as unknown as { args: Args; decorators: unknown[] };
Full.args = {
  activePage: 5,
  totalItems: 100,
};
Full.decorators = [vueRouter()];

export const End = Template.bind({}) as unknown as { args: Args; decorators: unknown[] };
End.args = {
  activePage: 10,
  totalItems: 100,
};
End.decorators = [vueRouter()];

export const Disabled = Template.bind({}) as unknown as { args: Args; decorators: unknown[] };
Disabled.args = {
  activePage: 5,
  totalItems: 100,
  disabled: true,
};
Disabled.decorators = [vueRouter()];
