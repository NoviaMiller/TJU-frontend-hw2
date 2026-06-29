import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import { pinia } from './stores/pinia'
import './styles.css'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')
