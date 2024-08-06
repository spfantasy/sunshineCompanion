import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import ViewUIPlus from 'view-ui-plus'
import 'view-ui-plus/dist/styles/viewuiplus.css'
import {basicSetup} from "codemirror";
import VueCodemirror from 'vue-codemirror'

window.electron.onLogMessage((message) => {
    console.log(message);
});

const app = createApp(App)
// 忽略非 prop 属性警告
app.config.warnHandler = (msg, vm, trace) => {
    if (msg.includes('Extraneous non-props attributes')) {
        return;
    }
    console.warn(msg + trace);
};

app.use(router)
    .use(VueCodemirror, {
        tabSize: 2,
        placeholder: 'Code goes here...',
        extensions: [basicSetup]
    })
    .use(ViewUIPlus)
    .mount('#app')
