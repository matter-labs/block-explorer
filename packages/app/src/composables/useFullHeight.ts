import { computed, ref, watch } from "vue";

import { useMagicKeys } from "@vueuse/core";

export default () => {
  const isFullScreen = ref(false);
  const isMac = navigator.userAgent.indexOf("Mac OS X") != -1;

  const { Escape } = useMagicKeys({
    passive: false,
    onEventFired(e) {
      if (((e.metaKey && isMac) || (e.ctrlKey && !isMac)) && e.code === "KeyS") {
        e.preventDefault();
        isFullScreen.value = true;
      }
    },
  });

  const fullScreenHotkey = computed(() => {
    if (!isFullScreen.value) {
      return isMac ? "Cmd + S" : "Ctrl + S";
    }
    return "Esc";
  });

  watch(Escape, (escape) => {
    if (escape) {
      isFullScreen.value = false;
    }
  });

  return {
    isFullScreen,
    fullScreenHotkey,
  };
};
