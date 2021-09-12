import { Timer, timer as d3Timer } from "d3-timer";
import EventEmitter from "eventemitter3";

const A = 1000;
const limit = 1.0001;
const B = -Math.log(1 - 1 / limit);

export class Inertia extends EventEmitter {
  private timer: Timer = d3Timer(() => {});
  public position: [number, number] = [0, 0];
  public velocity: [number, number] = [0, 0];
  private time: number = 0;
  private t: number = 0;

  public start(position: [number, number]) {
    this.position = position;
    this.velocity = [0, 0];

    this.timer.stop();
    this.emit("start", position);
  }

  public move(position: [number, number]) {
    const time = performance.now();
    const deltaTime = time - this.time;
    const decay = 1 - Math.exp(-deltaTime / 1000);

    this.velocity = this.velocity.map((d, i) => {
      const deltaPos = position[i] - this.position[i];
      const deltaTime = time - this.time;

      return (1 - decay) * d + (decay * deltaPos) / (deltaTime / 1000);

      return (1000 * (1 - decay) * deltaPos) / deltaTime + d * decay;
    }) as [number, number];

    this.time = time;
    this.position = position;

    this.emit("move", position);
  }

  public end() {
    const v = this.velocity;

    if (v[0] * v[0] + v[1] * v[1] < 100) {
      this.emit("stop");
      return this.timer.stop();
    }

    const time = performance.now();
    const deltaTime = time - this.time;

    if (deltaTime >= 100) {
      this.emit("stop");
      return this.timer.stop();
    }

    this.emit("end");

    this.timer.restart((e) => {
      this.t = limit * (1 - Math.exp((-B * e) / A));
      this.emit("render", this.t);

      if (this.t > 1) {
        this.emit("stop");
        this.timer.stop();
        this.velocity = [0, 0];
        this.t = 1;
        this.emit("finish");
      }
    });
  }
}
