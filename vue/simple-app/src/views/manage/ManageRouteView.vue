<template>
  <div class="bg-gray-200 p-4 h-full">
    <div class="flex flex-row">
      <RouterLink class="item" to="/manage/user">User List </RouterLink>
      <RouterLink class="item" to="/manage/org">Org List </RouterLink>
      <RouterLink class="item" to="/manage/entitlement">Entitlement List </RouterLink>
      <RouterLink class="item" to="/manage/role">Role List </RouterLink>
    </div>
    <div class="main">
      <RouterView />
    </div>
  </div>
</template>
<script lang="ts" setup></script>

<style scoped lang="scss">
@use '@/styles/style' as *;
.main {
  width: 100%;
  padding: 1rem;
  background-color: white;
}
.item{
  background-color: white;
  color: $primary-color;
  padding: 0.5rem;
  border-radius: 0.5rem 0.5rem 0 0 ;
  border: 1px solid $primary-color;
  
  &:hover{
    background-color: var(--ui-color-primary-100);
  }
  &.router-link-active {
    color: white;
    background-color: var(--ui-color-primary-500);
    &:hover{
      cursor: default;
    }
  }
}
</style>
