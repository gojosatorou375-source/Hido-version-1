import { ipcMain, BrowserWindow } from 'electron';
import { store, Settings } from './settingsStore';
import { TiltSensor } from './tiltSensor';
import { getOverlayWindow, toggleOverlay, isOverlayActive } from './overlayWindow';

export function setupIpcHandlers(tiltSensor: TiltSensor, getSettingsWindow: () => BrowserWindow | null) {
  // Overlay state toggling
  ipcMain.handle('overlay:toggle', () => {
    const active = toggleOverlay();
    // Rebuild tray menu checkboxes
    const { updateTrayMenu } = require('./trayManager');
    updateTrayMenu();
    return active;
  });

  ipcMain.handle('overlay:is-active', () => {
    return isOverlayActive();
  });

  // Settings IPC
  ipcMain.handle('settings:get-all', () => {
    return store.store;
  });

  ipcMain.handle('settings:set', (event, key: keyof Settings, value: any) => {
    store.set(key, value);

    // Notify all open windows of the settings change
    const overlayWin = getOverlayWindow();
    const settingsWin = getSettingsWindow();

    if (overlayWin && !overlayWin.isDestroyed()) {
      overlayWin.webContents.send('settings:changed', store.store);
    }
    if (settingsWin && !settingsWin.isDestroyed()) {
      settingsWin.webContents.send('settings:changed', store.store);
    }

    // If the sensorMode was changed, update the TiltSensor mode immediately
    if (key === 'sensorMode') {
      tiltSensor.setMode(value);
    }

    return { success: true };
  });

  // Mouse fallback position reports from overlay
  ipcMain.on('mouse:move', (event, data: { x: number; y: number; width: number; height: number }) => {
    tiltSensor.handleMouseMove(data.x, data.y, data.width, data.height);
  });
}
