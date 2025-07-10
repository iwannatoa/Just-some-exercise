<!--
 ~ Copyright © 2016-2025 Patrick Zhang.
 ~ All Rights Reserved.
 -->
<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { onMounted, ref, watch } from 'vue';
import useUserStore from './stores/user';

const showBanner = ref(!(localStorage.getItem('showBanner') === 'false' && true));
const userStore = useUserStore();
const userInfo = ref(userStore.userInfo);
const router = useRouter();

function closeBanner() {
  showBanner.value = false;
  localStorage.setItem('showBanner', 'false');
}

function logout() {
  console.log('logout');
  userStore.logout();
  localStorage.clear();
  router.replace('/login');
}

watch(userInfo, () => {
  if (!userInfo.value.isLogin) logout();
});

onMounted(() => {
  if (!userInfo.value.isLogin) logout();
});

//provide a button to logout
</script>

<template>
  <div class="h-[100vh]">
    <UApp>
      <template v-if="userInfo.isLogin">
        <div class="app-container">
          <div v-if="showBanner" class="banner">
            <div class="flex">
              <span class="flex-1 text-center content-center" >Welcome {{ userInfo.user?.name }} !</span>
              <button class="flex-none p-2" @click="closeBanner()">x</button>
            </div>
          </div>
          <div class="masthead">
            <div class="flex">
              <img class="logo" src="@/assets/logo.svg" width="40" height="40" />
              <div class="flex-1"></div>
              <span class="p-4 text-primary-50">{{ userInfo.user?.name }}</span>
              <u-button @click="logout()" color="primary" class="text-primary-50">logout</u-button>
            </div>
          </div>

          <div class="sidenav">
            <nav>
              <div class="nav-item">
                <RouterLink to="/task">Tasks</RouterLink>
              </div>
              <div class="nav-item">
                <RouterLink to="/about">About</RouterLink>
              </div>
            </nav>
          </div>
          <div class="content">
            <RouterView />
          </div>
        </div>
      </template>
      <template v-else>
        <RouterView />
      </template>
    </UApp>
  </div>
</template>

<style scoped lang="scss">
@use 'styles/style' as *;
.app-container {
  display: grid;
  grid-template:
    'top top' auto
    'masthead masthead' 3.5rem
    'sidenav content' minmax(0, 1fr) / min-content minmax(0, 1fr);
  height: 100vh;
}

.banner {
  grid-area: top;
}

.masthead {
  grid-area: masthead;
  box-shadow: 0 3px 6px #00000029;
  z-index: 100;
  background-color: $primary_color;
}
.sidenav {
  grid-area: sidenav;
  nav {
    height: 100%;
    display: flex;
    flex-flow: column nowrap;
    border-right: 1px solid #e1e1e1;
    background-color: #fff;
    width: fit-content;
    background-color: $primary_color;

    .nav-item {
      @apply min-w-40  p-4;
      color: var(--ui-color-primary-50);
      &:has(.router-link-active) {
        border-left: 6px solid var(--ui-secondary);
      }
    }
  }
}
.content {
  grid-area: content;
}

.logo {
  display: block;
  margin: 0.25rem;
}
</style>
