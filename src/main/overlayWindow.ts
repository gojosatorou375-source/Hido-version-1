import { BrowserWindow, screen } from 'electron';
import * as path from 'path';

let overlayWindow: BrowserWindow | null = null;
let isActive = false; // Start inactive

export function createOverlayWindow() {
  if (overlayWindow) return overlayWindow;

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;

  overlayWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    show: false, // Start completely hidden
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Enable mouse passthrough, but forward mouse events so we can track them
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  overlayWindow.loadFile(path.join(__dirname, '../../src/renderer/overlay.html'));
  overlayWindow.webContents.openDevTools({ mode: 'detach' });

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });

  return overlayWindow;
}

export function getOverlayWindow() {
  return overlayWindow;
}

export function toggleOverlay() {
  isActive = !isActive;
  if (overlayWindow) {
    if (isActive) {
      overlayWindow.show();
    } else {
      overlayWindow.hide();
    }
    overlayWindow.webContents.send('overlay:active', isActive);
  }
  return isActive;
}

export function setOverlayActive(active: boolean) {
  isActive = active;
  if (overlayWindow) {
    if (isActive) {
      overlayWindow.show();
    } else {
      overlayWindow.hide();
    }
    overlayWindow.webContents.send('overlay:active', isActive);
  }
}

export function isOverlayActive() {
  return isActive;
}
