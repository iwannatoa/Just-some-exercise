/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */
import './assets/main.css'
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
app.use(createDialogService());

const pinia = createPinia();
app.use(pinia);
app.use(PrimeVue);
app.use(router);
app.use(ui);

window.__APP_ROUTER__ = router;
window.__APP_PINIA__ = pinia;

app.component('myButton', Button);
app.mount('#app')
