import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  getSettings: () => ipcRenderer.invoke('settings:get-all'),
  setSetting: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
  toggleOverlay: () => ipcRenderer.invoke('overlay:toggle'),
  isOverlayActive: () => ipcRenderer.invoke('overlay:is-active'),
  onSettingsChanged: (callback: (settings: any) => void) => {
    const subscription = (_event: any, settings: any) => callback(settings);
    ipcRenderer.on('settings:changed', subscription);
    return () => ipcRenderer.removeListener('settings:changed', subscription);
  },
  onTilt: (callback: (tilt: { x: number; y: number }) => void) => {
    const subscription = (_event: any, data: { x: number; y: number }) => callback(data);
    ipcRenderer.on('sensor:tilt', subscription);
    return () => ipcRenderer.removeListener('sensor:tilt', subscription);
  },
  sendMouseMove: (x: number, y: number, width: number, height: number) => {
    ipcRenderer.send('mouse:move', { x, y, width, height });
  },
  onActiveStateChange: (callback: (active: boolean) => void) => {
    const subscription = (_event: any, active: boolean) => callback(active);
    ipcRenderer.on('overlay:active', subscription);
    return () => ipcRenderer.removeListener('overlay:active', subscription);
  }
});
