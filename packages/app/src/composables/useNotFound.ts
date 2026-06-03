import { type Ref, watch } from "vue";
import { useRouter } from "vue-router";

import { basePathPrefix } from "@/utils/basePath";

export default () => {
  const router = useRouter();
  const notFoundRoute = router.resolve({ name: "not-found" });

  async function setNotFoundView() {
    const fullPath = router.currentRoute.value.fullPath;
    await router.replace(notFoundRoute);
    // fullPath is router-relative, so prepend the base path to keep the
    // restored URL inside the app prefix when served from a subpath.
    history.replaceState({}, notFoundRoute.meta.title as string, basePathPrefix() + fullPath);
  }

  async function useNotFoundView(...refs: Ref[]) {
    watch(refs, (values) => {
      if (values.every((e) => !e)) {
        setNotFoundView();
      }
    });
  }

  return {
    useNotFoundView,
    setNotFoundView,
  };
};
