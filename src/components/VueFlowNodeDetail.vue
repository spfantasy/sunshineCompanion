<script setup>
import {
  Card, Col,
  Divider,
  FormItem,
  Icon,
  InputNumber,
  Message,
  Modal,
  Radio,
  RadioGroup,
  Row,
  Space,
  Switch, Tooltip
} from "view-ui-plus";
import {ref, reactive, computed, inject} from "vue";
import CodeMirrorComponent from "./CodeMirrorComponent.vue";

import JSON5 from "json5";
import {addOrUpdateNode, deleteNode, getNode, listNode} from "./electronAPI.js";


const emit = defineEmits(['on-panel-close']);

async function closePanel () {
  emit('on-panel-close', false);
};

const props = defineProps({
  header: {
    type: String,
    required: true,
  },
  allowSubmit: {
    type: Boolean,
    required: true,
  },
  allowDelete: {
    type: Boolean,
    required: true,
  },
  allowCancel: {
    type: Boolean,
    required: true,
  },
  active: {
    type: Boolean,
    required: true,
  },
  nodeValue: {
    type: String,
    required: true,
  },
})
async function fillData (open) {
  if (open) {
    if (props.nodeValue === "") {
      console.log("[Panel] initialize data");
      data.value = JSON5.parse(JSON5.stringify(blankData.value));
      successExpressionSwitchOrigin.value = false;
    } else {
      console.log("[Panel] rendering data");
      await loadNode(props.nodeValue);
    }
  }
}
const blankData = ref({
  value: null,
  label: null,
  type: "input",
  inDegree: null,
  circuitBreaker: false,
  parents: [],
  inference: {
    retrievers: [],
    component: {},
    success: ""
  }
});
const data = ref(JSON5.parse(JSON5.stringify(blankData.value)));
const jsonError = ref("");
const loading = ref(false);
const rules = ref({});
const parentList = ref([]);
const targetEnv = inject("targetEnv");
const datasourceChoices = computed({
  get() {
    const list = targetEnv.value?.datasource || [];
    return list.map((item) => {
      return {
        value: item.value,
        label: item.label,
      }
    });
  }
})
const exampleComponent = ref({
  "type": 'div',
  "children": [
    {
      "type": "Row",
      "children": [
        {
          "type": "Col",
          "span": "4",
          "innerHTML": "`解析写入的内容:${ctx.outputModule1?.data?.attr1}`"
        },
        {
          "type": "Col",
          "span": "20",
          "innerHTML": "`456:${ctx.outputModule1?.data?.attr2}`"
        }
      ]
    },
    {
      "type": "Row",
      "children": [
        {
          "type": "Col",
          "span": "24",
          "innerHTML": "非HTML标签基于view-ui-plus，请查询官方文档"
        }
      ]
    }
  ]
});
const dataType = computed({
  get() {
    return data.value.type;
  },
  set(newValue) {
      data.value.type = newValue;
      if (newValue === 'input') {
        data.value.inference.component = null;
      } else {
        data.value.inference.component = JSON5.parse(JSON5.stringify(exampleComponent.value));
      }
  }
})
const inDegree = computed({
  get() {
    return data.value.inDegree;
  },
  set(newValue) {
    if (newValue < 0) {
      data.value.inDegree = null;
    } else {
      data.value.inDegree = newValue;
    }
  }
})
const componentString = computed({
  get() {
    // 由于linter不支持JSON5，所以序列化为JSON
    return JSON.stringify(data.value.inference?.component || {}, null, 2);
  },
  set(newValue) {
    // 前端写入JSON5的字符串后可以成功解析为对象，但前端展示为JSON格式
    try {
      data.value.inference.component = JSON5.parse(newValue);
      jsonError.value = null;
    } catch (e) {
      jsonError.value = e.message;
    }
  }
});
const isSuccessExpression = computed({
  get() {
    return data.value?.inference?.success
  },
  set(newValue) {
    if (newValue === undefined || newValue === null || newValue === "") {
      data.value.inference.success = null;
    } else {
      data.value.inference.success = newValue;
    }
  }
})
const successExpressionSwitchOrigin = ref(false);
const successExpressionSwitch = computed({
  get() {
    return successExpressionSwitchOrigin.value;
  },
  set(newValue) {
    successExpressionSwitchOrigin.value = newValue;
    if (newValue === false) {
      isSuccessExpression.value = null;
    }
  }
})

function enableInDegree() {
  inDegree.value = data.value.parents?.length || 0;
}
async function loadNode(nodeName) {
  try {
    data.value = await getNode(nodeName);
    successExpressionSwitchOrigin.value = isSuccessExpression.value != null;
    await searchParentNode("");
  } catch (error) {
    console.error(error.message);
    Message.error(error.message);
  }
}

