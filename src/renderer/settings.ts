class SettingsLiquidPhysics {
  public liquidCX = 0;
  public liquidCY = 0;
  public velocityX = 0;
  public velocityY = 0;
  public waveAmplitude = 0;
  public wavePhase = 0;

  private readonly k = 8.0;
  private readonly dt = 0.016;

  constructor() {}

  public update(tiltX: number, tiltY: number, viscosity: number) {
    const damping = viscosity;

    const forceX = (tiltX * this.k) - (this.liquidCX * this.k) - (this.velocityX * damping);
    const forceY = (tiltY * this.k) - (this.liquidCY * this.k) - (this.velocityY * damping);

    this.velocityX += forceX * this.dt;
    this.velocityY += forceY * this.dt;

    this.liquidCX += this.velocityX * this.dt;
    this.liquidCY += this.velocityY * this.dt;

    const maxShift = 0.4;
    if (this.liquidCX < -maxShift) {
      this.liquidCX = -maxShift;
      this.velocityX = 0;
    } else if (this.liquidCX > maxShift) {
      this.liquidCX = maxShift;
      this.velocityX = 0;
    }

    if (this.liquidCY < -maxShift) {
      this.liquidCY = -maxShift;
      this.velocityY = 0;
    } else if (this.liquidCY > maxShift) {
      this.liquidCY = maxShift;
      this.velocityY = 0;
    }

    const speed = Math.hypot(this.velocityX, this.velocityY);
    this.waveAmplitude = Math.min(0.06, speed * 0.4);

    this.wavePhase += 0.08;
  }

  public reset() {
    this.liquidCX = 0;
    this.liquidCY = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.waveAmplitude = 0;
    this.wavePhase = 0;
  }
}

const previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
const pCtx = previewCanvas.getContext('2d')!;
const previewPhysics = new SettingsLiquidPhysics();

// Settings state
let currentSettings = {
  liquidDarkness: 0.88,
  viewportSize: 0.52,
  viscosity: 0.72,
  waveIntensity: 0.03,
  glassRim: true,
  sensorMode: 'auto',
  hotkey: 'CommandOrControl+Shift+P',
  startWithSystem: false,
  showViewport: false,
  iceMode: false,
  enableWaves: true,
  iceModeIntensity: 0.5,
  enableMotion: true,
  autoHideIdle: true
};

// Auto-sloshing preview animation values
let time = 0;
let previewTiltX = 0;
let previewTiltY = 0;

// Mouse coordinates on preview canvas
let isHoveringPreview = false;
let previewMouseX = 100;
let previewMouseY = 60;

previewCanvas.addEventListener('mouseenter', () => { isHoveringPreview = true; });
previewCanvas.addEventListener('mouseleave', () => { isHoveringPreview = false; });
previewCanvas.addEventListener('mousemove', (e) => {
  const rect = previewCanvas.getBoundingClientRect();
  previewMouseX = e.clientX - rect.left;
  previewMouseY = e.clientY - rect.top;
});

// UI controls
const controls = {
  liquidDarkness: document.getElementById('liquidDarkness') as HTMLInputElement,
  viewportSize: document.getElementById('viewportSize') as HTMLInputElement,
  viscosity: document.getElementById('viscosity') as HTMLInputElement,
  waveIntensity: document.getElementById('waveIntensity') as HTMLInputElement,
  sensorMode: document.getElementById('sensorMode') as HTMLSelectElement,
  glassRim: document.getElementById('glassRim') as HTMLInputElement,
  startWithSystem: document.getElementById('startWithSystem') as HTMLInputElement,
  hotkey: document.getElementById('hotkey') as HTMLInputElement,
  showViewport: document.getElementById('showViewport') as HTMLInputElement,
  iceMode: document.getElementById('iceMode') as HTMLInputElement,
  enableWaves: document.getElementById('enableWaves') as HTMLInputElement,
  iceModeIntensity: document.getElementById('iceModeIntensity') as HTMLInputElement,
  toggleOverlayBtn: document.getElementById('toggleOverlayBtn') as HTMLButtonElement,
  enableMotion: document.getElementById('enableMotion') as HTMLInputElement,
  autoHideIdle: document.getElementById('autoHideIdle') as HTMLInputElement
};

const valueLabels = {
  liquidDarkness: document.getElementById('liquidDarkness-val') as HTMLSpanElement,
  viewportSize: document.getElementById('viewportSize-val') as HTMLSpanElement,
  viscosity: document.getElementById('viscosity-val') as HTMLSpanElement,
  waveIntensity: document.getElementById('waveIntensity-val') as HTMLSpanElement,
  iceModeIntensity: document.getElementById('iceModeIntensity-val') as HTMLSpanElement
};

