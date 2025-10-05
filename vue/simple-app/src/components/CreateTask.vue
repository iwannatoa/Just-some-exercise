<!--
 ~ Copyright © 2016-2025 Patrick Zhang.
 ~ All Rights Reserved.
 -->
<script lang="ts" setup>
import { db, type Workflow, type Task } from '@/stores/db';
import useLocalUserStore from '@/stores/user';
import { reactive, ref, watchEffect } from 'vue';
import { from, Subject, takeUntil } from 'rxjs';
import type { FormSubmitEvent } from '@nuxt/ui';

const currentUser = useLocalUserStore().userInfo.user!;
const workflows = ref<Workflow[]>([]);
const users = ref<{ id: number; label: string }[]>([]);
const state = reactive<Task>({
  name: '',
  category: '',
  status: 'Open',
  creatorId: currentUser.id!,
  assigneeId: -1,
});
const emits = defineEmits<{ onSubmit: [value: Task] }>();
const loading = ref(false);

watchEffect((onCleanup) => {
  const destroy = new Subject<void>();
  from(db.workflow.filter((w) => w.taskType === 'Task').toArray())
    .pipe(takeUntil(destroy))
    .subscribe((items) => {
      workflows.value = items;
      // find the first status
      const nextStatus = items.map((item) => item.next).flat();
      const start = items.filter((item) => !nextStatus.includes(item.current))?.[0];
      if (start) {
        state.status = start.current;
      }
    });

  from(db.user.toArray())
    .pipe(takeUntil(destroy))
    .subscribe((items) => {
      users.value = items.map((item) => ({ id: item.id!, label: item.name }));
    });

  onCleanup(() => {
    destroy.next();
    destroy.complete();
  });
});

function onSubmit(event: FormSubmitEvent<typeof state>) {
  loading.value = true;
  emits('onSubmit', { ...event.data });
}
</script>

<template>
  <UForm :state="state" class="space-y-4" @submit="onSubmit">
    <UFormField label="Category" name="category">
      <UInput v-model="state.category"></UInput>
    </UFormField>
    <UFormField label="Task Name" name="name">
      <UInput v-model="state.name"></UInput>
    </UFormField>
    <UFormField label="Assign" name="assigneeId">
      <USelect v-model="state.assigneeId" value-key="id" placeholder="Select assignee" :items="users"></USelect>
    </UFormField>
    <UButton :loading="loading" type="submit">Create</UButton>
  </UForm>
</template>
