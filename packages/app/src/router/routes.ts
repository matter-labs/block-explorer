import useSearch from "@/composables/useSearch";

import type { RouteLocation, RouteRecordRaw } from "vue-router";

import HomeView from "@/views/HomeView.vue";
import LoginView from "@/views/LoginView.vue";
const { getSearchRoute } = useSearch();

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
    path: "/login",
    name: "login",
    component: LoginView,
    meta: {
      title: "Login",
      requiresAuth: false,
    },
  },
  {
    path: "/reviewing-permissions",
    name: "reviewing-permissions",
    component: ReviewingPermissionsView,
    meta: {
      title: "Reviewing Permissions",
      requiresAuth: false,
    },
  },
  {
    path: "/not-authorized",
    name: "not-authorized",
    component: NotAuthorizedView,
    meta: {
      title: "Not Authorized",
      requiresAuth: false,
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
    path: "/token/:address",
    name: "token",
    component: () => import("@/views/TokenView.vue"),
    props: true,
    meta: {
      title: "tokenView.title",
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
    redirect: "tokens",
  },
  {
    path: "/tokens",
    name: "tokens",
    component: () => import("@/views/TokensView.vue"),
    meta: {
      title: "tokensView.title",
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
    path: "/search",
    name: "search",
    redirect: (to: RouteLocation) => {
      const searchQueryParam = to.query?.q instanceof Array ? to.query.q.at(-1) : to.query?.q;
      if (searchQueryParam) {
        const searchRoute = getSearchRoute(searchQueryParam);
        if (searchRoute) {
          return { name: searchRoute.routeName, params: searchRoute.routeParam, query: null };
        }
      }
      return { name: "not-found", query: null };
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
] as RouteRecordRaw[];
