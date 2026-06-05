export class LiquidPhysics {
  public liquidCX = 0;
  public liquidCY = 0;
  public velocityX = 0;
  public velocityY = 0;
  public waveAmplitude = 0;
  public wavePhase = 0;

  private readonly k = 3.5;
  private readonly dt = 0.016;

  constructor() {}

  /**
   * Updates the physics simulation state.
   * @param tiltX Normalized tilt force x (-1.0 to 1.0)
   * @param tiltY Normalized tilt force y (-1.0 to 1.0)
   * @param viscosity Damping factor (0.4 to 0.95)
   */
  public update(tiltX: number, tiltY: number, viscosity: number) {
    const damping = viscosity;

    // Spring forces: F = -k*x - c*v + ExternalForce
    const forceX = (tiltX * this.k) - (this.liquidCX * this.k) - (this.velocityX * damping);
    const forceY = (tiltY * this.k) - (this.liquidCY * this.k) - (this.velocityY * damping);

    this.velocityX += forceX * this.dt;
    this.velocityY += forceY * this.dt;

    this.liquidCX += this.velocityX * this.dt;
    this.liquidCY += this.velocityY * this.dt;

    // Clamp mass center to (-0.4..0.4) to keep viewport visible at the center
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

    // Dynamic wave amplitude based on physical speed
    const speed = Math.hypot(this.velocityX, this.velocityY);
    this.waveAmplitude = Math.min(0.06, speed * 0.4);

    // Wave phase increments to make waves animate
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
