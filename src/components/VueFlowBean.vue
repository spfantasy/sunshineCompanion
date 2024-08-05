<script setup>
import {nextTick, inject, ref, onMounted} from 'vue'
import { VueFlow, useVueFlow, Panel } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { ControlButton, Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';
import '@vue-flow/minimap/dist/style.css';
import '@vue-flow/node-resizer/dist/style.css';
import {Drawer, Message, Space, Icon} from "view-ui-plus";
import DynamicComponent from "./DynamicComponent.vue";
import JSON5 from 'json5';
import VueFlowInputNode from "./VueFlowInputNode.vue";
import { useLayout } from './VueFlowShuffle.js'
import VueFlowOutputNode from "./VueFlowOutputNode.vue";
import VueFlowNodeDetail from "./VueFlowNodeDetail.vue";
import {dumpFlow, listNode} from "./electronAPI.js";

const { onInit, onNodeDragStop, addNodes, addEdges, removeNodes, removeEdges, setViewport, toObject, fitView, updateNode } = useVueFlow()
const { layout } = useLayout();

const nodes = ref([]);
const edges = ref([]);
const targetEnv = inject("targetEnv");
const openDetail = ref(false);
const drawerData = ref({});
const ctx = ref({});
const query = ref({});
const env = inject("env");
const focus = ref(null);
const focusList = ref([])
const detailValue = ref("");
const detailAllowCancel = ref(false);
const detailAllowDelete = ref(false);
const detailAllowSubmit = ref(false);
const detailHeader = ref("");
const nodeSearching = ref(false);
const rendering = ref(false);
const detailActive = ref(false);
// const dark = ref(false)

/**
 * This is a Vue Flow event-hook which can be listened to from anywhere you call the composable, instead of only on the main component
 * Any event that is available as `@event-name` on the VueFlow component is also available as `onEventName` on the composable and vice versa
 *
 * onInit is called when the VueFlow viewport is initialized
 */
onInit((vueFlowInstance) => {
  // instance is the same as the return of `useVueFlow`
  vueFlowInstance.fitView()
})

onMounted(() => {
  renderFlow();
  searchFocusNode("");
});
/**
 * onNodeDragStop is called when a node is done being dragged
 *
 * Node drag events provide you with:
 * 1. the event object
 * 2. the nodes array (if multiple nodes are dragged)
 * 3. the node that initiated the drag
 * 4. any intersections with other nodes
 */
onNodeDragStop(({ event, nodes, node }) => {
  console.log('Node Drag Stop', { event, nodes, node })
})


/**
 * To update a node or multiple nodes, you can
 * 1. Mutate the node objects *if* you're using `v-model`
 * 2. Use the `updateNode` method (from `useVueFlow`) to update the node(s)
 * 3. Create a new array of nodes and pass it to the `nodes` ref
 */
function updatePos() {
  nodes.value = nodes.value.map((node) => {
    return {
      ...node,
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
    }
  })
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * toObject transforms your current graph data to an easily persist-able object
 */
async function renderFlow() {
  try {
    nodes.value.forEach(node => {
      if (node.data.locked === true) {
        query.value[node.id] = node.data.selection;
      }
    })
    removeNodes(nodes.value);
    removeEdges(edges.value);
    const params = {
      "env": targetEnv.value.value,
      "query": JSON5.stringify(query.value),
      "focus": focus.value,
    }
    console.log("render flow params="+JSON5.stringify(params));
    ctx.value = await window.electron.fetchData("renderFlow", params);
    addNodes(ctx.value.nodes);
    addEdges(ctx.value.edges);
    query.value = {};
    // update node position
    const positions = layout(ctx.value.nodes, ctx.value.edges);
    positions.forEach(p => {
      updateNode(p.id, {position: p.position});
    })
    await nextTick(() => {
      fitView({maxZoom: 2, minZoom: 0.2})
    })
  } catch (error) {
    console.error(error.message);
    Message.error(error.message);
  }
}
async function dumpNodeList() {
  try {
    await dumpFlow();
    Message.success("已更新flowMeta.json5")
  } catch (error) {
    console.error(error.message);
    Message.error(error.message);
  }
}
async function renderFlowAPI() {
  rendering.value = true;
  const minDurationPromise = sleep(1000);
  await Promise.all([renderFlow(), minDurationPromise]);
  rendering.value = false;
}

async function searchFocusNode(keyword) {
  try {
    nodeSearching.value = true;
    focusList.value = await listNode(keyword);
    console.log(focusList.value);
    nodeSearching.value = false;
  } catch (error) {
    nodeSearching.value = false;
    console.error(error.message);
    Message.error(error.message);
  }
}

function renderDrawer(data) {
  if (data != null) {
    drawerData.value = data;
    openDetail.value = true;
  }
}

function logToObject() {
  console.log(toObject())
}

/**
 * Resets the current viewport transformation (zoom & pan)
 */
function resetTransform() {
  setViewport({ x: 0, y: 0, zoom: 1 })
}

async function addCustomNode() {
  detailValue.value = "";
  detailAllowCancel.value = true;
  detailAllowSubmit.value = true;
  detailAllowDelete.value = false;
  detailHeader.value = '新增节点';
  detailActive.value = true;
}

async function duplicateCustomNode() {
  if (focus.value == null || focus.value === "") {
    Message.warning("请选中焦点");
  } else {
    detailValue.value = focus.value;
    detailAllowCancel.value = true;
    detailAllowSubmit.value = true;
    detailAllowDelete.value = false;
    detailHeader.value = '复制节点';
    detailActive.value = true;
  }
}

async function modifyCustomNode() {
  if (focus.value == null || focus.value === "") {
    Message.warning("请选中焦点");
  } else {
    detailValue.value = focus.value;
    detailAllowCancel.value = true;
    detailAllowSubmit.value = true;
    detailAllowDelete.value = true;
    detailHeader.value = `修改节点${focus.value}`;
    detailActive.value = true;
  }
}

async function closePanel() {
  detailActive.value = false;
  await searchFocusNode("");
}

</script>

<template>
  <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      class="biz-flow"
      :default-viewport="{ zoom: 1.5 }"
      :min-zoom="0.2"
      :max-zoom="4"
  >
    <Background pattern-color="#aaa" :gap="16" />

    <template #node-input="props">
      <VueFlowInputNode :id="props.id" :data="props.data"/>
    </template>
    <template #node-output="props">
      <VueFlowOutputNode :id="props.id" :data="props.data" @render-component="renderDrawer"/>
    </template>
    <Controls position="top-left">
      <ControlButton title="DEBUG" @click="logToObject">
        <Icon type="ios-bug-outline" />
      </ControlButton>
      <ControlButton title="落盘" @click="dumpNodeList">
        <Icon type="ios-download-outline" />
      </ControlButton>
      <ControlButton title="新增" @click="addCustomNode">
        <Icon type="ios-add" />
      </ControlButton>
      <ControlButton title="修改" @click="modifyCustomNode" v-if="focus !== ''">
        <Icon type="ios-create-outline" />
      </ControlButton>
      <ControlButton title="复制" @click="duplicateCustomNode" v-if="focus !== '' && focus != null">
        <Icon type="ios-copy-outline" />
      </ControlButton>
    </Controls>
    <Panel position="top-right">
      <Space>
        焦点：
        <Select v-model="focus" filterable
                prefix="ios-locate-outline" style="width:300px; text-align:left" clearable>
          <Option v-for="(option, index) in focusList" :value="option.value" :label="option.label" :key="index">
            <span>{{ option.label }}</span>
            <span style="float:right;color:#ccc">{{ option.value }}</span>
          </Option>
        </Select>
      </Space>
    </Panel>
    <Panel position="top-center">
      <Button size="large" type="primary" shape="circle" icon="ios-search" @click=renderFlowAPI :loading="rendering" />
    </Panel>
  </VueFlow>
  <Drawer :closable="false" width="640" v-model="openDetail" draggable>
    <DynamicComponent :componentData="drawerData"></DynamicComponent>
  </Drawer>
  <VueFlowNodeDetail :node-value="detailValue" :active="detailActive" @on-panel-close="closePanel"
                     :allow-cancel="detailAllowCancel" :allow-delete="detailAllowDelete"
                     :allow-submit="detailAllowSubmit" :header="detailHeader" />
</template>
<style>
/* 小地图 */
.vue-flow__minimap {
  transform: scale(75%);
  transform-origin: bottom right;
}
/* 连接点 */
.vue-flow__handle {
  height:10px;
  width:24px;
  background:#aaa;
  border-radius:4px
}
/* node */
.vue-flow__node {
  background-color:#f3f4f6
}
/* 输入类node */
.vue-flow__node-input {
  gap:8px;
  padding: 20px 5px;
  border-radius:8px;
  box-shadow:0 0 10px #0003
}

.vue-flow__node-input.selected {
  box-shadow:0 0 0 2px !important;
}


</style>