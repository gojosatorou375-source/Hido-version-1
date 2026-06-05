import Store from 'electron-store';

export interface Settings {
  liquidDarkness: number;
  viewportSize: number;
  viscosity: number;
  waveIntensity: number;
  glassRim: boolean;
  sensorMode: 'auto' | 'tilt' | 'mouse';
  hotkey: string;
  startWithSystem: boolean;
  showTrayIcon: boolean;
  showViewport: boolean;
  iceMode: boolean;
  enableWaves: boolean;
  iceModeIntensity: number;
  enableMotion: boolean;
  autoHideIdle: boolean;
}

const schema = {
  liquidDarkness: {
    type: 'number',
    default: 0.88,
    minimum: 0.6,
    maximum: 0.97
  },
  viewportSize: {
    type: 'number',
    default: 0.52,
    minimum: 0.25,
    maximum: 0.72
  },
  viscosity: {
    type: 'number',
    default: 0.72,
    minimum: 0.4,
    maximum: 0.95
  },
  waveIntensity: {
    type: 'number',
    default: 0.03,
    minimum: 0.0,
    maximum: 0.08
  },
  glassRim: {
    type: 'boolean',
    default: true
  },
  sensorMode: {
    type: 'string',
    enum: ['auto', 'tilt', 'mouse'],
    default: 'auto'
  },
  hotkey: {
    type: 'string',
    default: 'CommandOrControl+Shift+P'
  },
  startWithSystem: {
    type: 'boolean',
    default: false
  },
  showTrayIcon: {
    type: 'boolean',
    default: true
  },
  showViewport: {
    type: 'boolean',
    default: false
  },
  iceMode: {
    type: 'boolean',
    default: true
  },
  enableWaves: {
    type: 'boolean',
    default: false
  },
  iceModeIntensity: {
    type: 'number',
    default: 0.5,
    minimum: 0.0,
    maximum: 1.0
  },
  enableMotion: {
    type: 'boolean',
    default: true
  },
  autoHideIdle: {
    type: 'boolean',
    default: true
  }
};

export const store = new Store<Settings>({ schema } as any);
