import type { Pinia } from 'pinia';
import type { Router } from 'vue-router';

declare global {
  interface Window {
    __APP_ROUTER__?: Router;
    __APP_PINIA__?: Pinia;
  }
}
export {};
