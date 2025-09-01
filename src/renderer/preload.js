const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Accessibility
  getAccessibilityStatus: () => ipcRenderer.invoke('get-accessibility-status'),
  requestAccessibility: () => ipcRenderer.invoke('request-accessibility'),

  // Message operations
  readMessages: (source) => ipcRenderer.invoke('read-messages', source),
  generateReplies: (context) => ipcRenderer.invoke('generate-replies', context),
  sendMessage: (message, target) => ipcRenderer.invoke('send-message', message, target),

  // Events
  onMessage: (callback) => ipcRenderer.on('new-message', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});