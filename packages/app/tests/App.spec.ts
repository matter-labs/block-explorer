import { computed } from "vue";
import { createI18n } from "vue-i18n";

import { describe, expect, it, vi } from "vitest";

import { mount } from "@vue/test-utils";

const useTitleMock = vi.fn();
vi.mock("@vueuse/core", () => {
  return {
    useTitle: useTitleMock,
    useStorage: vi.fn(() => computed(() => false)),
  };
});

// Mock vue-router
vi.mock("vue-router", () => ({
  useRoute: () => ({
    name: "test-route",
    path: "/",
    fullPath: "/",
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const maintenanceMock = vi.fn(() => false);
vi.mock("@/composables/useContext", () => {
  return {
    default: () => ({
      isReady: computed(() => true),
      currentNetwork: computed(() => ({ maintenance: maintenanceMock() })),
      user: computed(() => ({ loggedIn: false })),
    }),
  };
});
vi.mock("@/composables/useLocalization", () => {
  return {
    default: () => ({
      setup: vi.fn(),
    }),
  };
});
vi.mock("@/composables/useRouteTitle", () => {
  return {
    default: () => ({
      title: computed(() => "Page title"),
    }),
  };
});
vi.mock("@/composables/useEnvironmentConfig", () => {
  return {
    default: () => ({
      prividium: computed(() => false),
    }),
  };
});

import enUS from "@/locales/en.json";

import App from "@/App.vue";
import $testId from "@/plugins/testId";
import MaintenanceView from "@/views/MaintenanceView.vue";

describe("App:", () => {
  const i18n = createI18n({
    locale: "en",
    allowComposition: true,
    messages: {
      en: enUS,
    },
  });

  const global = {
    stubs: ["the-header", "the-footer", "router-view", "MaintenanceView"],
    plugins: [i18n, $testId],
  };

  it("uses title", async () => {
    const mock = useTitleMock.mockClear();
    mount(App, {
      global,
    });
    expect(mock).toHaveBeenCalledOnce();
    mock.mockRestore();
  });
  it("shows maintenance when network maintenance is true", () => {
    const mockMaintenance = maintenanceMock.mockReturnValue(true);
    const wrapper = mount(App, {
      global,
    });

    expect(wrapper.findComponent(MaintenanceView).exists()).toBe(true);
    mockMaintenance.mockRestore();
  });
  it("shows router-view when network maintenance is false", () => {
    const wrapper = mount(App, {
      global,
    });
    expect(wrapper.findComponent("router-view-stub").exists()).toBe(true);
  });
});
