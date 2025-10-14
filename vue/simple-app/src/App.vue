<!--
 ~ Copyright © 2016-2025 Patrick Zhang.
 ~ All Rights Reserved.
 -->
<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { onMounted, ref, watch } from 'vue';
import useLocalUserStore from './stores/user';
import { storeToRefs } from 'pinia';

const showBanner = ref(!(localStorage.getItem('showBanner') === 'false' && true));
const userStore = useLocalUserStore();
const { userInfo } = storeToRefs(userStore);
const router = useRouter();

function closeBanner() {
  showBanner.value = false;
  localStorage.setItem('showBanner', 'false');
}

function logout() {
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
  <div class="h-[100vh] isolate">
    <UApp>
      <template v-if="userInfo.isLogin">
        <div class="app-container">
          <div v-if="showBanner" class="banner">
            <div class="flex">
              <span class="flex-1 text-center content-center">Welcome {{ userInfo.user?.name }} !</span>
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
              <RouterLink class="nav-item" to="/task">Tasks</RouterLink>
              <RouterLink class="nav-item" to="/manage">Manage</RouterLink>
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
@use '@/styles/style' as *;

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
  background-color: $secondary_color;
}

.masthead {
  grid-area: masthead;
  box-shadow: 0 3px 6px #00000029;
  z-index: 100;
  background-color: $primary_color;
}

.sidenav {
  grid-area: sidenav;
  box-shadow: 3px 0 6px #00000029;
  z-index: 99;

  nav {
    height: 100%;
    display: flex;
    flex-flow: column nowrap;
    width: fit-content;
    background-color: $primary_color;

    .nav-item {
      @apply min-w-40 p-4;
      color: var(--ui-color-primary-50);
&:hover {
        background-color: var(--ui-color-primary-600);
      }

      &.router-link-active {
        background-color: var(--ui-color-primary-700);
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
