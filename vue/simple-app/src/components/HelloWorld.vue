<script setup lang="ts">
defineProps<{
  msg: string
}>()
</script>

<template>
  <h1 class="greetings green">{{ msg }}</h1>
</template>

<style scoped>
h1 {
  font-weight: 400;
  font-size: 0.725rem;
}

.greetings {
  text-align: center;
}
</style>
