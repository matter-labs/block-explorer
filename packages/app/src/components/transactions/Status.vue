<template>
  <div :class="[`transaction-status`, { 'single-badge-status': badges.length === 1 }]">
    <template v-for="(item, index) in badges" :key="index">
      <Badge
        type="pill"
        size="md"
        :data-testid="item.testId"
        :color="item.color"
        :tooltip="item.tooltip"
        :text-color="item.textColor"
        :class="[
          {
            badge: badges.length > 1 && index % 2 === 0,
            'status-badge': badges.length > 1 && index % 2 !== 0,
            'only-desktop': item.withDetailedPopup,
          },
        ]"
      >
        <template #precontent v-if="item.finishedStatuses?.length">
          <ol v-for="(finishedStatus, index) in item.finishedStatuses" :key="index">
            <li>
              <a
                :href="
                  currentNetwork.l1ExplorerUrl ? `${currentNetwork.l1ExplorerUrl}/tx/${finishedStatus.url}` : undefined
                "
                class="badge-status-link"
                target="_blank"
              >
                <span class="badge-status-link-text"><CheckIcon />{{ finishedStatus.text }}</span>
                <ExternalLinkIcon v-if="currentNetwork.l1ExplorerUrl" class="badge-status-link-icon" />
              </a>
            </li>
          </ol>
        </template>
        <template #icon v-if="item.icon">
          <component :is="item.icon" size="xs" :color="item.iconColor" />
        </template>
        <template #default v-if="item.text">
          <a
            v-if="item.url"
            :href="currentNetwork.l1ExplorerUrl ? `${currentNetwork.l1ExplorerUrl}/tx/${item.url}` : undefined"
            class="badge-status-link"
            target="_blank"
          >
            <span class="badge-status-link-text"><CheckIcon />{{ item.text }}</span>
            <ExternalLinkIcon v-if="currentNetwork.l1ExplorerUrl" class="badge-status-link-icon" />
          </a>
          <span v-else>{{ item.text }}</span>
        </template>
        <template #postcontent v-if="item.remainingStatuses?.length">
          <ol v-for="(remainingStatus, index) in item.remainingStatuses" :key="index">
            <li>
              <div class="badge-status-text">
                {{ remainingStatus.text }}
              </div>
            </li>
          </ol>
        </template>
      </Badge>
      <Badge
        v-if="item.withDetailedPopup"
        type="pill"
        size="md"
        :data-testid="item.testId"
        :color="item.color"
        :tooltip="item.tooltip"
        :text-color="item.textColor"
        class="badge-with-content"
        :class="[
          {
            badge: badges.length > 1 && index % 2 === 0,
            'status-badge': badges.length > 1 && index % 2 !== 0,
            'only-mobile': item.withDetailedPopup,
          },
        ]"
        @click="showStatusPopup"
      >
        <template #icon v-if="item.icon">
          <component :is="item.icon" size="xs" :color="item.iconColor" />
        </template>
        <template #default v-if="item.text">
          <span v-if="item.url" class="badge-status-link">
            <span class="badge-status-link-text"><CheckIcon />{{ item.text }}</span>
          </span>
          <span v-else>{{ item.text }}</span>
        </template>
      </Badge>
      <InfoTooltip v-if="item.infoTooltip" class="info-tooltip">
        {{ item.infoTooltip }}
      </InfoTooltip>
      <Popup :opened="statusPopupOpened" class="status-popup" v-if="item.withDetailedPopup">
        <OnClickOutside @trigger="closeStatusPopup">
          <div class="badge-status-popup">
            <div class="badge-status-popup-header">
              <h3 class="badge-status-popup-title">
                {{ t("transactions.statusComponent.ethereumNetwork") }}
              </h3>

              <button @click="closeStatusPopup" class="badge-status-popup-close"><XIcon /></button>
            </div>

            <div
              class="badge-status-popup-button status-active"
              v-for="(finishedStatus, index) in item.finishedStatuses"
              :key="index"
            >
              <a
                :href="
                  currentNetwork.l1ExplorerUrl ? `${currentNetwork.l1ExplorerUrl}/tx/${finishedStatus.url}` : undefined
                "
                class="badge-status-link"
                target="_blank"
              >
                <span class="badge-status-link-text"><CheckIcon />{{ finishedStatus.text }}</span>
                <ExternalLinkIcon v-if="currentNetwork.l1ExplorerUrl" class="badge-status-link-icon" />
              </a>
            </div>

            <div v-if="item.url" class="badge-status-popup-button status-active">
              <a
                :href="currentNetwork.l1ExplorerUrl ? `${currentNetwork.l1ExplorerUrl}/tx/${item.url}` : undefined"
                class="badge-status-link"
                target="_blank"
              >
                <span class="badge-status-link-text status-next"><CheckIcon />{{ item.text }}</span>
                <ExternalLinkIcon v-if="currentNetwork.l1ExplorerUrl" class="badge-status-link-icon" />
              </a>
            </div>
            <div v-else class="badge-status-popup-button status-current">
              <span class="badge-status-link-text"><Spinner></Spinner>{{ item.text }}</span>
            </div>

            <div
              class="badge-status-popup-button status-next"
              v-for="(remainingStatus, index) in item.remainingStatuses"
              :key="index"
            >
              {{ remainingStatus.text }}
            </div>
          </div>
        </OnClickOutside>
      </Popup>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType, ref } from "vue";
