import type { Pinia } from 'pinia';
import type { Router } from 'vue-router';
import type { Plugin } from 'vue';

declare global {
  interface Window {
    __APP_ROUTER__?: Router;
    __APP_PINIA__?: Pinia;
    __APP_PLUGINS__?: Plugin[];
  }
}
export {};
