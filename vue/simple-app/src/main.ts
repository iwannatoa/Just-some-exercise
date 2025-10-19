/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */
import './assets/main.css';
import './styles/style.scss';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import ui from '@nuxt/ui/vue-plugin';

import App from './App.vue';
import router from './router';
import { createDialogService } from './services/dialogService';
import Button from 'primevue/button';

const app = createApp(App);
const dialogService = createDialogService();
app.use(dialogService);

const pinia = createPinia();
app.use(pinia);
app.use(PrimeVue);
app.use(router);
app.use(ui);

window.__APP_PLUGINS__ = [];
window.__APP_PLUGINS__.push(pinia, PrimeVue, router, ui);

app.component('myButton', Button);
app.mount('#app');
