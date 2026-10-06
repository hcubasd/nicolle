/** Small scroll response; glass remains independent of DOM text and hit targets. */
export class ScrollLiquid {
  private previousY: number;
  private previousTime: number;
  private lastMovement = -Infinity;
  private position = 0;
  private velocity = 0;
  private drive = 0;
  private ignoreUntil = 0;
  constructor(y: number, now: number) { this.previousY = y; this.previousTime = now; }
  reset(y: number, now: number): void {
    this.previousY = y; this.previousTime = now; this.lastMovement = -Infinity;
    this.position = 0; this.velocity = 0; this.drive = 0; this.ignoreUntil = now + 80;
  }
  update(y: number, now: number, disabled: boolean): number {
    const elapsed = Math.max(1, now - this.previousTime);
    const delta = y - this.previousY;
    this.previousY = y; this.previousTime = now;
    if (disabled || now < this.ignoreUntil) { this.position = 0; this.velocity = 0; this.drive = 0; return 0; }
    if (delta !== 0) this.lastMovement = now;
    // A speed-responsive, damped spring. No physics simulation or additional render pass.
    if (delta !== 0) this.drive = Math.min(Math.abs(delta) / elapsed * 1000 / 1600, 1);
    else this.drive *= Math.exp(-elapsed / 70);
    const target = this.drive;
    const dt = Math.min(elapsed / 1000, .05);
    const substeps = Math.ceil(dt / .008), step = dt / substeps;
    for (let i = 0; i < substeps; i++) {
      this.velocity += (220 * (target - this.position) - 20 * this.velocity) * step;
      this.position += this.velocity * step;
    }
    // Finish at the exact resting shape, rather than approach it forever.
    if (now - this.lastMovement > 420) { this.position = 0; this.velocity = 0; this.drive = 0; }
    return Math.max(-.25, Math.min(1.1, this.position));
  }
}
export interface PanelRect { left: number; right: number; top: number; bottom: number; width: number; height: number; }
export interface LiquidShape { halfWidth: number; halfHeight: number; radius: number; }
export function liquidShape(rect: PanelRect, radius: number, motion: number): LiquidShape {
  // The entire animated silhouette stays inside its own original rectangle.
  // Negative spring rebound also contracts: neither axis can overshoot outward.
  const response = Math.min(1, Math.abs(motion));
  const insetX = Math.min(18, rect.width * .055) * response;
  const insetY = Math.min(26, rect.height * .12) * response;
  const halfWidth = rect.width / 2 - insetX;
  const halfHeight = rect.height / 2 - insetY;
  // Round toward a softer shape, within the shader's valid geometric radius.
  const softened = radius * (1 + response * 2.2);
  return { halfWidth, halfHeight, radius: Math.max(0, Math.min(softened, halfWidth, halfHeight)) };
}
