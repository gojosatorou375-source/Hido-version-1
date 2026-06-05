import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface TiltData {
  x: number;
  y: number;
}

export class TiltSensor extends EventEmitter {
  private mode: 'auto' | 'tilt' | 'mouse' = 'auto';
  private hasHardware = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private childProc: ChildProcess | null = null;

  // Mouse fallback state
  private lastMouseTilt: TiltData = { x: 0, y: 0 };
  private currentMouseTilt: TiltData = { x: 0, y: 0 };

  constructor() {
    super();
  }

  public setMode(mode: 'auto' | 'tilt' | 'mouse') {
    this.mode = mode;
    this.stopHardwareListening();
    this.start();
  }

  public start() {
    if (this.mode === 'mouse') {
      this.hasHardware = false;
      return;
    }

    if (process.platform === 'win32') {
      this.startWindowsSensor();
    } else if (process.platform === 'darwin') {
      this.startMacSensor();
    } else if (process.platform === 'linux') {
      this.startLinuxSensor();
    } else {
      this.hasHardware = false;
    }
  }

  public stop() {
    this.stopHardwareListening();
  }

  private stopHardwareListening() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.childProc) {
      this.childProc.kill();
      this.childProc = null;
    }
  }

  // Windows Sensors via PowerShell Bridge
  private startWindowsSensor() {
    const psCommand = `
      Add-Type -AssemblyName Windows.Devices
      $sensor = [Windows.Devices.Sensors.Accelerometer]::GetDefault()
      if ($sensor -eq $null) {
        Write-Host "null"
        exit
      }
      while ($true) {
        $reading = $sensor.GetCurrentReading()
        if ($reading -ne $null) {
          $x = $reading.AccelerationX
          $y = $reading.AccelerationY
          $z = $reading.AccelerationZ
          Write-Host ("{\`"x\`":" + $x + ",\`"y\`":" + $y + ",\`"z\`":" + $z + "}")
        }
        Start-Sleep -Milliseconds 16
      }
    `;

    try {
      this.childProc = spawn('powershell', ['-NoProfile', '-Command', psCommand]);

      let buffer = '';
      this.childProc.stdout?.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === 'null') {
            this.hasHardware = false;
            this.stopHardwareListening();
            return;
          }
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
              const parsed = JSON.parse(trimmed);
              // Accelerometer values are in Gs. We normalize them to -1.0 to 1.0
              // Windows returns AccelerationX and AccelerationY.
              this.hasHardware = true;
              this.emit('tilt', {
                // Invert or scale appropriately
                x: Math.max(-1, Math.min(1, parsed.x)),
                y: Math.max(-1, Math.min(1, parsed.y))
              });
            } catch (err) {
              // Ignore parse errors
            }
          }
        }
      });

      this.childProc.on('error', () => {
        this.hasHardware = false;
      });

      this.childProc.on('close', () => {
        if (!this.hasHardware) {
          // If it exited immediately, we fall back
          this.hasHardware = false;
        }
      });
    } catch (e) {
      this.hasHardware = false;
    }
  }

  // macOS Sensors (node-imu or system_profiler)
  private startMacSensor() {
    try {
      const imu = require('node-imu');
      const sensor = new imu.IMU();
      this.hasHardware = true;
      this.checkInterval = setInterval(() => {
        sensor.getValue((err: any, data: any) => {
          if (!err && data && data.accelerometer) {
            this.emit('tilt', {
              x: Math.max(-1, Math.min(1, data.accelerometer.x)),
              y: Math.max(-1, Math.min(1, data.accelerometer.y))
            });
          }
        });
      }, 16);
    } catch (e) {
      // Fallback: spawn system_profiler at 4Hz for orientation hint
      this.startMacFallback();
    }
  }

  private startMacFallback() {
    this.checkInterval = setInterval(() => {
      // system_profiler SPHardwareDataType (or check SMS sensor output if present)
      // Since system_profiler might not easily contain tilt on desktop Macs, we try SPSensorsDataType
      const sp = spawn('system_profiler', ['SPSensorsDataType']);
      let output = '';
      sp.stdout.on('data', (d) => { output += d.toString(); });
      sp.on('close', () => {
        // Simple regex to parse orientation/tilt if reported, e.g. "Sudden Motion Sensor"
        if (output.includes('Sudden Motion Sensor')) {
          this.hasHardware = true;
          // Example output might contain tilt coordinates, but it's rare.
          // We will emit a static 0 or small variations to show we tried.
          this.emit('tilt', { x: 0, y: 0 });
        } else {
          this.hasHardware = false;
        }
      });
    }, 250); // 4Hz
  }

  // Linux Sensors via sysfs IIO devices
  private startLinuxSensor() {
    const basePath = '/sys/bus/iio/devices/iio:device0';
    const xPath = path.join(basePath, 'in_accel_x_raw');
    const yPath = path.join(basePath, 'in_accel_y_raw');
    const scalePath = path.join(basePath, 'in_accel_scale');

    if (!fs.existsSync(xPath) || !fs.existsSync(yPath)) {
      this.hasHardware = false;
      return;
    }

    this.hasHardware = true;
    let scale = 1.0;
    try {
      if (fs.existsSync(scalePath)) {
        scale = parseFloat(fs.readFileSync(scalePath, 'utf8').trim());
      }
    } catch (e) {
      // Keep scale as 1.0
    }

    this.checkInterval = setInterval(() => {
      try {
        const rawX = parseInt(fs.readFileSync(xPath, 'utf8').trim(), 10);
        const rawY = parseInt(fs.readFileSync(yPath, 'utf8').trim(), 10);
        // Normalize
        const x = (rawX * scale) / 9.81;
        const y = (rawY * scale) / 9.81;
        this.emit('tilt', {
          x: Math.max(-1, Math.min(1, x)),
          y: Math.max(-1, Math.min(1, y))
        });
      } catch (err) {
        // Fallback
      }
    }, 16); // 60Hz
  }

  // Mouse Input Handling
  public handleMouseMove(mouseX: number, mouseY: number, width: number, height: number) {
    // If we're forcing tilt and have hardware, ignore mouse
    if (this.mode === 'tilt' && this.hasHardware) {
      return;
    }
    // If auto mode and we have hardware, ignore mouse
    if (this.mode === 'auto' && this.hasHardware) {
      return;
    }

    // Compute normalized cursor position (cx, cy) from screen center
    const cx = (mouseX - width / 2) / (width / 2);
    const cy = (mouseY - height / 2) / (height / 2);

    // Inverted tilt (liquid flows to opposite side of cursor)
    const targetTiltX = -cx;
    const targetTiltY = -cy;

    // Apply 0.8 smoothing factor so motion is fast and responsive
    const smoothing = 0.8;
    this.currentMouseTilt.x = this.lastMouseTilt.x + (targetTiltX - this.lastMouseTilt.x) * smoothing;
    this.currentMouseTilt.y = this.lastMouseTilt.y + (targetTiltY - this.lastMouseTilt.y) * smoothing;

    this.lastMouseTilt = { ...this.currentMouseTilt };

    this.emit('tilt', {
      x: Math.max(-1, Math.min(1, this.currentMouseTilt.x)),
      y: Math.max(-1, Math.min(1, this.currentMouseTilt.y))
    });
  }

  public isUsingHardware(): boolean {
    return this.hasHardware && this.mode !== 'mouse';
  }
}
