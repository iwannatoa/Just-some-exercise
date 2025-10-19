<script setup lang="ts">
import CreateUserDialog from '@/components/CreateUserDialog.vue';
import { loadingDirective } from '@/directives/loadingDirective';
import { useDialogService } from '@/services/dialogService';
import useUserService, { type User } from '@/services/userService';
import type { TableColumn } from '@nuxt/ui';
import { storeToRefs } from 'pinia';
import { computed, onActivated, onDeactivated, onMounted, onRenderTracked, onRenderTriggered, watch, watchEffect } from 'vue';

const userService = useUserService();
const { users: userInfo, loading } = storeToRefs(userService);
const count = computed(() => userInfo.value?.length ?? 0);
const dialogService = useDialogService();

defineOptions({
  directives: { loading: loadingDirective },
  name: 'UserList',
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
  dialogService
    .open<boolean>(CreateUserDialog, {
      title: 'Create New User',
      width: '40rem',
    })
    .onClose((res?: boolean) => {
      console.log('dialog closed', res);
    });
}

onMounted(() => {
  userService.getUsers();
});

watchEffect((cleanUp) => {
  console.log(`UserListView: user count is ${count.value}`);
  cleanUp(() => {
    console.log('UserListView: cleanup effect');
  });
});

watch(count, (newCount, oldCount, cleanUp) => {
  console.log(`UserListView: user count changed from ${oldCount} to ${newCount}`);
  cleanUp(() => {
    console.log('UserListView: cleanup count watcher');
  });
});

onRenderTracked((e) => {
  console.log('UserListView: render tracked', e);
});

onRenderTriggered((e) => {
  console.log('UserListView: render triggered', e);
});
</script>
<template>
  <div class="flex flex-row justify-between mb-2">
    <u-button @click="createNewUser">Create</u-button>
  </div>
  <div>{{ count }} Users</div>
  <u-table v-loading="loading" :data="userInfo" :columns="columnDefs"></u-table>
</template>
