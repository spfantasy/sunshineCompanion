<template>
  <codemirror
      v-model="props.modelValue"
      placeholder="Code goes here..."
      :style="{ height: '400px' }"
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="2"
      :extensions="extensions"
      @ready="handleReady"
      @change="onInput($event)"
      @focus="log('focus', $event)"
      @blur="log('blur', $event)"
  />
</template>

<script setup>
  import { ref, shallowRef } from 'vue'
  import { Codemirror } from 'vue-codemirror'
  import { json } from '@codemirror/lang-json'
  import { oneDark } from '@codemirror/theme-one-dark'

  const code = ref(`console.log('Hello, world!')`)
  // 定义 props 接受 modelValue
  const props = defineProps({
    modelValue: {
      type: String,
      required: true
    }
  });

  // 定义 emits 以支持更新 modelValue
  const emit = defineEmits(['update:modelValue']);

  // 处理输入事件
  const onInput = (event) => {
    emit('update:modelValue', event);
  };

  const extensions = [json(), oneDark]

  // Codemirror EditorView instance ref
  const view = shallowRef()
  const handleReady = (payload) => {
    view.value = payload.view
  }

  // Status is available at all times via Codemirror EditorView
  const getCodemirrorStates = () => {
    const state = view.value.state
    const ranges = state.selection.ranges
    const selected = ranges.reduce((r, range) => r + range.to - range.from, 0)
    const cursor = ranges[0].anchor
    const length = state.doc.length
    const lines = state.doc.lines
    // more state info ...
    // return ...
  }
  // 提供 log 函数
  const log = console.log
</script>