// Set display platform tag
document.getElementById('platform-tag')!.innerText = navigator.platform;

// Helper to update button colors based on overlay status
function updateOverlayBtnUI(active: boolean) {
  controls.toggleOverlayBtn.innerText = active ? 'Disable Overlay' : 'Enable Overlay';
  controls.toggleOverlayBtn.style.background = active ? '#ef4444' : 'var(--accent-color)';
}

// Bind settings updates
async function loadSettings() {
  const settings = await (window as any).api.getSettings();
  if (settings) {
    currentSettings = { ...currentSettings, ...settings };
    
    // Set UI values
    controls.liquidDarkness.value = currentSettings.liquidDarkness.toString();
    controls.viewportSize.value = currentSettings.viewportSize.toString();
    controls.viscosity.value = currentSettings.viscosity.toString();
    controls.waveIntensity.value = currentSettings.waveIntensity.toString();
    controls.sensorMode.value = currentSettings.sensorMode;
    controls.glassRim.checked = currentSettings.glassRim;
    controls.startWithSystem.checked = currentSettings.startWithSystem;
    controls.hotkey.value = currentSettings.hotkey;
    controls.showViewport.checked = currentSettings.showViewport;
    controls.iceMode.checked = currentSettings.iceMode;
    controls.enableWaves.checked = currentSettings.enableWaves;
    controls.iceModeIntensity.value = currentSettings.iceModeIntensity.toString();
    controls.enableMotion.checked = currentSettings.enableMotion;
    controls.autoHideIdle.checked = currentSettings.autoHideIdle;

    // Set Labels
    valueLabels.liquidDarkness.innerText = currentSettings.liquidDarkness.toFixed(2);
    valueLabels.viewportSize.innerText = currentSettings.viewportSize.toFixed(2);
    valueLabels.viscosity.innerText = currentSettings.viscosity.toFixed(2);
    valueLabels.waveIntensity.innerText = currentSettings.waveIntensity.toFixed(3);
    valueLabels.iceModeIntensity.innerText = currentSettings.iceModeIntensity.toFixed(2);
    
    // Toggle intensity slider visibility depending on iceMode
    const intensityGroup = document.getElementById('iceModeIntensityGroup')!;
    intensityGroup.style.display = currentSettings.iceMode ? 'block' : 'none';
    controls.enableWaves.disabled = currentSettings.iceMode;

    // Toggle sensor selection dropdown depending on enableMotion
    const sensorGroup = document.getElementById('sensorModeGroup')!;
    sensorGroup.style.display = currentSettings.enableMotion ? 'block' : 'none';

    // Fetch and sync current overlay status on UI launch
    const overlayActive = await (window as any).api.isOverlayActive();
    updateOverlayBtnUI(overlayActive);
  }
}

// Save helper
function updateSetting(key: string, value: any) {
  (window as any).api.setSetting(key, value);
}

