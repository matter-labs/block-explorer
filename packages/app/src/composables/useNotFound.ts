import { type Ref, watch } from "vue";
import { useRouter } from "vue-router";

export default () => {
  const router = useRouter();
  const notFoundRoute = router.resolve({ name: "not-found" });

  async function setNotFoundView() {
    const fullPath = router.currentRoute.value.fullPath;
    await router.replace(notFoundRoute);
    history.replaceState({}, notFoundRoute.meta.title as string, fullPath);
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
