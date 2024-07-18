<script setup>
import {inject, onMounted, ref, watch} from "vue";
import {Icon, List, ListItem, Space, Spin, Tooltip} from "view-ui-plus";
import axios from "axios";
const targetEnv = inject("targetEnv");
const serverConfig = ref({"services": []});
const env = inject("env");
const fetchTargetServices = async () => {
  try {
    // 加载服务列表
    serverConfig.value =  await window.electron.fetchData("json", {"filename": "targetService.json5"});
    broadcastServicesFormat();
    await broadcastHealthCheck();

  } catch (error) {
    console.error('Error fetching data: '+ error);
  }
};

async function healthCheck(url) {
  try {
    const response = await axios.get(url,{timeout: env.value.backend.targetStats.TimeoutMilliseconds});
    console.log(`await axios.get(${url},{timeout: ${env.value.backend.targetStats.TimeoutMilliseconds}})`);
    console.log(response.status);
    console.log(response.data);
    return [response.status, new Date().toLocaleString(), ""];
  } catch (errorInfo) {
    return [500, new Date().toLocaleString(), errorInfo];
  }

}

async function broadcastHealthCheck() {
  const promises = serverConfig.value.services.map(async item => {
    item.status = null;
    item.errorInfo = null;
    // time.sleep(200);
    await new Promise(r => setTimeout(r, env.value.backend.targetStats.reloadMilliseconds));
    const [status, lastUpdated, errorInfo] = await healthCheck(item.formatted);
    item.status = status;
    item.lastUpdated = lastUpdated;
    item.errorInfo = errorInfo;
  })
  await Promise.all(promises);
}

function formatUrl(template, params) {
  return template.replace(/\${(.*?)}/g, (match, p1) => params[p1] || '');
}

// 坚挺环境变化更新网址
function broadcastServicesFormat() {
  for (let i = 0; i < serverConfig.value.services.length; i++) {
    serverConfig.value.services[i].formatted = formatUrl(serverConfig.value.services[i].value, {targetEnv: targetEnv.value.dns});
    serverConfig.value.services[i].status = 0;
  }
}
watch(targetEnv, (newVal) => {
  broadcastServicesFormat();
});
onMounted(() => {
  fetchTargetServices();
  setInterval(broadcastHealthCheck, 1000 * env.value.backend.targetStats.refreshSeconds);
})

</script>

<template>
  <List border size="large" :header="'上次更新时间: ' + (serverConfig.services.length === 0 ? '更新中' : serverConfig.services[0].lastUpdated)">
    <ListItem v-for="server in serverConfig.services">
      <Tooltip :content="server.formatted">
        <Space>{{ server.label }}</Space>
      </Tooltip>
      <Tooltip :content="server.errorInfo">
        <Space>
          <div v-if="server.status == null" >
            <Spin />
          </div>
          <div v-if="server.status != null">
            <Icon v-if="server.status === 0" color="orange" type="ios-loading" />
            <Icon v-if="server.status === 200" color="green" type="md-checkmark-circle" />
            <Icon v-if="server.status === 500" color="red" type="md-close-circle" />
          </div>
        </Space>
      </Tooltip>
    </ListItem>
  </List>
</template>

<style scoped>

</style>