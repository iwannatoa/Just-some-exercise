import { defineStore } from 'pinia';
import useHttpClient from './httpClient';
import { ref } from 'vue';
import type { Organization } from './orgService';
import type { EntryListResponse } from '@/stores/response';

export interface Role {
  id: number;
  name: string;
  description: string;
  enable: boolean;
  organization: Organization;
  permissions: [];
}

const useRoleService = defineStore('roleService', () => {
  const httpClient = useHttpClient();
  const loading = ref(false);
  const roles = ref<Role[]>([]);

  const getRoles = async (): Promise<Role[]> => {
    loading.value = true;
    const response = await httpClient.get<EntryListResponse<Role>>('/user/api/role');
    roles.value = response.entries;
    loading.value = false;
    return roles.value;
  };

  return { roles, loading, getRoles };
});

export default useRoleService;
