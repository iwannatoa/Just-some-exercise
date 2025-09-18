/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */
import { createRouter, createWebHistory } from 'vue-router';
import TaskListView from '../views/tasks/TaskListView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', redirect: '/task' },
    {
      path: '/task',
      name: 'taskHome',
      component: TaskListView,
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
      path: '/manage',
      name: 'manage',
      redirect: '/manage/user',
      component: () => import('../views/manage/ManageRouteView.vue'),
      children: [
        {
          path: 'user',
          name: 'userManage',
          component: () => import('../views/manage/UserListView.vue'),
        },
        {
          path: 'role',
          name: 'roleManage',
          component: () => import('../views/manage/RoleListView.vue'),
        },
        {
          path: 'entitlement',
          name: 'entitlementManage',
          component: () => import('../views/manage/EntitlementListView.vue'),
        },
        {
          path: 'org',
          name: 'orgManage',
          component: () => import('../views/manage/OrgListView.vue'),
        },
      ],
    },
  ],
});

export default router;
