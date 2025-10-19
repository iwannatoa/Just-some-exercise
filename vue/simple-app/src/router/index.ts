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
    // default redirect to home
    {
      // :pathMatch(.*)* will match everything and put it under $route.params.pathMatch as an array
      // :pathMatch(.*) will match everything and put it under $route.params.pathMatch as a string
      // but the previous will be slower, so it all depends on your usage
      path: '/:pathMatch(.*)*',
      // should use a component to log the invalid path / let the user know the page is 404 and then redirect to the home
      name: 'not-found',
      redirect: { name: 'home', params: {} },
    },
  ],
});

export default router;
