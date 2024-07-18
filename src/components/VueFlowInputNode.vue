<script setup>
import { computed } from 'vue'
import {Handle, Position, useVueFlow} from '@vue-flow/core'
import {Message, Select, Space} from 'view-ui-plus';

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

const { findNode, updateNodeData, getConnectedEdges } = useVueFlow()

const selection = computed({
  get: () => props.data.selection,
  set: (selection) => updateNodeData(props.id, { selection: selection }),
})

/**
 * 输入是否锁定（是否作为下次查询的固定输入，而不是自动推导）
 */
const locked = computed({
  get: () => props.data.locked,
  set: (locked) => updateNodeData(props.id, { locked: locked }),
})

function propagateLock(nodeId) {
  const connections = getConnectedEdges(nodeId).filter((node) => node.target === nodeId);
  connections.forEach(connection => {
    const nodeType = findNode(connection.source).type;
    if (nodeType === 'input') {
      updateNodeData(connection.source, {locked: true});
    }
    propagateLock(connection.source);
  })
}

/* 修改输入选项会导致所有父节点(input)递归上锁
* */
function flowInputChange() {
  Message.info(`锁定 ${props.data.label} 及所有父节点变量`);
  locked.value = true;
  propagateLock(props.id);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    Message.info(`${text} 已复制到剪贴板`);
    // 你可以在这里显示一个提示信息，告诉用户文字已成功复制
  }).catch(err => {
    console.error('无法复制文字: ', err);
    // 你可以在这里显示一个错误信息，告诉用户文字复制失败
  });
}

function lockQuerySwitch() {
  locked.value = !locked.value;
}

function handleCreate(userDefinedValue) {
  if (props.data.choices == null) {
    props.data.choices = [];
  }
  props.data.choices.push({
    value: userDefinedValue,
    label: "?",
  })
}
</script>

<template>
  <span class="line" @click="copyToClipboard(selection)" style="color: royalblue">
    {{props.data.label}}
  </span>
  <br/>
  <span class="line">
    <Space>
      <Button shape="circle" @click="lockQuerySwitch" size="small" icon="ios-checkmark" v-if="locked" type="success"/>
      <Button shape="circle" @click="lockQuerySwitch" size="small" icon="ios-lock" v-if="!locked"/>
      <Select v-model="selection" size="small" style="width:100px" transfer
              :disabled="locked" @on-change="flowInputChange(props.data.value)"
              filterable allow-create @on-create="handleCreate">
        <Option v-for="item in props.data.choices" :value="item.value" :label="item.value">
          <span>{{ item.value }}</span>
          <span style="float:right;color:#ccc">{{ item.label }}</span>
        </Option>
      </Select>
    </Space>
  </span>

  <Handle type="source" :position="Position.Bottom" :connectable="false" />
  <Handle type="target" :position="Position.Top" :connectable="false" />
</template>
<style scoped>
.line {
  display: block;
}
</style>