import { useI18n } from "vue-i18n";

import { CheckIcon, ExclamationCircleIcon, ExternalLinkIcon, XIcon } from "@heroicons/vue/outline";
import { OnClickOutside } from "@vueuse/components";

import Badge from "@/components/common/Badge.vue";
import InfoTooltip from "@/components/common/InfoTooltip.vue";
import Popup from "@/components/common/Popup.vue";
import Spinner from "@/components/common/Spinner.vue";

import useContext from "@/composables/useContext";

import type { TransactionStatus } from "@/composables/useTransaction";

const { currentNetwork } = useContext();

const props = defineProps({
  status: {
    type: String as PropType<TransactionStatus>,
    required: true,
  },
  commitTxHash: {
    type: [String, null] as PropType<string | null>,
    required: true,
  },
  proveTxHash: {
    type: [String, null] as PropType<string | null>,
    required: true,
  },
  executeTxHash: {
    type: [String, null] as PropType<string | null>,
    required: true,
  },
});

const statusPopupOpened = ref(false);

function closeStatusPopup() {
  statusPopupOpened.value = false;
}

function showStatusPopup() {
  statusPopupOpened.value = true;
}

const { t } = useI18n();

type RemainingStatus = {
  text: string;
};

type FinishedStatus = RemainingStatus & {
  url: string | null;
};

const finishedTxStatuses: FinishedStatus[] = [
  {
    text: t("transactions.statusComponent.sent"),
    url: props.commitTxHash,
  },
  {
    text: t("transactions.statusComponent.validated"),
    url: props.proveTxHash,
  },
  {
    text: t("transactions.statusComponent.executed"),
    url: props.executeTxHash,
  },
];

const remainingTxStatuses: RemainingStatus[] = [
  {
    text: t("transactions.statusComponent.validating"),
  },
  {
    text: t("transactions.statusComponent.executing"),
  },
];

const badges = computed(() => {
  const badgesArr: {
    color: "neutral" | "dark-neutral" | "success" | "dark-success" | "danger" | "progress";
    text?: string;
    tooltip?: string;
    infoTooltip?: string;
    icon?: unknown;
    testId: string;
    textColor?: "neutral";
    iconColor?: "dark-neutral";
    finishedStatuses?: FinishedStatus[];
    remainingStatuses?: RemainingStatus[];
    url?: string | null;
    withDetailedPopup?: boolean;
  }[] = [];
  if (props.status === "failed") {
    badgesArr.push({
      testId: "failed",
      color: "danger",
      text: t("transactions.statusComponent.failed"),
      icon: ExclamationCircleIcon,
    });
    return badgesArr;
  }

  badgesArr.push({
    testId: "l2-badge-title",
    color: "success",
    text: t("general.l2NetworkName"),
    textColor: "neutral",
  });
  badgesArr.push({
    testId: "l2-badge-value",
    color: "dark-success",
    text: t("transactions.statusComponent.processed"),
    icon: CheckIcon,
  });

  if (props.status === "indexing") {
    badgesArr.push({
      testId: "indexing",
      color: "neutral",
      text: t("transactions.statusComponent.indexing"),
      icon: Spinner,
    });
    return badgesArr;
  }

  badgesArr.push({
    testId: "l1-badge-title",
    color: props.status === "verified" ? "success" : "neutral",
    text: "",
    textColor: "neutral",
  });

  if (props.status === "verified") {
    badgesArr.push({
      testId: "verified",
      color: "dark-success",
      text: t("transactions.statusComponent.executed"),
      finishedStatuses: [finishedTxStatuses[0], finishedTxStatuses[1]],
      url: props.executeTxHash,
      withDetailedPopup: true,
    });
  } else {
    let textKey;
    const finishedStatuses: FinishedStatus[] = [];
    const remainingStatuses: RemainingStatus[] = [];

    if (props.status === "committed") {
      textKey = "validating";
      finishedStatuses.push(finishedTxStatuses[0]);
      remainingStatuses.push(remainingTxStatuses[1]);
    } else if (props.status === "proved") {
      textKey = "executing";
      finishedStatuses.push(finishedTxStatuses[0]);
      finishedStatuses.push(finishedTxStatuses[1]);
    } else {
      textKey = "sending";
      remainingStatuses.push(remainingTxStatuses[0]);
      remainingStatuses.push(remainingTxStatuses[1]);
    }

    badgesArr.push({
      testId: "l1-badge-value",
      color: "dark-neutral",
      iconColor: "dark-neutral",
      text: t(`transactions.statusComponent.${textKey}`),
      icon: Spinner,
      finishedStatuses,
      remainingStatuses,
      withDetailedPopup: true,
    });
  }
  return badgesArr;
});
</script>

