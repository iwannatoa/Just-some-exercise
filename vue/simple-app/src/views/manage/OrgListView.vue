<template>
  <u-table :data="orgs" :columns="columnDefs"></u-table>
</template>
<script lang="ts" setup>
import useOrgService, { type Organization } from '@/services/orgService';
import type { TableColumn } from '@nuxt/ui';
import { storeToRefs } from 'pinia';
import { computed, onActivated, onDeactivated, onMounted, ref, watch } from 'vue';

const orgService = useOrgService();
const { organizations: orgs } = storeToRefs(orgService);
const columnDefs: TableColumn<Organization>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'code', header: 'Org Code' },
  { accessorKey: 'level', header: 'Level' },
  { accessorKey: 'enable', header: 'Enable', cell: (info) => (info.getValue() ? 'Yes' : 'No') },
];
onMounted(() => {
  orgService.getOrganizations();
});

onActivated(() => {
  console.log('OrgListView activated');
});

onDeactivated(() => {
  console.log('OrgListView deactivated');
});
</script>
