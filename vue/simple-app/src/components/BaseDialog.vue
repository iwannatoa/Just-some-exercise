<template>
  <div class="dialog-overlay" @click="clickOutSide()">
  </div>
  <transition name="{{animation}}">
    <div v-if="show" class="dialog-content" :style="{ width: width }">
      <div class="dialog-title">
        <slot name="dialog-title">{{ title }}</slot>
      </div>
      <div class="dialog-body">
        <slot></slot>
      </div>
      <div class="dialog-actions">
        <slot name="dialog-actions">
          <u-button @click="$emit('close', null)">Close</u-button>
        </slot>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts" generic="T = unknown">
import { onMounted, ref } from 'vue';
const props = defineProps({
  title: {
    type: String,
    default: 'Dialog Title'
  },
  width: {
    type: String,
    default: '16rem'
  },
  animation: {
    type: String,
    default: 'fade',
    required: false
  },
  closeOnClickOutside: {
    type: Boolean,
    default: true
  },
  dialogRef: {
    type: Object as () => T
  }
});
const emit = defineEmits<{
  close: [value: T | null]
}>();
const show = ref(true);

function clickOutSide(): void {
  if (props.closeOnClickOutside) { emit('close', null); }
}

onMounted(() => {
  let timer = null;
  if (props.animation) {
    show.value = false;
    timer = setTimeout(() => {
      show.value = true;
    }, 10);
  }
  return () => {
    if (timer) { clearTimeout(timer); }
  };
})
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.dialog-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 2rem;
  z-index: 1001;

  .dialog-title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .dialog-body {
    margin-bottom: 1rem;
    min-height: 5rem;
  }

  .dialog-actions {
    margin-top: 1rem;
    text-align: right;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
