import HomeView from "@/views/HomeView.vue";

export default [
  {
    path: "/",
    name: "home",
    component: HomeView,
    meta: {
      title: "document.home",
    },
  },
  {
    path: "/blocks/",
    name: "blocks",
    component: () => import("@/views/BlocksView.vue"),
    meta: {
      title: "blocksView.title",
    },
  },
  {
    path: "/block/:id",
    name: "block",
    component: () => import("@/views/BlockView.vue"),
    props: true,
    meta: {
      title: "blocks.table.block",
    },
  },
  {
    path: "/transactions/",
    name: "transactions",
    component: () => import("@/views/TransactionsView.vue"),
    props: true,
    meta: {
      title: "transactionsView.title",
    },
  },
  {
    path: "/tx/:hash",
    name: "transaction",
    component: () => import("@/views/TransactionView.vue"),
    props: true,
    meta: {
      title: "transactions.transaction",
    },
  },
  {
    path: "/address/:address",
    name: "address",
    component: () => import("@/views/AddressView.vue"),
    props: true,
    meta: {
      title: "addressView.title",
    },
  },
  {
    path: "/contracts/verify",
    name: "contract-verification",
    component: () => import("@/views/ContractVerificationView.vue"),
    meta: {
      title: "contractVerification.title",
    },
  },
  {
    path: "/tokenlist",
    name: "token-list",
    component: () => import("@/views/TokensView.vue"),
    meta: {
      title: "tokenListView.title",
    },
  },
  {
    path: "/tools/debugger",
    name: "debugger",
    component: () => import("@/views/DebuggerView.vue"),
    meta: {
      title: "debuggerTool.title",
    },
  },
  {
    path: "/batches/",
    name: "batches",
    component: () => import("@/views/BatchesView.vue"),
    meta: {
      title: "batches.title",
    },
  },
  {
    path: "/batch/:id",
    name: "batch",
    component: () => import("@/views/BatchView.vue"),
    props: true,
    meta: {
      title: "batches.batch",
    },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("@/views/NotFound.vue"),
    meta: {
      title: "document.home",
    },
  },
];
