/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */
import './assets/main.css'
import './styles/_style.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ui from '@nuxt/ui/vue-plugin';

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ui);

app.mount('#app')
