import { defineStore } from 'pinia';
import { markRaw, ref, type App, type Ref } from 'vue';

export interface DialogQueueItem {
  id: symbol;
  instance: App;
  mountPoint: HTMLElement;
}

export const useDialogStore = defineStore('dialog', () => {
  const queue: Ref<DialogQueueItem[]> = ref([]);

  const addDialog = (dialog: DialogQueueItem) => {
    queue.value.push({
      ...dialog,
      instance: markRaw(dialog.instance),
    });
  };

  const removeDialog = (id: symbol) => {
    const index = queue.value.findIndex((d) => d.id === id);
    if (index >= 0) {
      queue.value.splice(index, 1);
    }
  };

  const clearAll = () => {
    // 先复制一份避免在遍历时修改数组
    const dialogs = [...queue.value];
    queue.value = [];
    return dialogs;
  };

  const getDialog = (id: symbol) => {
    return queue.value.find((d) => d.id === id);
  };

  const getQueue = () => {
    return queue.value as Readonly<DialogQueueItem[]>;
  };

  return {
    queue,
    addDialog,
    removeDialog,
    clearAll,
    getDialog,
    getQueue,
  };
});
