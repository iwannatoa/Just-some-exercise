/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */
import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/tasks/HomeView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', redirect: '/task' },
    {
      path: '/task',
      name: 'taskHome',
      component: HomeView,
    },
    {
      path: '/task/:id',
      name: 'taskDetail',
      component: () => import('../views/tasks/DetailView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
  ],
});

export default router;
