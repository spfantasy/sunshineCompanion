<script setup>
import {Icon, MenuItem, Space} from "view-ui-plus";
import {inject, onBeforeMount, ref} from "vue";
import {fetchJson} from "./electronAPI.js";
const targetEnvChoices = ref();
const targetEnv = inject("targetEnv");
const defaultTargetEnv = ref();
const env = inject("env");

async function fetchTargetData () {
  try {
    // 加载系统配置
    env.value =  await fetchJson("env.json5");
    console.log(env.value);
    // 加载右上角外系统环境
    targetEnvChoices.value = await fetchJson("targetEnv.json5");
    targetEnv.value = targetEnvChoices.value[0];
    defaultTargetEnv.value = targetEnv.value.value;
  } catch (error) {
    console.warn(`Error initializing navigator: [${error}] retry in 1s`);
    new Promise(resolve => setTimeout(resolve, 1000)).then(
        () => fetchTargetData()
    );
  }
}
onBeforeMount(fetchTargetData);
// onBeforeMount(async () => {await fetchTargetData()});

function targetEnvOnSelect(model) {
  for (let i = 0; i < targetEnvChoices.value.length; i++) {
    if (targetEnvChoices.value[i].value === model.value) {
      targetEnv.value = targetEnvChoices.value[i];
    }
  }
}

</script>
<template>
  <Menu v-if="defaultTargetEnv" theme="light" active-name="1" mode="horizontal" class="fixed-menu">
    <div class="menu-left">
      <MenuItem name="1">
        <RouterLink class="custom-link" to="/">
        <Icon type="ios-paper"/>
        服务状态
        </RouterLink>
      </MenuItem>
      <MenuItem name="2">
        <RouterLink class="custom-link" to="/flow">
        <Icon type="ios-git-merge" />
        调用流
        </RouterLink>
      </MenuItem>
    </div>
    <div class="menu-right">
      <Space>
        <Select v-model="defaultTargetEnv" @on-select="targetEnvOnSelect" :style="env.frontend.targetEnvStyle" prefix="md-code-working" filterable>
          <Option v-for="env in targetEnvChoices" :value="env.value" :label="env.label">
            <span>{{ env.label }}</span>
            <span style="float:right;color:#ccc">{{ env.value }}</span>
          </Option>
        </Select>
      </Space>
    </div>
  </Menu>
  <br>
</template>

<style scoped>
.menu-right {
  width: 300px;
  margin: 0 20px 0 auto;
}

.custom-link {
  color: inherit; /* 继承父元素的颜色 */
  text-decoration: none; /* 去掉下划线 */
  display: block;
  width: 100%;
  height: 100%;
}

.custom-link:hover, .custom-link:focus, .custom-link:active {
  color: inherit; /* 继承父元素的颜色 */
  text-decoration: none; /* 去掉下划线 */
}
.fixed-menu {
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000; /* 确保菜单在其他元素之上 */
}
</style>