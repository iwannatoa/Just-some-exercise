<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import { ref } from 'vue'

let showBanner = ref(localStorage.getItem('showBanner') ?? true)

function closeBanner() {
  showBanner.value = false
  localStorage.setItem('showBanner', 'false')
}
</script>

<template>
  <div class="app-container">
    <div v-if="showBanner" class="banner">
      <div class="flex">
        <HelloWorld class="flex-1 text-center content-center" msg="You did it!" />
        <button class="flex-none p-2" @click="closeBanner()">x</button>
      </div>
    </div>
    <div class="masthead">
      <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="40" height="40" />
    </div>

    <div class="sidenav">
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
    <div class="content">
      <RouterView />
    </div>
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
    color: #636363;
    border-right: 1px solid #e1e1e1;
    background-color: #fff;
    width: fit-content;
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
