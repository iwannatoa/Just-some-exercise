import { defineStore } from 'pinia';
import { ref } from 'vue';
import useHttpClient from './httpClient';
import type { EntryListResponse, EntryResponse } from '@/stores/response';

export interface User {
  id: number;
  name: string;
  email: string;
  createTime: string;
  lastLoginTime: string;
  enable: boolean;
  roles: string[];
  primaryOrganizationId: string;
  primaryOrganizationName: string;
  creatorId: string;
  orgnizations: string[];
}

const useUserService = defineStore('userService', () => {
  const users = ref<User[]>([]);
  const httpClient = useHttpClient();
  const loading = ref(false);

  const getUsers = async (): Promise<User[]> => {
    loading.value = true;
    const response = await httpClient.get<EntryListResponse<User>>('/user/api/user');
    users.value = response.entries;
    loading.value = false;
    return users.value;
  };

  const getUser = async (id: number): Promise<User> => {
    loading.value = true;
    const response = await httpClient.get<EntryResponse<User>>(`/user/api/users/${id}`);
    loading.value = false;
    return response.entry;
  };

  const createUser = async (user: Partial<User>): Promise<User> => {
    loading.value = true;
    const newUser = await httpClient.post<User>('/user/api/users', user);
    getUsers();
    return newUser;
  };

  const updateUser = async (id: number, user: Partial<User>) => {
    loading.value = true;
    const updatedUser = await httpClient.put<User>(`/user/api/users/${id}`, user);
    getUsers();
    return updatedUser;
  };

  const deleteUser = async (id: number) => {
    loading.value = true;
    await httpClient.delete(`/user/api/users/${id}`);
    getUsers();
  };

  return { users, loading, getUsers, getUser, createUser, updateUser, deleteUser };
});

export default useUserService;
