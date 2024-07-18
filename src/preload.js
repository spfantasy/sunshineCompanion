const { contextBridge, ipcRenderer } = require('electron');
// Electron preload.js use CommonJS syntax as default
console.log('Preload script load start');
contextBridge.exposeInMainWorld('electron', {
    fetchData: (endpoint, params) => ipcRenderer.invoke('fetch_data', endpoint, params)
});
console.log('Preload script load done');