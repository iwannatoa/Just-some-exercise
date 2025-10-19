<!--
 ~ Copyright © 2016-2025 Patrick Zhang.
 ~ All Rights Reserved.
 -->
<script lang="ts" setup>
import { onMounted, ref, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '@/stores/db';

const route = useRoute();
const router = useRouter();

const taskId = ref(0);
const taskDetail = ref();
const taskDb = db.task;
const taskHistoryDb = db.taskHistory;

async function getTaskById(id: number) {
  const task = await taskDb.where('id').equals(id).first();
  const histories = await taskHistoryDb.where('taskId').equals(id).toArray();
  return { task: task, histories: histories };
}

watchEffect(async () => {
  taskDetail.value = await getTaskById(taskId.value);
});

onMounted(() => {
  const id = +route.params.id;
  console.log(id);
  console.log(window.history.state);
  if (id) {
    taskId.value = id;
  } else {
    console.log('No id find');
    router.back();
  }
});
</script>
<template>
  <div>
    <pre class="json">{{ JSON.stringify(taskDetail, undefined, '  ') }}</pre>
  </div>
</template>
<style lang="scss">
.json {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
