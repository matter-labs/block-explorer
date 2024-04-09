import { action, type HandlerFunction } from "@storybook/addon-actions";
import vueRouter from "storybook-vue3-router";

import TransactionsTable from "./Table.vue";

import ExecuteTx from "@/../mock/transactions/Execute.json";

import type { TransactionItem } from "@/composables/useTransaction";

export default {
  title: "Transactions/Table",
  component: TransactionsTable,
};

type Args = {
  transactions: TransactionItem[];
  loading: boolean;
  total?: number;
  isLoadMoreRequestPending?: boolean;
  isLoadMoreRequestFailed?: boolean;
  loadMore?: HandlerFunction;
  columns?: string[];
};

const Template = (args: Args) => ({
  components: {
    TransactionsTable,
  },
  setup() {
    return { ...args };
  },

  template: `
    <TransactionsTable 
      :loading="loading"
      :transactions="transactions" 
      :total="total" 
      @loadMore="loadMore"
      :is-load-more-request-pending="isLoadMoreRequestPending"
      :is-load-more-request-failed="isLoadMoreRequestFailed"
      :columns="columns">
    </TransactionsTable>
  `,
});

const transactions: TransactionItem[] = [ExecuteTx as TransactionItem];
const columns: string[] = ["status", "transactionHash", "age", "from", "direction", "to", "nonce", "value", "fee"];
const routes = vueRouter([
  { path: "/", name: "home", component: {} },
  { path: "/address", name: "address", component: {} },
  { path: "/tx", name: "transaction", component: {} },
]);

export const Default = Template.bind({}) as unknown as { args: Args; decorators: unknown[] };
Default.args = {
  transactions,
  loading: false,
  columns,
  total: transactions.length,
  isLoadMoreRequestFailed: false,
  isLoadMoreRequestPending: false,
  loadMore: action("LOAD MORE"),
};
Default.decorators = [routes];

export const WithFooter = Template.bind({}) as unknown as { args: Args; decorators: unknown[] };
WithFooter.args = {
  transactions,
  loading: false,
  columns,
  total: transactions.length + 1,
  isLoadMoreRequestFailed: false,
  isLoadMoreRequestPending: false,
  loadMore: action("LOAD MORE"),
};
WithFooter.decorators = [routes];

export const Loading = Template.bind({}) as unknown as { args: Args };
Loading.args = {
  transactions,
  loading: true,
  columns,
  total: transactions.length,
  isLoadMoreRequestFailed: false,
  isLoadMoreRequestPending: false,
  loadMore: action("LOAD MORE"),
};

export const SpecificColumns = Template.bind({}) as unknown as { args: Args; decorators: unknown[] };
SpecificColumns.args = {
  transactions,
  loading: false,
  total: transactions.length,
  columns: ["status", "transactionHash", "age", "from", "direction", "to", "nonce"],
  isLoadMoreRequestFailed: false,
  isLoadMoreRequestPending: false,
  loadMore: action("LOAD MORE"),
};
SpecificColumns.decorators = [routes];