async function searchParentNode(keyword) {
  try {
    loading.value = true;
    parentList.value = await listNode(keyword);
    loading.value = false;
  } catch (error) {
    loading.value = false;
    console.error(error.message);
    Message.error(error.message);
  }
}

async function appendRetrievers() {
  if (data.value.inference == null) {
    data.value.inference = {}
  }
  if (data.value.inference.retrievers == null) {
    data.value.inference.retrievers = []
  }
  data.value.inference.retrievers.push({
    datasource: null,
    query: null,
    sink: [],
  })
}

async function popRetrievers(index) {
  data.value.inference.retrievers.splice(index, 1);
}

async function appendSinkers(index) {
  if (data.value.inference.retrievers[index].sink == null) {
    data.value.inference.retrievers[index].sink = []
  }
  data.value.inference.retrievers[index].sink.push({
    if: null,
    statement: null,
  })
}

async function popSinkers(index, index2) {
  data.value.inference.retrievers[index].sink.splice(index2, 1);
}

async function cleanSinkerIf(i1, i2) {
  if(data.value.inference.retrievers[i1].sink[i2].if === '') {
    data.value.inference.retrievers[i1].sink[i2].if = null;
  }
}

async function appendParams(index) {
  if (data.value.inference.retrievers[index].queryParams == null) {
    data.value.inference.retrievers[index].queryParams = []
  }
  data.value.inference.retrievers[index].queryParams.push("");
}

async function popParams(index, index2) {
  data.value.inference.retrievers[index].queryParams.splice(index2, 1);
}

async function submit() {
  try {
    loading.value = true;
    console.log(data.value);
    await addOrUpdateNode(JSON5.stringify(data.value));
    loading.value = false;
    Message.info("新增/修改节点成功");
    await closePanel();
  } catch (error) {
    loading.value = false;
    console.error(error.message);
    Message.error(error.message);
  }
}

async function del() {
  try {
    loading.value = true;
    console.log(data.value);
    await deleteNode(data.value.value);
    loading.value = false;
    Message.info("删除节点成功");
    await closePanel();
  } catch (error) {
    loading.value = false;
    console.error(error.message);
    Message.error(error.message);
  }
}

async function cancel() {
  loading.value = false;
  await closePanel();
}

// https://rennzhang.github.io/codemirror-editor-vue3/zh-CN/guide/getting-started

const cmOptions = reactive({
  mode: "application/json",
  lineNumbers: true,
  lineWiseCopyCut: true,
  gutters: ["CodeMirror-lint-markers"],
  lint: true,
  theme: "yeti"
});

</script>

