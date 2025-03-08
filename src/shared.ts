console.log("Hello from shared.ts");

export class ParticleCanvas implements Partial<HTMLCanvasElement> {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  get width() {
    return this.canvas.width;
  }

  get height() {
    return this.canvas.height;
  }

  private resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  constructor(id: string) {
    this.canvas = document.getElementById(id)! as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;
    this.resizeCanvas();
    window.addEventListener("resize", this.resizeCanvas);
  }

  clear(opacity: number = 1) {
    this.ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  box(x: number, y: number, width: number, height: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.strokeRect(x, y, width, height);
  }

  circle(x: number, y: number, radius: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.ellipse(
      x - radius / 2,
      y - radius / 2,
      radius,
      radius,
      0,
      0,
      2 * Math.PI
    );
    this.ctx.fill();
  }

  addEventListener(
    evenName: string,
    listener: {
      (event: any): void;
      (event: any): void;
      (event: any): void;
      (this: HTMLCanvasElement, ev: any): any;
    }
  ) {
    this.canvas.addEventListener(evenName, listener);
  }
}
