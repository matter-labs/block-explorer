import Status from "./Status.vue";

import type { TransactionStatus } from "@/composables/useTransaction";

export default {
  title: "Transactions/Status",
  component: Status,
};

type Args = {
  status: TransactionStatus;
};

const Template = (args: Args) => ({
  components: { Status },
  setup() {
    return { ...args };
  },
  template: `
    <Status :status="status" />
  `,
});

export const Included = Template.bind({}) as unknown as { args: Args };
Included.args = {
  status: "included",
};

export const Verified = Template.bind({}) as unknown as { args: Args };
Verified.args = {
  status: "verified",
};

export const Failed = Template.bind({}) as unknown as { args: Args };
Failed.args = {
  status: "failed",
};

export const Indexing = Template.bind({}) as unknown as { args: Args };
Indexing.args = {
  status: "indexing",
};