<template>
  <Modal v-model="props.active" width="80" :mask-closable="false" @on-visible-change="fillData" :closable="false">
    <template #header>
      <p style="text-align:center">
        <span>{{ props.header }}</span>
      </p>
    </template>
    <div>
      <Form :model="data" :rules="rules" :label-width="80">
        <FormItem prop="value" label="节点id"
                  :rules="[{ required: true, pattern: '^[a-zA-Z0-9]*$', message: '节点id不能为空，只能由字母数字组成', trigger: 'change' }]">
          <Row :gutter="16">
            <Col flex="1">
              <Input v-model="data.value" placeholder="inputNode"/>
            </Col>
            <Col flex="1">
              <Tooltip transfer max-width="200" content="节点主键，请输入只包含字母数字的内容" placement="top">
                <Icon type="ios-help-circle"/>
              </Tooltip>
            </Col>
          </Row>
        </FormItem>
        <FormItem prop="label" label="节点名称"
                  :rules="[{ required: true, pattern: '^[a-zA-Z0-9\u4E00-\u9FFF-]*$', message: '节点名称不能为空,且不包含-以外的特殊符号', trigger: 'change' }]">
          <Row :gutter="16">
            <Col flex="1">
              <Input v-model="data.label" placeholder="模块-场景-子模块-流程" />
            </Col>
            <Col flex="1">
              <Tooltip transfer max-width="200" content="节点中文名称，如‘模块-场景-子模块-流程’" placement="top">
                <Icon type="ios-help-circle"/>
              </Tooltip>
            </Col>
          </Row>
        </FormItem>
        <FormItem prop="value" label="节点类型">
          <Row :gutter="16">
            <Col>
              <RadioGroup v-model="dataType" type="button" button-style="solid">
                <Radio label="input">输入</Radio>
                <Radio label="output">输出</Radio>
              </RadioGroup>
            </Col>
            <Col>
              <Tooltip transfer max-width="200" content="输入节点：包含搜索框（备选项=choices，选中项=selection），请提供choices:[{value: xxx, label: yyy}] 和 selection: someValue；输出节点：包含摘要abstract和边栏，请提供abstract=someString和边栏json" placement="top">
                <Icon type="ios-help-circle"/>
              </Tooltip>
            </Col>
          </Row>
        </FormItem>
        <FormItem prop="parents" label="父节点">
          <Row :gutter="16">
            <Col flex="9">
              <Select v-model="data.parents" multiple filterable>
                <Option v-for="(option, index) in parentList" :value="option.value" :key="index">{{option.label}}</Option>
              </Select>
            </Col>
            <Col flex="1">
              <Tooltip transfer max-width="200" content="父节点会阻碍节点的运行（例如存在数据上的依赖），当成功的父节点数>=入度时触发该节点的执行" placement="top">
                <Icon type="ios-help-circle"/>
              </Tooltip>
            </Col>
          </Row>
        </FormItem>
        <FormItem prop="inDegree" label="入度">
          <Row :gutter="16">
            <Col>
              <div v-if="inDegree == null">
                等于父节点数
                <Button type="dashed" @click="enableInDegree">切换</Button>
              </div>
              <div v-if="inDegree != null">
                <InputNumber controls-outside :min="-1" :max="data.parents?.length || 0" v-model="inDegree"/>
              </div>
            </Col>
            <Col>
              <Tooltip transfer max-width="200" content="默认为父节点数目（父节点都成功后触发该节点），覆盖后，x个父节点成功后即可触发该节点执行（请自行保证数据依赖关系）" placement="top">
                <Icon type="ios-help-circle"/>
              </Tooltip>
            </Col>
          </Row>
        </FormItem>
        <FormItem prop="circuitBreaker" label="熔断">
          <Row :gutter="16">
            <Col>
              <Switch true-color="#19be6b" false-color="#ed4014" v-model="data.circuitBreaker"/>
            </Col>
            <Col>
              <Tooltip transfer max-width="200" content="配置熔断后，执行失败不显示该节点以及下游节点（适用于分支判断逻辑，为N选1的节点都配置为熔断）；此特性也会影响焦点的展示逻辑" placement="top">
                <Icon type="ios-help-circle"/>
              </Tooltip>
            </Col>
          </Row>
        </FormItem>
        <Divider orientation="left">推断</Divider>
        <template v-for="(retriever, i1) in data.inference?.retrievers || []">
          <Row justify="center" align="middle" :gutter="16">
            <Col flex="9">
              <Card>
                <FormItem label="数据源" :prop="'inference.retrievers.' + i1 + '.datasource'">
                  <Row :gutter="16">
                    <Col>
                      <Select v-model="retriever.datasource">
                        <Option v-for="(option, index) in datasourceChoices" :value="option.value" :key="index">{{option.label}}</Option>
                      </Select>
                    </Col>
                    <Col>
                      <Tooltip transfer max-width="200" content="配置文件中当前环境的数据源(MYSQL/REDIS/...)" placement="top">
                        <Icon type="ios-help-circle"/>
                      </Tooltip>
                    </Col>
                  </Row>
                </FormItem>
                <FormItem label="查询语句" :prop="'inference.retrievers.' + i1 + '.query'"
                          :rules="[{ required: true, message: '查询语句不能为空', trigger: 'change' }]">
                  <Row :gutter="16">
                    <Col flex="2">
                      <Input v-model="retriever.query" type="textarea"
                             placeholder="SELECT CAST(id AS CHAR) AS value, CONCAT('标签', string_field) AS label FROM my_table WHERE `key` = ?"/>
                    </Col>
                    <Col flex="1">
                      <Tooltip transfer max-width="200" content="用`?`替换变量的查询语句" placement="top">
                        <Icon type="ios-help-circle"/>
                      </Tooltip>
                    </Col>
                  </Row>
                </FormItem>
                <template v-for="(queryParam, i3) in retriever.queryParams">
                  <FormItem label="查询参数" :prop="'inference.retrievers.' + i1 + '.queryParams.' + i3">
                    <Row :gutter="16">
                      <Col flex="9">
                        <Input v-model="retriever.queryParams[i3]" />
                      </Col>
                      <Col flex="1">
                        <Tooltip transfer v-if="i3 === 0" max-width="200" content="变量名称或表达式， 如ctx.inputModule1.selection 或1+1" placement="top">
                          <Icon type="ios-help-circle"/>
                        </Tooltip>
                      </Col>
                      <Col flex="1">
                        <Button shape="circle" type="error" icon="md-trash" @click="popParams(i1, i3)"></Button>
                      </Col>
                    </Row>
                  </FormItem>
                </template>
                <Button type="dashed" icon="md-add" @click="appendParams(i1)">新增参数</Button>
                <template v-for="(sinker, i2) in retriever.sink">
                  <FormItem label="写入" :prop="'inference.retrievers.' + i1 + '.sink.' + i2 + '.statement'"
                            :rules="[{ required: true, message: '写入语句不能为空', trigger: 'change' }]">
                    <Row :gutter="16">
                      <Col flex="9">
                        <Input v-model="sinker.statement" type="textarea"
                               placeholder="ctx.inputModule2.selection = ctx.inputModule2?.queryResult?.[0]?.value"/>
                      </Col>
                      <Col flex="1">
                        <Tooltip transfer max-width="200" content="将查询结果写回ctx，query结果默认暂存在queryResult中" placement="top">
                          <Icon type="ios-help-circle"/>
                        </Tooltip>
                      </Col>
                      <Col flex="1">
                        <Button shape="circle" type="error" icon="md-trash" @click="popSinkers(i1, i2)"></Button>
                      </Col>
                    </Row>
                  </FormItem>
                  <FormItem label="当" :prop="'inference.retrievers.' + i1 + '.sink.' + i2 + '.if'">
                    <Row :gutter="16">
                      <Col flex="9">
                        <Input v-model="sinker.if" @on-change="cleanSinkerIf(i1, i2)"
                               type="textarea"  placeholder="不填默认总是生效"/>
                      </Col>
                      <Col flex="1">
                        <Tooltip transfer max-width="200" content="写入逻辑生效的条件，如ctx.inputModule2.selection === ctx.inputModule2.selection" placement="top">
                          <Icon type="ios-help-circle"/>
                        </Tooltip>
                      </Col>
                    </Row>
                  </FormItem>
                </template>
                <Button type="dashed" icon="md-add" @click="appendSinkers(i1)">新增写入</Button>
              </Card>
            </Col>
            <Col flex="1">
              <Button shape="circle" type="error" icon="md-trash" @click="popRetrievers(i1)"></Button>
            </Col>
          </Row>
          <br>
        </template>
        <Button type="dashed" icon="md-add" @click="appendRetrievers">新增读取</Button>
        <FormItem prop="inference.component" label="边栏" v-if="data.type === 'output'">
          <Row justify="center" align="middle" :gutter="16">
            <Col flex="9">
