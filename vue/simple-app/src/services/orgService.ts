import { onMounted, ref } from 'vue';
import { defineStore } from 'pinia';
import useHttpClient from './httpClient';
import type { EntryListResponse } from '@/stores/response';

export interface Organization {
  id: number;
  name: string;
  level: number;
  code: string;
  enable: boolean;
}

const useOrgService = defineStore('orgService', () => {
  const organizations = ref<Organization[]>([]);
  const loading = ref(false);
  const httpClient = useHttpClient();
  const getOrganizations = async (): Promise<Organization[]> => {
    loading.value = true;
    const response = await httpClient.get<EntryListResponse<Organization>>('/user/api/org');
    organizations.value = response.entries;
    loading.value = false;
    return organizations.value;
  };

  const createOrganization = async (org: Partial<Organization>): Promise<Organization> => {
    loading.value = true;
    const newOrg = await httpClient.post<Organization>('/user/api/org/create', org);
    getOrganizations();
    return newOrg;
  };

  const updateOrganization = async (id: number, org: Partial<Organization>) => {
    loading.value = true;
    const updatedOrg = await httpClient.put<Organization>(`/user/api/org`, org);
    getOrganizations();
    return updatedOrg;
  };

  const deleteOrganization = async (id: number) => {
    loading.value = true;
    await httpClient.delete(`/user/api/org/${id}`);
    getOrganizations();
  };

  onMounted(() => {});

  return { organizations, getOrganizations, createOrganization, updateOrganization, deleteOrganization, loading };
});

export default useOrgService;
