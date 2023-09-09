<template>
  <TransitionRoot :show="opened" as="template">
    <Dialog as="div" class="popup-container">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="popup-background" />
      </TransitionChild>

      <div class="popup-content-container">
        <div class="popup-content-wrap">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <div>
              <slot />
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { Dialog, TransitionChild, TransitionRoot } from "@headlessui/vue";
defineProps({
  opened: {
    type: Boolean,
    default: false,
  },
});
</script>

<style lang="scss">
.popup-container {
  @apply relative z-[1000];
  .popup-background {
    @apply fixed inset-0 bg-black bg-opacity-25;
  }
  .popup-content-container {
    @apply fixed inset-0 overflow-y-auto;
    .popup-content-wrap {
      @apply flex min-h-full items-center justify-center p-4;
    }
  }
}
</style>