// Bind UI changes
function setupListeners() {
  controls.toggleOverlayBtn.addEventListener('click', async () => {
    const active = await (window as any).api.toggleOverlay();
    updateOverlayBtnUI(active);
  });

  controls.liquidDarkness.addEventListener('input', () => {
    const val = parseFloat(controls.liquidDarkness.value);
    valueLabels.liquidDarkness.innerText = val.toFixed(2);
    updateSetting('liquidDarkness', val);
  });

  controls.viewportSize.addEventListener('input', () => {
    const val = parseFloat(controls.viewportSize.value);
    valueLabels.viewportSize.innerText = val.toFixed(2);
    updateSetting('viewportSize', val);
  });

  controls.viscosity.addEventListener('input', () => {
    const val = parseFloat(controls.viscosity.value);
    valueLabels.viscosity.innerText = val.toFixed(2);
    updateSetting('viscosity', val);
  });

  controls.waveIntensity.addEventListener('input', () => {
    const val = parseFloat(controls.waveIntensity.value);
    valueLabels.waveIntensity.innerText = val.toFixed(3);
    updateSetting('waveIntensity', val);
  });

  controls.sensorMode.addEventListener('change', () => {
    updateSetting('sensorMode', controls.sensorMode.value);
  });

  controls.glassRim.addEventListener('change', () => {
    updateSetting('glassRim', controls.glassRim.checked);
  });

  controls.startWithSystem.addEventListener('change', () => {
    updateSetting('startWithSystem', controls.startWithSystem.checked);
  });

  controls.hotkey.addEventListener('change', () => {
    updateSetting('hotkey', controls.hotkey.value);
  });

  controls.showViewport.addEventListener('change', () => {
    updateSetting('showViewport', controls.showViewport.checked);
  });

  controls.iceMode.addEventListener('change', () => {
    const val = controls.iceMode.checked;
    updateSetting('iceMode', val);
    const intensityGroup = document.getElementById('iceModeIntensityGroup')!;
    intensityGroup.style.display = val ? 'block' : 'none';
    controls.enableWaves.disabled = val;
  });

  controls.enableWaves.addEventListener('change', () => {
    updateSetting('enableWaves', controls.enableWaves.checked);
  });

  controls.iceModeIntensity.addEventListener('input', () => {
    const val = parseFloat(controls.iceModeIntensity.value);
    valueLabels.iceModeIntensity.innerText = val.toFixed(2);
    updateSetting('iceModeIntensity', val);
  });

  controls.enableMotion.addEventListener('change', () => {
    const val = controls.enableMotion.checked;
    updateSetting('enableMotion', val);
    const sensorGroup = document.getElementById('sensorModeGroup')!;
    sensorGroup.style.display = val ? 'block' : 'none';
  });

  controls.autoHideIdle.addEventListener('change', () => {
    updateSetting('autoHideIdle', controls.autoHideIdle.checked);
  });

  // Track global updates (like if tray updates active state)
  (window as any).api.onSettingsChanged((newSettings: any) => {
    currentSettings = { ...currentSettings, ...newSettings };
    if (newSettings.hasOwnProperty('showViewport')) {
      controls.showViewport.checked = newSettings.showViewport;
    }
    if (newSettings.hasOwnProperty('iceMode')) {
      controls.iceMode.checked = newSettings.iceMode;
      const intensityGroup = document.getElementById('iceModeIntensityGroup')!;
      intensityGroup.style.display = newSettings.iceMode ? 'block' : 'none';
      controls.enableWaves.disabled = newSettings.iceMode;
    }
    if (newSettings.hasOwnProperty('enableWaves')) {
      controls.enableWaves.checked = newSettings.enableWaves;
    }
    if (newSettings.hasOwnProperty('iceModeIntensity')) {
      controls.iceModeIntensity.value = newSettings.iceModeIntensity.toString();
      valueLabels.iceModeIntensity.innerText = newSettings.iceModeIntensity.toFixed(2);
    }
    if (newSettings.hasOwnProperty('enableMotion')) {
      controls.enableMotion.checked = newSettings.enableMotion;
      const sensorGroup = document.getElementById('sensorModeGroup')!;
      sensorGroup.style.display = newSettings.enableMotion ? 'block' : 'none';
    }
    if (newSettings.hasOwnProperty('autoHideIdle')) {
      controls.autoHideIdle.checked = newSettings.autoHideIdle;
    }
  });

  (window as any).api.onActiveStateChange((active: boolean) => {
    updateOverlayBtnUI(active);
  });
}

