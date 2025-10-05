<script setup lang="ts">
import BaseDialog from '@/components/BaseDialog.vue';
import { loadingDirective } from '@/directives/loadingDirective';
import { useDialog } from '@/services/dialogService';
import useUserService, { type User } from '@/services/userService';
import type { TableColumn } from '@nuxt/ui';
import { storeToRefs } from 'pinia';
import { computed, onMounted, watch, watchEffect } from 'vue';

const userService = useUserService();
const { users: userInfo, loading } = storeToRefs(userService);
const count = computed(() => userInfo.value?.length ?? 0);
const dialogService = useDialog();

defineOptions({
  directives: { loading: loadingDirective },
});
const columnDefs: TableColumn<User>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'roles', header: 'Roles' },
  { accessorKey: 'primaryOrganizationName', header: 'Primary Organization' },
  { accessorKey: 'orgnizations', header: 'Organizations' },
];


function createNewUser() {
  console.log('create new user');
  dialogService.open<boolean>(
    BaseDialog,
    {
      title: 'Create New User',
      width: '30rem'
    },
  ).onClose((res?: boolean) => {
    console.log('dialog closed', res);
  });
}
watch(userInfo, (newVal, oldVal) => {
  console.log('userInfo changed:', newVal, oldVal);
}, { deep: true });

watchEffect(() => {
  console.log('loading state:', loading.value);
})

onMounted(() => {
  userService.getUsers();
});
</script>
<template>
  <div class="flex flex-row justify-between mb-2">
    <u-button @click="createNewUser">Create</u-button>
  </div>
  <div>{{ count }} Users</div>
  <u-table v-loading="loading" :data="userInfo" :columns="columnDefs"></u-table>
</template>
