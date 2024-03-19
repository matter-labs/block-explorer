<template>
  <Popover class="header-popover-container">
    <div class="header-wrap">
      <div class="header-container">
        <div class="logo-container">
          <router-link :to="{ name: 'home' }">
            <span class="sr-only">ZuluPrime</span>
            <ZuluTextLogo />
          </router-link>
        </div>
        <div class="burger-button-container">
          <PopoverButton class="burger-button">
            <span class="sr-only">Open menu</span>
            <MenuIcon class="h-6 w-6" aria-hidden="true" />
          </PopoverButton>
        </div>
        <PopoverGroup as="nav" class="navigation-container">
          <LinksPopover :label="t('header.nav.blockExplorer')" :items="blockExplorerLinks" />
          <LinksPopover :label="t('header.nav.tools')" :items="toolsLinks" />
          <a
            v-for="item in navigation"
            :key="item.label"
            :href="item.url"
            target="_blank"
            rel="noopener"
            class="navigation-link"
          >
            {{ item.label }}
          </a>
        </PopoverGroup>
        <div class="header-right-side">
          <NetworkSwitch />
          <LocaleSwitch
            :value="(locale as string)"
            @update:value="changeLanguage"
            :options="
              ['en'].map((value) => ({
                value,
                label: t(`locale.${value}`),
              }))
            "
          />
          <div class="socials-container">
            <a :href="social.url" target="_blank" rel="noopener" v-for="(social, index) in socials" :key="index">
              <component :is="social.component" />
            </a>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="hasContent"
      class="hero-banner-container"
      :class="[`${currentNetwork.name}`, { 'home-banner': route.path === '/' }]"
    >
      <!-- <hero-arrows class="hero-image" /> -->
    </div>
    <transition
      enter-active-class="duration-200 ease-out"
      enter-from-class="scale-95 opacity-0"
      enter-to-class="scale-100 opacity-100"
      leave-active-class="duration-100 ease-in"
      leave-from-class="scale-100 opacity-100"
      leave-to-class="scale-95 opacity-0"
    >
      <PopoverPanel focus class="header-mobile-popover">
        <div class="mobile-header-wrap">
          <div class="mobile-header-container">
            <div class="mobile-popover-navigation">
              <div class="popover-zksync-logo">
                <ZuluLogo class="logo" />
              </div>
              <div class="-mr-2">
                <PopoverButton class="close-popover-button">
                  <span class="sr-only">Close menu</span>
                  <XIcon class="h-6 w-6" aria-hidden="true" />
                </PopoverButton>
              </div>
            </div>
            <div class="mt-6">
              <nav class="mobile-navigation-container">
                <div class="mobile-navigation">
                  <LinksMobilePopover :items="blockExplorerLinks" />
                </div>
                <div class="mobile-navigation-divider"></div>
                <div class="mobile-navigation">
                  <LinksMobilePopover :items="toolsLinks" />
                </div>
                <div class="mobile-navigation-divider"></div>
                <div class="mobile-navigation">
                  <a
                    v-for="item in navigation"
                    :key="item.label"
                    :href="item.url"
                    target="_blank"
                    rel="noopener"
                    class="mobile-navigation-link"
                  >
                    <span class="mobile-navigation-label">
                      {{ item.label }}
                    </span>
                  </a>
                </div>
              </nav>
            </div>
            <div class="mobile-network-switch-container">
              <NetworkSwitch />
              <LocaleSwitch
                :value="(locale as string)"
                @update:value="changeLanguage"
                :options="
                  ['en', 'uk'].map((value) => ({
                    value,
                    label: t(`locale.${value}`),
                  }))
                "
              />
            </div>
            <div class="mobile-socials-container">
              <a :href="social.url" target="_blank" rel="noopener" v-for="(social, index) in socials" :key="index">
                <component :is="social.component" />
              </a>
            </div>
          </div>
        </div>
      </PopoverPanel>
    </transition>
  </Popover>
</template>

<script lang="ts" setup>
import { computed, reactive } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

import { Popover, PopoverButton, PopoverGroup, PopoverPanel } from "@headlessui/vue";
import { MenuIcon, XIcon } from "@heroicons/vue/outline";

import LinksMobilePopover from "./LinksMobilePopover.vue";
import LinksPopover from "./LinksPopover.vue";

import LocaleSwitch from "@/components/LocaleSwitch.vue";
import NetworkSwitch from "@/components/NetworkSwitch.vue";
import DiscordIcon from "@/components/icons/DiscordIcon.vue";
import TwitterIcon from "@/components/icons/TwitterIcon.vue";
import ZuluTextLogo from "@/components/icons/ZuluText.vue";
import ZuluLogo from "@/components/icons/Zulu.vue";

import useContext from "@/composables/useContext";
import useLocalization from "@/composables/useLocalization";

import { isAddress, isBlockNumber, isTransactionHash } from "@/utils/validators";
const { changeLanguage } = useLocalization();
const { t, locale } = useI18n({ useScope: "global" });
const route = useRoute();
const { currentNetwork } = useContext();

const navigation = reactive([
  {
    label: computed(() => t("header.nav.documentation")),
    // url: "https://docs.zksync.io/build/tooling/block-explorer/getting-started.html",// TODO write docs later
    url: "https://docs.zulunetwork.io/introduction/welcome-to-zulu",
  },
]);

