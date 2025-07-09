<!--
 ~ Copyright © 2016-2025 Patrick Zhang.
 ~ All Rights Reserved.
 -->
<script setup lang="ts">
import MyLoading, { type Status } from '@/components/MyLoading.vue';
import { db, type User } from '@/stores/db';
import useUserStore from '@/stores/user';
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const status = ref<Status>('Loading');
const userList = ref<User[]>([]);
const items = ref<(User & { label: string })[]>([]);
const selected = ref<number>();
const userStore = useUserStore();

const router = useRouter();

async function readUser() {
  try {
    const users = await db.user.toArray();
    userList.value = users;
    items.value = users.map((user) => ({
      ...user,
      label: user.name,
    }));
    status.value = 'Success';
    selected.value = items.value[0].id;
  } catch (e) {
    console.log('login failed', e);
    status.value = 'Failed';
  }
}
watch(selected, () => {
  console.log(selected);
});

async function login() {
  if (selected.value) {
    const user = userList.value.filter((user) => user.id === selected.value)?.[0];
    if (user) {
      userStore.setUserInfo(user);
      await router.replace('/');
    }
  }
}

onMounted(() => {
  readUser();
});
</script>
<style lang="scss" scoped></style>
<template>
  <div class="flex h-full justify-center items-center-safe">
    <MyLoading :status="status">
      <div class="mb-4 text-2xl text-primary/75">
        <span>Choose a user to Login.</span>
      </div>
      <URadioGroup v-model="selected" :items="items" value-key="id" variant="card" color="primary"></URadioGroup>
      <div class="flex justify-center mt-4">
        <UButton @click="login()" :disabled="!selected" size="xl">Login</UButton>
      </div>
    </MyLoading>
  </div>
</template>
