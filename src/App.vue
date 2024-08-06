<script setup>
import Navigator from "./components/Navigator.vue";
import {RouterView} from "vue-router";
import {provide, ref} from "vue";
import {Message} from "view-ui-plus";
const env = ref({"frontend": {}, "backend": {}});
const targetEnv = ref({});
provide("env", env);
provide("targetEnv", targetEnv);
Message.config({duration: 5});
</script>

<template>
  <div class="app-container">
    <Navigator class="navigator"/>
    <RouterView v-if="targetEnv.value" class="router-view"/>
  </div>
</template>
<style>
html, body, #app {
  margin: 0;
  height: 100%;
}

#app {
  text-transform: uppercase;
  font-family: 'JetBrains Mono', monospace;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 使容器的高度占满整个视口 */
}

.navigator {
  flex-shrink: 0; /* 防止 Navigator 缩小 */
  /* 你可以在这里设置 Navigator 的高度 */
}

.router-view {
  flex-grow: 1; /* 使 RouterView 占据剩余的高度 */
  overflow: auto; /* 如果内容超出视口，添加滚动条 */
}
</style>