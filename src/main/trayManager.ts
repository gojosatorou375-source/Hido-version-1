import { Tray, Menu, dialog, app, nativeImage } from 'electron';
import * as path from 'path';
import { toggleOverlay, isOverlayActive, setOverlayActive, getOverlayWindow } from './overlayWindow';
import { openSettingsWindow } from './main';
import { store } from './settingsStore';

let tray: Tray | null = null;

// Base64 16x16 transparent PNGs for active and inactive tray states
const activeIconBase64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAYklEQVR42mNkQAO/gPA/EH8H4u9A/B+I0cVAfA6IzwNxAlScgZGBgQEuzsAIk2cECzDC5BnBAowwGSDPmAIOwKiBwWMAMgAPwBBDwB4s/ifG+H9ijB/B2EEA2eWjBrD4h4EBAPs5Pxt2tBvCAAAAAElFTkSuQmCC';
const inactiveIconBase64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAY0lEQVR42mNkQAO/gPA/EH8H4u9A/B+I0cVAfA6IzwNxAlScgZGBgQEuzsAIk2cECzDC5BnBAowwGSDPmAIOwKiBwWMAMgAPwBBDwB4s/ifG+H9ijB/B2EEA2eWjBrD4h4EBAPtDPxs38+vJAAAAAElFTkSuQmCC';

function getTrayIcon(active: boolean) {
  const base64Str = active ? activeIconBase64 : inactiveIconBase64;
  return nativeImage.createFromBuffer(Buffer.from(base64Str, 'base64'));
}

export function createTray() {
  if (tray) return tray;

  tray = new Tray(getTrayIcon(isOverlayActive()));
  tray.setToolTip('Hido Desktop');

  const updateMenu = () => {
    const active = isOverlayActive();
    tray?.setImage(getTrayIcon(active));

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Privacy Screen Active',
        type: 'checkbox',
        checked: active,
        click: () => {
          setOverlayActive(!active);
          updateMenu();
        }
      },
      {
        label: 'Enable Ice Mode',
        type: 'checkbox',
        checked: store.get('iceMode'),
        click: () => {
          const val = !store.get('iceMode');
          store.set('iceMode', val);
          const overlayWin = getOverlayWindow();
          if (overlayWin && !overlayWin.isDestroyed()) {
            overlayWin.webContents.send('settings:changed', store.store);
          }
          updateMenu();
        }
      },
      {
        label: 'Enable Liquid Waves',
        type: 'checkbox',
        checked: store.get('enableWaves'),
        click: () => {
          const val = !store.get('enableWaves');
          store.set('enableWaves', val);
          const overlayWin = getOverlayWindow();
          if (overlayWin && !overlayWin.isDestroyed()) {
            overlayWin.webContents.send('settings:changed', store.store);
          }
          updateMenu();
        }
      },
      { type: 'separator' },
      {
        label: 'Settings...',
        click: () => {
          openSettingsWindow();
        }
      },
      {
        label: 'About Hido',
        click: () => {
          dialog.showMessageBox({
            type: 'info',
            title: 'About Hido',
            message: 'Hido Desktop v1.0.0',
            detail: 'A cross-platform desktop privacy screen overlay using physics simulation.\n\nDeveloped with Electron + TypeScript.',
            buttons: ['OK']
          });
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        }
      }
    ]);

    tray?.setContextMenu(contextMenu);
  };

  tray.on('double-click', () => {
    toggleOverlay();
    updateMenu();
  });

  updateMenu();
  return tray;
}

export function updateTrayMenu() {
  if (tray) {
    const active = isOverlayActive();
    tray.setImage(getTrayIcon(active));
    createTray(); // Rebuild menu to update checkbox state
  }
}