// Render loop for mini preview canvas
function drawPreview() {
  requestAnimationFrame(drawPreview);

  const W = previewCanvas.width;
  const H = previewCanvas.height;

  // Clear background
  pCtx.clearRect(0, 0, W, H);
  pCtx.fillStyle = '#11131e';
  pCtx.fillRect(0, 0, W, H);

  // Compute tilt values
  if (currentSettings.enableMotion) {
    if (isHoveringPreview) {
      // Control tilt from mouse hover inside canvas
      const cx = (previewMouseX - W / 2) / (W / 2);
      const cy = (previewMouseY - H / 2) / (H / 2);
      // Smooth transition
      previewTiltX += (-cx - previewTiltX) * 0.2;
      previewTiltY += (-cy - previewTiltY) * 0.2;
    } else {
      // Gentle default auto-oscillation
      time += 0.03;
      previewTiltX += (Math.sin(time) * 0.35 - previewTiltX) * 0.05;
      previewTiltY += (Math.cos(time * 0.6) * 0.15 - previewTiltY) * 0.05;
    }
  } else {
    // Freeze at center (completely flat/non-sloshing)
    previewTiltX = 0;
    previewTiltY = 0;
  }

  // Update mini physics
  previewPhysics.update(previewTiltX, previewTiltY, currentSettings.viscosity);

  // Draw liquid - level placed near the top to fill screen, sloshing gently
  const actualEnableWaves = currentSettings.enableMotion ? currentSettings.enableWaves : false;
  if (!currentSettings.iceMode && actualEnableWaves) {
    pCtx.beginPath();
    // baselineY ranges from 0 (100% full) to 0.05 * H (95% full)
    const maxWaterDrop = 0.05 * H;
    const normalizedY = (previewPhysics.liquidCY + 0.4) / 0.8;
    const baselineY = normalizedY * maxWaterDrop;

    pCtx.moveTo(0, baselineY);
    const waveCount = 2;
    const amp = currentSettings.waveIntensity * H + previewPhysics.waveAmplitude * H;
    const phase = previewPhysics.wavePhase;

    for (let x = 0; x <= W; x += 5) {
      const angle = (x / W) * Math.PI * 2 * waveCount + phase;
      const y = baselineY + Math.sin(angle) * amp;
      pCtx.lineTo(x, Math.max(0, y));
    }
    pCtx.lineTo(W, H);
    pCtx.lineTo(0, H);
    pCtx.closePath();
    pCtx.fillStyle = `rgba(8, 8, 20, ${currentSettings.liquidDarkness})`;
    pCtx.fill();
  } else {
    pCtx.beginPath();
    pCtx.rect(0, 0, W, H);
    if (currentSettings.iceMode) {
      pCtx.fillStyle = `rgba(60, 64, 72, ${currentSettings.liquidDarkness})`;
    } else {
      pCtx.fillStyle = `rgba(8, 8, 20, ${currentSettings.liquidDarkness})`;
    }
    pCtx.fill();
  }

  // Create clear hole (horizontally squeezed in Ice Mode to restrict side angles)
  const actualShowViewport = currentSettings.enableMotion ? currentSettings.showViewport : false;
  if (actualShowViewport) {
    pCtx.globalCompositeOperation = 'destination-out';
    pCtx.beginPath();
    const ellipseX = W / 2 - previewPhysics.liquidCX * W * 0.70;
    const ellipseY = H / 2 - previewPhysics.liquidCY * H * 0.60;
    
    // Narrow horizontal radius scaled dynamically based on iceModeIntensity
    const horizontalScale = currentSettings.iceMode ? (0.45 - currentSettings.iceModeIntensity * 0.30) : 0.50;
    const radiusX = W * currentSettings.viewportSize * horizontalScale;
    const radiusY = H * currentSettings.viewportSize * 0.40;

    pCtx.ellipse(ellipseX, ellipseY, radiusX, radiusY, 0, 0, Math.PI * 2);
    pCtx.fillStyle = 'rgba(0,0,0,1)';
    pCtx.fill();
    pCtx.globalCompositeOperation = 'source-over';
  }

  // Draw side polarization overlay in Ice Mode (Slate Grey filter)
  if (currentSettings.iceMode) {
    const intensity = currentSettings.iceModeIntensity;
    const innerStop = 0.15 + intensity * 0.25;
    const outerStop = 0.05 + intensity * 0.20;
    const opacity = 0.70 + intensity * 0.28;

    const sideGrad = pCtx.createLinearGradient(0, 0, W, 0);
    sideGrad.addColorStop(0, `rgba(30, 32, 36, ${opacity})`);
    sideGrad.addColorStop(outerStop, `rgba(30, 32, 36, ${opacity * 0.9})`);
    sideGrad.addColorStop(innerStop, 'rgba(0, 0, 0, 0)');
    sideGrad.addColorStop(1 - innerStop, 'rgba(0, 0, 0, 0)');
    sideGrad.addColorStop(1 - outerStop, `rgba(30, 32, 36, ${opacity * 0.9})`);
    sideGrad.addColorStop(1, `rgba(30, 32, 36, ${opacity})`);
    pCtx.fillStyle = sideGrad;
    pCtx.fillRect(0, 0, W, H);
  }

  // Glass rim
  if (currentSettings.glassRim) {
    pCtx.strokeStyle = currentSettings.iceMode ? 'rgba(170, 220, 255, 0.25)' : 'rgba(160, 200, 255, 0.18)';
    pCtx.lineWidth = 1.5;
    pCtx.strokeRect(1, 1, W - 2, H - 2);
  }

  // Vignette
  const grad = pCtx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.75);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
  pCtx.fillStyle = grad;
  pCtx.fillRect(0, 0, W, H);
}

// Boot
loadSettings().then(() => {
  setupListeners();
  drawPreview();
});