const blockExplorerLinks = reactive([
  {
    label: computed(() => t("blocksView.title")),
    to: { name: "blocks" },
  },
  {
    label: computed(() => t("batches.title")),
    to: { name: "batches" },
  },
  {
    label: computed(() => t("transactionsView.title")),
    to: { name: "transactions" },
  },
  {
    label: computed(() => t("tokensView.title")),
    to: { name: "tokens" },
  },
]);

const links = [
  {
    label: computed(() => t("header.nav.apiDocs")),
    url: computed(() => `${currentNetwork.value.apiUrl}/docs`),
  },
  {
    label: computed(() => t("header.nav.contractVerification")),
    to: { name: "contract-verification" },
  },
];

if (currentNetwork.value.bridgeUrl) {
  links.push({
    label: computed(() => t("header.nav.bridge")),
    url: computed(() => currentNetwork.value.bridgeUrl!),
  });
}

const toolsLinks = reactive(links);

const socials = [
  { url: "https://discord.gg/ZVaQPjhxTG", component: DiscordIcon },
  { url: "https://twitter.com/zulu_network", component: TwitterIcon },
];

const hasContent = computed(() => {
  if (route.name !== "not-found" && !currentNetwork.value.maintenance) {
    if (route.params.hash) {
      return isTransactionHash(route.params.hash as string);
    }
    if (route.params.address) {
      return isAddress(route.params.address as string);
    }
    if (route.params.id) {
      return isBlockNumber(route.params.id as string);
    }
    return true;
  }
  return false;
});
</script>

<style lang="scss">
.header-popover-container {
  @apply relative bg-primary-900;
  .header-wrap {
    @apply container z-50;
  }
  .header-container {
    @apply flex items-center justify-between border-b border-neutral-500 py-4 md:space-x-10 lg:justify-start;
  }
  .logo-container {
    @apply flex justify-start;
  }
  .burger-button-container {
    @apply -my-2 -mr-2 lg:hidden;
    .burger-button {
      @apply inline-flex items-center justify-center rounded-md border border-neutral-400 p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500;
    }
  }
  .navigation-container {
    @apply hidden space-x-2 lg:flex xl:space-x-6;

    .dropdown-container {
      @apply relative;

      .navigation-link {
        @apply flex items-center;
        &.active {
          @apply bg-primary-800;

          .dropdown-icon {
            @apply -rotate-180;
          }
        }

        .dropdown-icon {
          @apply -mr-1 ml-2 h-4 w-4;
        }
      }
      .dropdown-items {
        @apply absolute left-0 mt-1 grid w-80 origin-top-left grid-flow-row gap-4 rounded-md bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none;

        .dropdown-item {
          @apply block rounded-md p-2 text-sm text-black no-underline;
          &.router-link-exact-active {
            @apply bg-primary-100;
          }
        }
      }
    }
    .navigation-link {
      @apply rounded-md py-2.5 text-base font-medium text-white no-underline hover:bg-primary-800 md:px-3.5;
    }

    .router-link-exact-active {
      @apply bg-neutral-900;
    }
  }
  .header-right-side {
    @apply hidden items-center justify-end md:flex-1 lg:flex lg:w-0;

    .network-switch {
      @apply mr-4;
    }
    .language-switch {
      @apply mr-6;
    }
    .socials-container {
      @apply flex items-center justify-end;

      a {
        @apply ml-4 first:ml-0;
      }
    }
  }
  .hero-banner-container {
    @apply absolute left-0 top-0 flex h-[20rem] w-full items-end justify-end overflow-hidden bg-primary-900;

    background: url(/images/banner-bg.png) center / cover no-repeat;

    &.goerli {
      @apply h-[25rem] md:h-[23rem] lg:h-[19rem];
    }

    .hero-image {
      @apply h-5/6 w-auto;
    }
  }
  .home-banner {
    @apply h-[25rem];

    &.goerli {
      @apply h-[30rem] md:h-[27rem] lg:h-[29rem];
    }
  }
}
.header-mobile-popover {
  @apply absolute inset-x-0 top-0 z-50 origin-top-right transform p-2 transition lg:hidden;

  .mobile-header-wrap {
    @apply divide-y-2 divide-neutral-50 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5;

    .mobile-header-container {
      @apply px-5 pb-6 pt-5;

      .mobile-popover-navigation {
        @apply flex items-center justify-between;

        .popover-zksync-logo svg {
          @apply h-[42px] w-[42px] text-black;
        }

        .close-popover-button {
          @apply inline-flex items-center justify-center rounded-md bg-white p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500;
        }
      }
      .mobile-navigation-container {
        @apply grid gap-y-4;

        .mobile-navigation-divider {
          @apply border-b border-neutral-300;
        }
        .mobile-navigation {
          @apply grid gap-y-4;

          .mobile-navigation-link {
            @apply flex items-center rounded-md p-2 no-underline hover:bg-neutral-50;
            &.router-link-exact-active {
              @apply bg-primary-100;
            }
            &.internal-link {
              .mobile-navigation-label {
                @apply font-normal;
              }
            }

            .mobile-navigation-label {
              @apply text-base font-medium leading-snug text-neutral-900;
            }
          }
        }
      }
      .mobile-network-switch-container {
        @apply mt-4 border-t border-neutral-300 pt-5;
      }
      .language-switch {
        @apply mt-3;
      }
      .mobile-socials-container {
        @apply mt-5 flex items-center justify-center border-t border-neutral-300 pt-6;

        a {
          @apply ml-4 first:ml-0;

          svg {
            @apply h-5 w-auto;

            path {
              @apply fill-primary-600;
            }
          }
        }
      }
    }
  }
}
</style>
