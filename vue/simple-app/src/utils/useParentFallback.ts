import { computed, getCurrentInstance } from 'vue';

export function useParentFallback(fallbackValues: Object) {
  const parent = getCurrentInstance()?.parent;
  return computed(() => ({
    ...fallbackValues,
    ...parent?.props,
  }));
}
