const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('family', {
  call: async (operation, input) => {
    const response = await ipcRenderer.invoke('family-operation', operation, input);
    if (!response.ok) throw new Error(response.error);
    return response.value;
  }
});
