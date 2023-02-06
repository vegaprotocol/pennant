import EventEmitter from "eventemitter3";

import { ZoomTransform } from "./transform";
import { Zoom } from "./zoom";

export class Gesture<T extends EventEmitter & { zoom: Zoom }> {
  public that: T;
  public active: number = 0;
  public taps: number = 0;

  public touch0: any = null;
  public touch1: any = null;

  public sourceEvent: Event | null = null;

  public wheel: number | null = null;
  public wheelHorizontal: boolean = false;
  public mouse: [[number, number], [number, number]] | [null, null] = [
    null,
    null,
  ];

  public zooming = false;

  constructor(that: T) {
    this.that = that;
  }

  public start(transform?: ZoomTransform) {
    this.that.emit("zoomstart", transform);
  }

  public zoom(transform: ZoomTransform, point: [number, number]) {
    this.that.zoom.__zoom = transform;
    this.that.emit("zoom", { transform, point: [point[0], point[1]] });
  }

  public end() {
    this.that.emit("zoomend");
  }
}
