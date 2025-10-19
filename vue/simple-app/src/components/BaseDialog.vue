<template>
  <div class="dialog-overlay" @click="clickOutSide()">
  </div>
  <transition name="{{mergeProps.animation}}">
    <div v-if="show" class="dialog-content" :style="{ width: mergeProps.width }">
      <div class="dialog-title">
        <slot name="dialog-title">{{ mergeProps.title }}</slot>
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
import { useParentFallback } from '@/utils/useParentFallback';
import { computed, onMounted, ref } from 'vue';
const fallback = useParentFallback({
  title: 'Dialog Title',
  width: '16rem',
  animation: 'fade',
  closeOnClickOutside: true
});
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

const mergeProps = computed(() => ({
  ...props,
  ...fallback.value
}));
const emit = defineEmits<{
  close: [value: T | null]
}>();
const show = ref(true);
function clickOutSide(): void {
  if (mergeProps.value.closeOnClickOutside) { emit('close', null); }
}
onMounted(() => {
  let timer = null;
  if (mergeProps.value.animation) {
    show.value = false;
    timer = setTimeout(() => {
      show.value = true;
    }, 10);
  }
  return () => {
    if (timer) { clearTimeout(timer); }
  };
});

</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: auto;
}

.dialog-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 2rem;

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
