<template>
  <div v-switch="v">
      <h2>v:{{ v }}</h2>
      <h2>o1:{{ o1 }}</h2>
      <h2>o2:{{ o2 }}</h2>  
      <h2>o3:{{ o3 }}</h2>
    <div v-case="o1">case 1</div>
    <div v-case="o2">case 2</div>
    <div v-case="o3">case 3</div>
    <div v-case-default>default case</div>
  </div>
  <u-button @click="plusV">plusV</u-button>
  <u-button @click="plusOther">plusOther</u-button>
</template>
<script lang="ts" setup>
import { switchDirectives } from '@/directives/switchDirective';
import { ref } from 'vue';

defineOptions({
  directives: { ...switchDirectives },
});

const v = ref(0);
const o1 = ref(1);
const o2 = ref(2);
const o3 = ref(3);
const oD = 0;

const plusV = () => {
  v.value += 1;
};
const plusOther = () => {
  o1.value += 1;
  o2.value += 1;
  o3.value += 1;
};
</script>
