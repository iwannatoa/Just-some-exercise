<template>
    <transition name="{{animation}}">
        <div v-if="animation" class="dialog-overlay">
            <div class="dialog-content" :style="{ width: width }">
                <div class="dialog-title">
                    <slot name="title"></slot>
                </div>
                <div class="dialog-body">
                    <slot></slot>
                </div>
                <div class="dialog-actions">
                    <slot name="dialog-actions">
                        <u-button @click="$emit('close')">Close</u-button>
                    </slot>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
defineProps({
    width: {
        type: String,
        default: '16rem'
    }, animation: {
        type: String,
        default: 'fade'
    }
})
defineEmits(['close'])
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
