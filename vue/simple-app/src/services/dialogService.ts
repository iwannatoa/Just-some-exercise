import { useDialogStore } from '@/stores/dialogStore';
import { createApp, h, inject, reactive, type App, type Component } from 'vue';

// 使用 Symbol 作为注入 key
const DIALOG_KEY = Symbol('dialog');
export interface DialogOptions {
  width?: string;
  [key: string]: unknown;
}

export interface DialogService {
  open<T>(component: Component, props: DialogOptions): DialogRef<T>;
  close<T>(dialog: DialogRef<T>, res?: T): void;
}

export class DialogRef<T = unknown> {
  id: symbol;
  private _close: (dialog: DialogRef<T>, res?: T) => void;
  private _closed = false;
  private _onClose?: (res?: T) => void;

  constructor(id: symbol, closeFunc: (dialog: DialogRef<T>, res?: T) => void) {
    this.id = id;
    this._close = closeFunc;
  }
  close(res?: T): void {
    if (this._closed) return;
    this._closed = true;
    this._close(this);
    if (this._onClose) this._onClose(res);
  }
  onClose(callback: (res?: T) => void): this {
    this._onClose = callback;
    return this;
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
      const dialogStore = useDialogStore();
      const id = Symbol();
      const mountPoint = createMountPoint();
      const dialogRef: DialogRef<T> = new DialogRef<T>(id, this.close);
      const dialogApp = createApp({
        render: () =>
          h(content, {
            ...options,
            onClose: (res: T) => {
              dialogRef.close(res);
            },
          }),
      });
      if (window.__APP_ROUTER__) {
        dialogApp.use(window.__APP_ROUTER__);
      }
      if (window.__APP_PINIA__) {
        dialogApp.use(window.__APP_PINIA__);
      }
      dialogStore.addDialog({ id, instance: dialogApp, mountPoint });
      dialogApp.mount(mountPoint);
      return dialogRef;
    },

    close<T>(dialogRef: DialogRef<T>) {
      const dialogStore = useDialogStore();
      const { id } = dialogRef;
      const dialog = dialogStore.getDialog(id);
      if (!dialog) return;
      Promise.resolve().then(() => {
        const { instance, mountPoint } = dialog;
        instance.unmount();
        removeMountPoint(mountPoint);
        dialogStore.removeDialog(dialogRef.id);
      });
    },
  };
  return {
    install(app: App) {
      app.provide(DIALOG_KEY, service);
      app.config.globalProperties.$dialog = service;
    },
  };
}

export function useDialog(): DialogService {
  const service = inject<DialogService>(DIALOG_KEY);
  if (!service) {
    throw new Error('Dialog service not provided');
  }
  return service;
}
