const { contextBridge, ipcRenderer } = require('electron');
// Electron preload.js use CommonJS syntax as default
console.log('Preload script load start');
contextBridge.exposeInMainWorld('electron', {
    fetchData: (endpoint, params) => ipcRenderer.invoke('fetch_data', endpoint, params),
    onLogMessage: (callback) => ipcRenderer.on('log-message', (event, message) => callback(message)),
});
console.log('Preload script load done');