<style lang="scss">
.popup-container.status-popup .popup-content-wrap {
  @apply items-end;

  > div {
    @apply w-full;
  }
}

.transaction-status {
  .badge-with-content {
    .badge-container:not(.has-icon) {
      @apply p-0;

      .badge-status-link {
        @apply p-2;

        &:hover .badge-status-link-icon {
          @apply text-inherit;
        }
      }
    }

    .badge-status-link-icon {
      @apply hidden;
    }

    a,
    a:hover {
      @apply text-inherit;
    }

    &.only-desktop:hover {
      .badge-status-link-icon {
        @apply block;
      }

      .badge-container {
        @apply min-w-[7.5rem] rounded-none;

        &:first-child {
          @apply rounded-t-md;
        }

        &:last-child {
          @apply rounded-b-md;
        }
      }

      .badge-content {
        @apply w-full pr-0;
      }

      .badge-additional-content {
        @apply block;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.only-mobile {
  @apply block md:hidden;
}
.only-desktop {
  @apply hidden md:block;
}

.transaction-status {
  &.single-badge-status {
    @apply flex items-center;
  }

  .badge {
    @apply float-left clear-both my-1 md:clear-none md:my-0;
  }

  .info-tooltip {
    @apply ml-1;
  }

  .status-badge {
    @apply relative float-left my-1 -ml-4 mr-3 md:my-0;
  }
}

.badge-additional-content {
  .badge-status-link-icon {
    @apply text-neutral-600;
  }

  .badge-status-link {
    @apply p-2;
  }
}

.badge-post-content {
  .badge-status-text {
    @apply p-2 pl-7;
  }
}

.badge-status-link {
  @apply flex items-center justify-between no-underline focus:outline-none;

  svg {
    @apply h-4 w-4;
  }

  &:hover .badge-status-link-icon {
    @apply text-black;
  }
}

.badge-status-link-text {
  @apply flex items-center;

  svg {
    @apply mr-1;
  }
}

/*
.popup-container.status-popup .popup-content-wrap {
  @apply items-end;

  > div {
    @apply w-full;
  }
}
*/

.badge-status-popup {
  @apply mx-auto rounded-lg bg-white p-4;
}

.badge-status-popup-header {
  @apply mb-4 flex items-center justify-between;
}

.badge-status-popup-close {
  @apply rounded-md bg-neutral-200 p-1.5 focus:outline-none;

  svg {
    @apply h-6 w-6;
  }

  &:hover {
    @apply text-black;
  }
}
.badge-status-popup-title {
  @apply text-xl font-normal text-neutral-600;
}

.badge-status-popup-button {
  @apply mb-2 rounded-md bg-neutral-200 text-sm text-neutral-600;

  &::after {
    @apply absolute left-5 top-full h-2 w-[2px] bg-neutral-200 content-[''];
  }
  &.status-active {
    @apply text-success-600;

    &::after {
      @apply bg-success-600;
    }
  }
  &.status-current {
    @apply p-2 text-neutral-600;
  }

  &.status-next {
    @apply p-2 pl-9 text-neutral-500;
  }

  &:last-child {
    @apply mb-0;

    &::after {
      @apply content-none;
    }
  }

  .badge-status-link {
    @apply p-2 text-inherit;

    &:hover {
      @apply text-inherit;

      .badge-status-link-icon {
        @apply text-black;
      }
    }
  }

  .badge-status-link-icon {
    @apply mr-0 text-neutral-600;
  }

  svg,
  .spinner-icon {
    @apply mr-2 h-5 w-5;
  }
}
</style>
