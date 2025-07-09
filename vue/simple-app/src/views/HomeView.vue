<!--
 ~ Copyright © 2016-2025 Patrick Zhang.
 ~ All Rights Reserved.
 -->
<script setup lang="ts">
import { db, type Task, type TaskHistory } from '@/stores/db';
import useUserStore from '@/stores/user';
import { onMounted, ref } from 'vue';

const user = useUserStore().userInfo.user!;
const data = ref<Task[]>([]);

const isModalOpen = ref(false);

onMounted(async () => {
  const taskList = await db.task.filter((item) => item.assigneeId === user.id).toArray();
  console.log(taskList);
  data.value = taskList;
});

async function submit(event: Task) {
  const createdTaskId = await db.task.add(event);
  const history:TaskHistory = {
    type: 'Create',
    userId: user.id!,
    taskId: createdTaskId!,
    detail: 'Create task',
    operateTime: Date.now()
  } ;
  await db.taskHistory.add(history);
  isModalOpen.value = false;
}
</script>

<template>
  <div class="p-4">
    <div class="flex flex-row justify-between mb-4">
      <h1 class="text-2xl">Default Board</h1>
      <UModal v-model:open="isModalOpen" title="Create a new Task" description="">
        <UButton color="secondary" label="Create" ></UButton>
        <template #body>
          <CreateTask @onSubmit="submit"></CreateTask>
        </template>
      </UModal>
    </div>
    <div class="border-secondary-400 rounded-4xl border-2 p-4">
      <h2>My Tasks</h2>
      <UTable :data="data" class="flex-1"></UTable>
    </div>
  </div>
</template>
