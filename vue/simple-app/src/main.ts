/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */
import './assets/main.css'
import './styles/style.scss';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ui from '@nuxt/ui/vue-plugin';

import App from './App.vue';
import router from './router';
import { createDialogService } from './services/dialogService';

const app = createApp(App);
app.use(createDialogService());

app.use(createPinia());
app.use(router);
app.use(ui);

app.mount('#app')
