class OverlayLiquidPhysics {
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

const canvas = document.getElementById('overlay-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const physics = new OverlayLiquidPhysics();

let targetTiltX = 0;
let targetTiltY = 0;
let isActive = true;

// Default settings
// Default settings
let settings = {
  liquidDarkness: 0.88,
  viewportSize: 0.52,
  viscosity: 0.72,
  waveIntensity: 0.03,
  glassRim: true,
  showViewport: false,
  iceMode: false,
  enableWaves: true,
  iceModeIntensity: 0.5,
  enableMotion: true,
  autoHideIdle: true
};

let lastActivityTime = Date.now();
let viewportFadeScale = 1.0;

// Handle window resizing
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Track mouse movements to support mouse fallback
window.addEventListener('mousemove', (e) => {
  lastActivityTime = Date.now();
  (window as any).api.sendMouseMove(e.clientX, e.clientY, canvas.width, canvas.height);
});

// Load settings and listen for updates
async function initSettings() {
  try {
    const loaded = await (window as any).api.getSettings();
    if (loaded) {
      settings = { ...settings, ...loaded };
    }
  } catch (err) {
    console.error('Failed to load initial settings:', err);
  }

  (window as any).api.onSettingsChanged((newSettings: any) => {
    settings = { ...settings, ...newSettings };
  });

  (window as any).api.onActiveStateChange((active: boolean) => {
    isActive = active;
    if (!isActive) {
      physics.reset();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  });

  (window as any).api.onTilt((tilt: { x: number; y: number }) => {
    if (Math.abs(tilt.x - targetTiltX) > 0.01 || Math.abs(tilt.y - targetTiltY) > 0.01) {
      lastActivityTime = Date.now();
    }
    targetTiltX = tilt.x;
    targetTiltY = tilt.y;
  });
}
initSettings();


// Main 60fps render loop
function render() {
  requestAnimationFrame(render);

  if (!isActive) {
    return;
  }

  const W = canvas.width;
  const H = canvas.height;

  // Step 1: Clear canvas (transparent background)
  ctx.clearRect(0, 0, W, H);

  // Update physics with the latest tilt values
  const currentTiltX = settings.enableMotion ? targetTiltX : 0;
  const currentTiltY = settings.enableMotion ? targetTiltY : 0;
  physics.update(currentTiltX, currentTiltY, settings.viscosity);

  // Step 2: Dark liquid region - fills the entire screen or sloshes as waves
  const actualEnableWaves = settings.enableMotion ? settings.enableWaves : false;
  if (!settings.iceMode && actualEnableWaves) {
    ctx.beginPath();
    // baselineY ranges from 0 (100% full) to 0.05 * H (95% full)
    const maxWaterDrop = 0.05 * H;
    const normalizedY = (physics.liquidCY + 0.4) / 0.8;
    const baselineY = normalizedY * maxWaterDrop;

    ctx.moveTo(0, baselineY);
    const waveCount = 2;
    const amp = settings.waveIntensity * H + physics.waveAmplitude * H;
    const phase = physics.wavePhase;

    for (let x = 0; x <= W; x += 10) {
      const angle = (x / W) * Math.PI * 2 * waveCount + phase;
      const y = baselineY + Math.sin(angle) * amp;
      ctx.lineTo(x, Math.max(0, y));
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = `rgba(8, 8, 20, ${settings.liquidDarkness})`;
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    if (settings.iceMode) {
      ctx.fillStyle = `rgba(60, 64, 72, ${settings.liquidDarkness})`;
    } else {
      ctx.fillStyle = `rgba(8, 8, 20, ${settings.liquidDarkness})`;
    }
    ctx.fill();
  }

  // Step 2.5: Idle check to fade/shrink clear viewport hole
  const isIdle = settings.autoHideIdle && (Date.now() - lastActivityTime > 3000);
  const targetFadeScale = isIdle ? 0.0 : 1.0;
  viewportFadeScale += (targetFadeScale - viewportFadeScale) * (isIdle ? 0.04 : 0.15);

  // Step 3: Clear viewport ellipse (clear window in the center)
  const actualShowViewport = settings.enableMotion ? settings.showViewport : false;
  if (actualShowViewport && viewportFadeScale > 0.001) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    
    // Position ellipse offset from center in opposition to liquid movement
    const ellipseX = W / 2 - physics.liquidCX * W * 0.70;
    const ellipseY = H / 2 - physics.liquidCY * H * 0.60;
    
    // Squeeze horizontal radius in Ice Mode to block off side-view angles dynamically
    const horizontalScale = settings.iceMode ? (0.45 - settings.iceModeIntensity * 0.30) : 0.50;
    const radiusX = W * settings.viewportSize * horizontalScale * viewportFadeScale;
    const radiusY = H * settings.viewportSize * 0.40 * viewportFadeScale;

    ctx.ellipse(ellipseX, ellipseY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  // Step 3.5: Side polarization gradients in Ice Mode (Slate Grey filter)
  if (settings.iceMode) {
    const intensity = settings.iceModeIntensity;
    const innerStop = 0.15 + intensity * 0.25;
    const outerStop = 0.05 + intensity * 0.20;
    const opacity = 0.70 + intensity * 0.28;

    const sideGrad = ctx.createLinearGradient(0, 0, W, 0);
    sideGrad.addColorStop(0, `rgba(30, 32, 36, ${opacity})`);
    sideGrad.addColorStop(outerStop, `rgba(30, 32, 36, ${opacity * 0.9})`);
    sideGrad.addColorStop(innerStop, 'rgba(0, 0, 0, 0)');
    sideGrad.addColorStop(1 - innerStop, 'rgba(0, 0, 0, 0)');
    sideGrad.addColorStop(1 - outerStop, `rgba(30, 32, 36, ${opacity * 0.9})`);
    sideGrad.addColorStop(1, `rgba(30, 32, 36, ${opacity})`);
    ctx.fillStyle = sideGrad;
    ctx.fillRect(0, 0, W, H);
  }

  // Step 4: Glass rim
  if (settings.glassRim) {
    ctx.strokeStyle = settings.iceMode ? 'rgba(170, 220, 255, 0.25)' : 'rgba(160, 200, 255, 0.18)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, W - 3, H - 3);
  }

  // Step 5: Edge vignette
  const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.75);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// Start rendering
requestAnimationFrame(render);
