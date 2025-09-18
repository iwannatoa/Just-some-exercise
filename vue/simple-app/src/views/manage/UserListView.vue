<script setup lang="ts">
import BaseDialog from '@/components/BaseDialog.vue';
import { loadingDirective } from '@/directives/MyOverlay';
import { useDialog } from '@/services/dialogService';
import HttpClient from '@/services/httpClient';
import type { User } from '@/stores/manage.model';
import type { TableColumn } from '@nuxt/ui';
import { onMounted, ref } from 'vue';

const userInfo = ref<User[]>([]);
const loading = ref(false);
const httpClient = HttpClient.getInstance();
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

async function refreshListData() {
  loading.value = true;
  const userResponse: { entries: [] } = await httpClient.get('/user/api/user');
  console.log(userResponse);
  userInfo.value = userResponse.entries.map((entry: User & { organizations: string[] }) => {
    entry.organizations = entry.orgnizations;
    return entry;
  });
  loading.value = false;
}

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
    if (res) {
      refreshListData();
    }
  });
}

onMounted(async () => {
  refreshListData();
});
</script>
<template>
  <div class="flex flex-row justify-between mb-2">
    <u-button @click="createNewUser">Create</u-button>
  </div>
  <u-table v-loading="loading" :data="userInfo" :columns="columnDefs"></u-table>
</template>
