import { createApp, h, inject, reactive, type App, type Component } from 'vue';

// 使用 Symbol 作为注入 key
const DialogKey = Symbol('dialog');

interface DialogQueueItem {
  id: symbol;
  instance: unknown;
  mountPoint: HTMLElement;
}

const dialogState = reactive({
  queue: [] as DialogQueueItem[],
});

export interface DialogOptions {
  title?: string;
  message?: string;
  [key: string]: unknown;
}

export interface DialogService {
  open<T>(component: Component, props: DialogOptions): DialogRef<T>;
  close<T>(dialog: DialogRef<T>, res?: T): void;
}

export class DialogRef<T = unknown> {
  id: symbol;
  private _res: T | undefined;
  private _closeCallback?: (res?: T) => void;
  private _close: (dialog: DialogRef<T>, res?: T) => void;
  private _closed = false;

  constructor(id: symbol, closeFunc: (dialog: DialogRef<T>, res?: T) => void) {
    this.id = id;
    this._close = closeFunc;
  }
  close(res?: T): void {
    if (this._closed) return;
    this._closed = true;
    this._res = res;
    this._close(this);
  }
  onClose(callback: (res?: T) => void): this {
    this._closeCallback = callback;
    return this;
  }
  callCloseCallback() {
    if (this._closeCallback) {
      this._closeCallback(this._res);
    }
  }
}

function createMountPoint(): HTMLElement {
  const mountPoint = document.createElement('div');
  mountPoint.classList.add('dialog-container');
  document.body.appendChild(mountPoint);
  return mountPoint;
}

function removeMountPoint(mountPoint: HTMLElement) {
  if (mountPoint.parentNode) {
    mountPoint.parentNode.removeChild(mountPoint);
  }
}

export function createDialogService() {
  const service: DialogService = {
    open<T>(content: Component, options: DialogOptions) {
      const id = Symbol();
      const mountPoint = createMountPoint();
      const dialogRef: DialogRef<T> = new DialogRef<T>(id, this.close);
      const dialogApp = createApp({
        render: () =>
          h(content, {
            ...options,
            onClose: (res?: T) => {
              this.close(dialogRef, res);
            },
          }),
      });
      dialogState.queue.push({ id, instance: dialogApp, mountPoint });
      dialogApp.mount(mountPoint);
      return dialogRef;
    },

    close<T>(dialogRef: DialogRef<T>, res?: T) {
      const { id } = dialogRef;
      const index = dialogState.queue.findIndex((d) => d.id === id);
      if (index >= 0) {
        const { instance, mountPoint } = dialogState.queue[index];
        (instance as App).unmount();
        removeMountPoint(mountPoint);
        dialogState.queue.splice(index, 1);
      }
      if (res !== undefined) {
        dialogRef['_res'] = res;
      }
      dialogRef.callCloseCallback();
    },
  };
  return {
    install(app: App) {
      app.provide(DialogKey, service);
      app.config.globalProperties.$dialog = service;
    },
  };
}

export function useDialog(): DialogService {
  const service = inject<DialogService>(DialogKey);
  if (!service) {
    throw new Error('Dialog service not provided');
  }
  return service;
}
