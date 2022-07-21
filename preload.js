const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld("electronAPI", {
    handleAppLaunch: (callback) => ipcRenderer.on('update-url', callback)
})
