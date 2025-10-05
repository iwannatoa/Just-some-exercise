/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */
import { defineStore } from 'pinia';
import type { User } from './db';
import { useLocalStorage } from '@vueuse/core';

export interface UserInfo {
  user?: User;
  isLogin: boolean;
}

const useLocalUserStore = defineStore('userInfo', () => {
  // should use useCookie but need import other package
  const userInfo = useLocalStorage<UserInfo>('User', { isLogin: false });
  function setUserInfo(user: User) {
    userInfo.value.user = user;
    userInfo.value.isLogin = true;
  }

  function logout() {
    userInfo.value.user = undefined;
    userInfo.value.isLogin = false;
  }

  return { userInfo, setUserInfo, logout };
});

export default useLocalUserStore;
