import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import * as path from 'path';
import { createOverlayWindow, toggleOverlay, getOverlayWindow, setOverlayActive } from './overlayWindow';
import { createTray, updateTrayMenu } from './trayManager';
import { TiltSensor } from './tiltSensor';
import { setupIpcHandlers } from './ipcHandlers';
import { store } from './settingsStore';

let settingsWindow: BrowserWindow | null = null;
let tiltSensor: TiltSensor;

export function openSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 500,
    height: 700,
    resizable: false,
    maximizable: false,
    title: 'Hido Settings',
    icon: path.join(__dirname, '../../src/renderer/logo.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  settingsWindow.setMenu(null);
  settingsWindow.loadFile(path.join(__dirname, '../../src/renderer/settings.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function registerGlobalHotkeys() {
  globalShortcut.unregisterAll();

  // Overlay Toggle Hotkey
  const toggleKey = store.get('hotkey') || 'CommandOrControl+Shift+P';
  try {
    globalShortcut.register(toggleKey, () => {
      toggleOverlay();
      updateTrayMenu();
    });
  } catch (err) {
    console.error(`Failed to register toggle hotkey: ${toggleKey}`, err);
  }

  // Settings Hotkey (Ctrl+Shift+S / Cmd+Shift+S)
  try {
    globalShortcut.register('CommandOrControl+Shift+S', () => {
      openSettingsWindow();
    });
  } catch (err) {
    console.error('Failed to register settings hotkey', err);
  }
}

function updateLoginSettings() {
  const startWithSystem = store.get('startWithSystem');
  app.setLoginItemSettings({
    openAtLogin: startWithSystem,
    path: app.getPath('exe')
  });
}

const isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Show settings or activate overlay if already running
    openSettingsWindow();
  });

  app.whenReady().then(() => {
    // 1. Create windows
    createOverlayWindow();

    // 2. Open Settings Window automatically on startup for user-friendly configuration
    openSettingsWindow();

    // 3. Initialize telemetry/sensors
    tiltSensor = new TiltSensor();
    tiltSensor.setMode(store.get('sensorMode') || 'auto');

    // 4. Connect sensor tilt events to overlay window
    tiltSensor.on('tilt', (tilt) => {
      const overlayWin = getOverlayWindow();
      if (overlayWin && !overlayWin.isDestroyed()) {
        overlayWin.webContents.send('sensor:tilt', tilt);
      }
    });

    // 5. Setup IPC & Tray
    setupIpcHandlers(tiltSensor, () => settingsWindow);
    createTray();

    // 6. Register Hotkeys & System settings
    registerGlobalHotkeys();
    updateLoginSettings();

    // Watch for config changes in main process
    store.onDidChange('hotkey', () => {
      registerGlobalHotkeys();
    });
    store.onDidChange('startWithSystem', () => {
      updateLoginSettings();
    });
  });
}

app.on('will-quit', () => {
  if (tiltSensor) {
    tiltSensor.stop();
  }
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // Overrides default behavior to keep app running in system tray
  if (process.platform !== 'darwin') {
    // Don't quit, keep tray active
  }
});
