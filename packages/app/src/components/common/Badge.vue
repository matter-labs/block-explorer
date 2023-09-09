<template>
  <Tooltip
    :disabled="!tooltip"
    :class="[
      {
        'badge-with-content': $slots.precontent || $slots.postcontent,
      },
    ]"
  >
    <div v-if="$slots.precontent" class="badge-pre-content badge-additional-content">
      <slot name="precontent"></slot>
    </div>
    <div
      class="badge-container"
      :class="[
        `type-${type}`,
        `color-${color}`,
        `size-${size}`,
        { 'has-icon': !!$slots.icon },
        textColor ? `text-color-${textColor}` : '',
      ]"
      :data-testid="$testId.badge"
    >
      <div v-if="$slots.icon" class="badge-icon">
        <slot name="icon"></slot>
      </div>
      <span v-if="$slots.default" class="badge-content">
        <slot></slot>
      </span>
    </div>
    <div v-if="$slots.postcontent" class="badge-post-content badge-additional-content">
      <slot name="postcontent"></slot>
    </div>
    <template #content>
      {{ tooltip }}
    </template>
  </Tooltip>
</template>

<script setup lang="ts">
import Tooltip from "@/components/common/Tooltip.vue";

import type { PropType } from "vue";

defineProps({
  size: {
    type: String as PropType<"sm" | "md">,
    default: "sm",
  },
  type: {
    type: String as PropType<"label" | "pill">,
    default: "label",
  },
  color: {
    type: String as PropType<
      | "primary"
      | "secondary"
      | "neutral"
      | "dark-neutral"
      | "success"
      | "dark-success"
      | "warning"
      | "error"
      | "danger"
      | "progress"
    >,
    default: "neutral",
  },
  tooltip: {
    type: String,
  },
  textColor: {
    type: String as PropType<"neutral">,
  },
});
</script>

<style lang="scss">
.badge .badge-content {
  @apply pr-4;
}

.badge-additional-content {
  @apply absolute left-0 right-0 z-10 hidden border border-neutral-300 bg-white;
}

.badge-pre-content {
  @apply bottom-full rounded-t-md border-b-0 text-success-600;
}

.badge-post-content {
  @apply top-full rounded-b-md border-t-0 text-neutral-400;
}

.badge-container {
  @apply relative flex w-max items-center;

  &.color-primary {
    @apply bg-primary-200 text-primary-600;
  }

  &.color-secondary {
    @apply bg-secondary-200 text-secondary-600;
  }

  &.color-neutral {
    @apply bg-neutral-200 text-neutral-600;
  }

  &.color-dark-neutral {
    @apply bg-neutral-300 text-neutral-600;
  }

  &.color-success {
    @apply bg-success-200 text-success-600;
  }

  &.color-warning {
    @apply bg-warning-200 text-warning-600;
  }

  &.color-error {
    @apply bg-error-200 text-error-600;
  }

  &.color-danger {
    @apply bg-error-500 text-white;
  }

  &.color-progress {
    @apply bg-success-500 text-white;
  }

  &.color-dark-success {
    @apply bg-success-600 text-white;
  }

  &.text-color-neutral {
    @apply text-neutral-600;
  }

  &.type-label {
    @apply rounded font-bold capitalize;

    &.size-sm {
      @apply px-2 py-1 pr-2.5 text-xs;

      &.has-icon .badge-content {
        @apply ml-1 pr-0.5;
      }
    }

    &.size-md {
      @apply px-2.5 py-1 pr-3 text-sm;

      &.has-icon .badge-content {
        @apply ml-1.5 pr-1;
      }
    }
  }

  &.type-pill {
    @apply rounded-[6px];
    &.size-sm {
      @apply p-1 text-xs leading-none;

      &.has-icon .badge-content {
        @apply ml-1 pr-0.5;
      }
    }

    &.size-md {
      @apply p-2;

      &.has-icon .badge-content {
        @apply ml-1.5 pr-1;
      }
    }
  }

  &.size-sm {
    .badge-icon {
      @apply h-3 w-3;
    }
  }

  &.size-md {
    .badge-icon {
      @apply h-4 w-4;
    }
  }

  .badge-icon {
    @apply flex items-center justify-center;

    svg {
      @apply h-full w-auto;
    }
  }

  /* &.size-sm {
    @apply py-1 px-2 pr-2.5 text-xs;

    .badge-icon {
      @apply mr-1;
    }
  }
  &.size-md {
    @apply py-1 px-2.5 pr-3 text-sm;

    .badge-icon {
      @apply mr-1.5;
    }
  }

  &.color-primary {
    @apply bg-primary-200 text-primary-600;
    .badge-dot {
      @apply bg-primary-600;
    }
  }
  &.color-secondary {
    @apply bg-secondary-200 text-secondary-600;

    .badge-dot {
      @apply bg-secondary-600;
    }
  }
  &.color-neutral {
    @apply bg-neutral-300 text-neutral-600;

    .badge-dot {
      @apply bg-neutral-600;
    }
  }
  &.color-success {
    @apply bg-success-200 text-success-600;
    .badge-dot {
      @apply bg-success-600;
    }
  }
  &.color-warning {
    @apply bg-warning-200 text-warning-600;
    .badge-dot {
      @apply bg-warning-600;
    }
  }
  &.color-error {
    @apply bg-error-200 text-error-600;
    .badge-dot {
      @apply bg-error-600;
    }
  }

  .badge-dot {
    @apply h-1.5 w-1.5 rounded-full;
  } */
}

.badge-with-content {
  .badge-content {
    @apply pr-1;
  }
}
</style>
