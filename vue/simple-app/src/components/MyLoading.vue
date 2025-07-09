<!--
 ~ Copyright © 2016-2025 Patrick Zhang.
 ~ All Rights Reserved.
 -->
<script setup lang="ts">
export type Status = 'Loading' | 'Success' | 'Failed';

defineProps<{
  status: Status;
}>();
</script>
<template>
  <div v-if="status === 'Loading'">
    <span>Loading...</span>
  </div>
  <div v-else-if="status === 'Failed'">
    <span>Problem occurred.</span>
  </div>
  <div v-else>
    <slot></slot>
  </div>
</template>
