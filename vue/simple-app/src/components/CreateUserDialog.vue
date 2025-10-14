<template>
  <BaseDialog>
    <template #dialog-title> {{ title }}</template>
    <div>
      <UForm :state="state" @submit="submit">
        <UFormField label="Name" name="name">
          <UInput v-model="state.name" placeholder="Enter name" />
        </UFormField>
        <UFormField label="Organization" name="orgnizations">
          <USelect v-model="state.orgnizations" multiple placeholder="Select organization" :items="orgOptions"
            :loading="orgLoading" />
        </UFormField>
      </UForm>
    </div>
    <template #dialog-actions>
      <UButton color="secondary" @click="close()">Close</UButton>
      <UButton :loading="loading" type="submit">Create</UButton>
    </template>
  </BaseDialog>
</template>

<script lang="ts" setup generic="T = unknown">
import useOrgService from '@/services/orgService';
import { computed, onMounted, reactive, useAttrs } from 'vue';
import { storeToRefs } from 'pinia';
import useRoleService from '@/services/roleService';
import { useDialogService } from '@/services/dialogService';
import useUserService, { type User } from '@/services/userService';
import { DialogRef } from '../services/dialogService';

const { dialogRef } = useAttrs() as { dialogRef: DialogRef<T> };
defineProps({
  title: { type: String },
  width: { type: String, default: '40rem' }
});
const orgService = useOrgService();
const roleService = useRoleService();
const userService = useUserService();
const dialogService = useDialogService();
const { organizations, loading: orgLoading } = storeToRefs(orgService);
const { loading } = storeToRefs(userService);
const orgOptions = computed(() => organizations.value?.map((org) => ({ label: org.name, value: org.code })) || []);
const state = reactive<Partial<User>>({
  name: '',
  email: '',
  roles: [],
  orgnizations: [],
  primaryOrganizationName: ''
});

async function submit() {
  try {
    await userService.createUser(state);
    dialogService.close(dialogRef);
  } catch (error) {
    console.error('Failed to create user:', error);
  }
}

function close() {
  dialogService.close(dialogRef);
}

onMounted(() => {
  roleService.getRoles();
  orgService.getOrganizations();
});
</script>
