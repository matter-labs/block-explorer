<template>
  <Popover class="header-popover-container">
    <div class="header-wrap">
      <div class="header-container">
        <div class="logo-container">
          <router-link :to="{ name: 'home' }">
            <span class="sr-only">ZKsync</span>
            <img v-if="currentNetwork.logoUrl" :src="currentNetwork.logoUrl" />
            <zk-sync-era v-else-if="currentNetwork.groupId === 'era'" />
            <zk-sync-arrows-logo v-else />
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
          <WalletButton v-if="isPrividium" />
          <NetworkSwitch v-else />
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
          <div v-if="!isPrividium" class="socials-container">
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
      <img v-if="currentNetwork.heroBannerImageUrl" class="hero-image" :src="currentNetwork.heroBannerImageUrl" />
      <hero-arrows v-else class="hero-image" />
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
                <img v-if="currentNetwork.logoInverseUrl" :src="currentNetwork.logoInverseUrl" />
                <zk-sync v-else class="logo" />
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
              <WalletButton v-if="isPrividium" />
              <NetworkSwitch v-else />
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
            <div v-if="!isPrividium" class="mobile-socials-container">
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
import WalletButton from "../prividium/WalletButton.vue";

import LocaleSwitch from "@/components/LocaleSwitch.vue";
import NetworkSwitch from "@/components/NetworkSwitch.vue";
import DiscordIcon from "@/components/icons/DiscordIcon.vue";
import HeroArrows from "@/components/icons/HeroArrows.vue";
import TwitterIcon from "@/components/icons/TwitterIcon.vue";
import ZkSync from "@/components/icons/ZkSync.vue";
import ZkSyncArrowsLogo from "@/components/icons/ZkSyncArrowsLogo.vue";
import ZkSyncEra from "@/components/icons/ZkSyncEra.vue";

import useContext from "@/composables/useContext";
import useLocalization from "@/composables/useLocalization";
import useRuntimeConfig from "@/composables/useRuntimeConfig";

import { isAddress, isBlockNumber, isTransactionHash } from "@/utils/validators";
const { changeLanguage } = useLocalization();
const { t, locale } = useI18n({ useScope: "global" });
const route = useRoute();
const { currentNetwork, user } = useContext();
const runtimeConfig = useRuntimeConfig();

const isPrividium = runtimeConfig.appEnvironment === "prividium";
const isAdmin = computed(() => user.value.loggedIn && user.value.roles.includes("admin"));
const showAdminLinks = computed(() => !isPrividium || isAdmin.value);

const navigation = reactive([
  {
    label: computed(() => t("header.nav.documentation")),
    url: runtimeConfig.links.docsUrl,
  },
]);

const blockExplorerLinks = reactive([
  {
    label: computed(() => t("blocksView.title")),
    to: { name: "blocks" },
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

const toolsLinks = computed(() => {
  const links = [];

  if (showAdminLinks.value) {
    links.push({
      label: t("header.nav.apiDocs"),
      url: `${currentNetwork.value.apiUrl}/docs`,
    });
    links.push({
      label: t("header.nav.contractVerification"),
      to: { name: "contract-verification" },
    });
  }

  if (currentNetwork.value.bridgeUrl) {
    links.push({
      label: t("header.nav.bridge"),
      url: currentNetwork.value.bridgeUrl!,
    });
  }

  return links;
});

const socials = [
  { url: runtimeConfig.links.discordUrl, component: DiscordIcon },
  { url: runtimeConfig.links.xUrl, component: TwitterIcon },
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

    img,
    svg {
      @apply h-10;
    }
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
    @apply hidden items-stretch justify-end gap-x-4 md:flex-1 lg:flex lg:w-0;

    .language-switch {
      @apply mr-2;
    }

    .socials-container {
      @apply flex items-center justify-end;

      a {
        @apply ml-4 first:ml-0;
      }
    }
  }

  .hero-banner-container {
    @apply absolute left-0 top-full flex h-64 w-full items-end justify-end overflow-hidden bg-primary-900;

    .hero-image {
      @apply h-5/6 w-auto;
    }
  }

  .home-banner {
    @apply h-80;
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

        .popover-zksync-logo svg,
        .popover-zksync-logo img {
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
