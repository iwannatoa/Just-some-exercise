<!--
 ~ Copyright © 2016-2025 Patrick Zhang.
 ~ All Rights Reserved.
 -->
<script setup lang="ts">
import { db, type Task, type TaskHistory } from '@/stores/db';
import useLocalUserStore from '@/stores/user';
import type { TableColumn, TableRow } from '@nuxt/ui';
import { ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';

const user = useLocalUserStore().userInfo.user!;
const router = useRouter();
const data = ref<Task[]>([]);

const isModalOpen = ref(false);
const columns: TableColumn<Task>[] = [
  {
    accessorKey: 'name',
    header: 'Task Name',
  },
  {
    accessorKey: 'category',
    header: 'Category',
  },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'assigneeId', header: 'Assignee' },
];
watchEffect(() => {
  loadTable();
});

async function loadTable() {
  const taskList = await db.task.where('assigneeId').equals(user.id!).toArray();
  console.log(taskList);
  data.value = taskList;
}

async function submit(event: Task) {
  const createdTaskId = await db.task.add(event);
  const history: TaskHistory = {
    type: 'Create',
    userId: user.id!,
    taskId: createdTaskId!,
    detail: 'Create task',
    operateTime: Date.now(),
  };
  await db.taskHistory.add(history);
  isModalOpen.value = false;
  await loadTable();
}

function selectRow(row: TableRow<Task>) {
  router.push({
    name: 'taskDetail',
    params: { id: row.original.id },
    state: { from: 'taskList' },
  });
}
</script>

<template>
  <div class="p-4">
    <div class="flex flex-row justify-between mb-4">
      <h1 class="text-2xl">Default Board</h1>
      <UModal v-model:open="isModalOpen" title="Create a new Task" description="">
        <UButton color="secondary" class="hover:cursor-pointer" label="Create"></UButton>
        <template #body>
          <CreateTask @submit="submit"></CreateTask>
        </template>
      </UModal>
    </div>
    <div class="border-secondary-400 rounded-2xl border-2 p-4 shadow-xl">
      <h2>My Tasks</h2>
      <UTable class="flex-1" :data="data" :columns="columns" @select="selectRow"></UTable>
    </div>
  </div>
</template>
