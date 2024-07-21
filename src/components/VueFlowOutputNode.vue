<script setup>
import {Handle, Position} from '@vue-flow/core'
import {computed} from "vue";

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['render-component']);

function renderComponent() {
  emit("render-component", props.data.component);
}

const componentWidth = computed({
  get: () => props.data.componentWidth == null ? 'width: 100px;' : `width: ${props.data.componentWidth}px;`,
})
</script>

<template>
  <div @click="renderComponent" :style="componentWidth">
    <span class="line" style="color: #ea15b1">
      {{props.data.label}}
    </span>
    <span class="line" v-if="props.data.abstract != null">
      {{props.data.abstract}}
    </span>
  </div>
  <Handle type="source" :position="Position.Bottom" :connectable="false" />
  <Handle type="target" :position="Position.Top" :connectable="false" />
</template>
<style scoped>
.line {
  display: block;
}
</style>