<!--              <Codemirror-->
<!--                  v-model:value="componentString"-->
<!--                  :options="cmOptions"-->
<!--                  height="400px"-->
<!--                  width="100%"-->
<!--                  class="cm-component"-->
<!--                  :border="true"-->
<!--              />-->
              <CodeMirrorComponent v-model="componentString"/>
            </Col>
            <Col flex="1">
              <Tooltip transfer max-width="200" content="用于渲染边栏的内容，支持view-ui-plus的Row, Col, Grid, GridItem, Divider, Ellipsis, Tabs, TabPane, Timeline, TimelineItem, Numeral组件，以及html默认组件。请参考示例中的逻辑" placement="top">
                <Icon type="ios-help-circle"/>
              </Tooltip>
            </Col>
          </Row>
        </FormItem>
        <FormItem prop="inference.success" label="是否成功">
          <Row :gutter="16">
            <Col>
              <Switch size="large" true-color="#ff9900" false-color="#19be6b" v-model="successExpressionSwitch" >
                <template #open>
                  <span>当</span>
                </template>
                <template #close>
                  <span>总是</span>
                </template>
              </Switch>
            </Col>
            <Col>
              <Input style="width: 400px" v-if="successExpressionSwitch" v-model="isSuccessExpression" placeholder="1 + 1 === 2 或 ctx.currentNode.a.b === 'something'"/>
            </Col>
            <Col>
              <Tooltip transfer max-width="200" content="当前节点成功后才可以触发下游节点，默认总是成功" placement="top">
                <Icon type="ios-help-circle"/>
              </Tooltip>
            </Col>
          </Row>
        </FormItem>
      </Form>
    </div>
    <template #footer>
      <Space>
        <Button type="primary" size="large" :loading="loading" @click="submit">提交</Button>
        <Button type="error" size="large" :loading="loading" @click="del">删除</Button>
        <Button size="large" :loading="loading" @click="cancel">取消</Button>
      </Space>
    </template>
  </Modal>
</template>

<style scoped>

</style>