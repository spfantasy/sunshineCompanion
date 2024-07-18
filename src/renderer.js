import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import ViewUIPlus from 'view-ui-plus'
import 'view-ui-plus/dist/styles/viewuiplus.css'
import {basicSetup} from "codemirror";
import VueCodemirror from 'vue-codemirror'

const app = createApp(App)

app.use(router)
    .use(VueCodemirror, {
        tabSize: 2,
        placeholder: 'Code goes here...',
        extensions: [basicSetup]
    })
    .use(ViewUIPlus)
    .mount('#app')
