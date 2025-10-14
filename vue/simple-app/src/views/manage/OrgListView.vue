<template>
  <div>OrgList</div>
  <u-table :data="orgs" :columns="columnDefs"></u-table>
</template>
<script lang="ts" setup>
import useOrgService, { type Organization } from '@/services/orgService';
import type { TableColumn } from '@nuxt/ui';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';

const orgService = useOrgService();
const { organizations: orgs } = storeToRefs(orgService);
const columnDefs: TableColumn<Organization>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'description', header: 'Description' },
  { accessorKey: 'level', header: 'Level' },
];
onMounted(() => {
  orgService.getOrganizations();
})

</script>
