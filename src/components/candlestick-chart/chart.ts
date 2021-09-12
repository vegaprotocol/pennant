import EventEmitter from "eventemitter3";

import { Zoom } from "../../helpers/zoom/zoom";
import { Pane } from "./pane";
import { TimeAxis } from "./time-axis";

export class PaneItem {
  public pane: Pane;

  constructor(pane: Pane) {
    this.pane = pane;
  }
}

/**
 * Reponsible for drawing a candlestick chart
 */
export class Chart extends EventEmitter {
  private timeZoom: Zoom = new Zoom();
  private paneItems: PaneItem[] = [];
  private timeAxis: TimeAxis;

  constructor(timeAxis: HTMLElement) {
    super();

    this.timeAxis = new TimeAxis(timeAxis);
    this.timeAxis
      .on("zoomstart", (_event) => {})
      .on("zoom", (transform) => {
        this.timeZoom.__zoom = transform;

        this.paneItems.forEach((paneItem) => {
          paneItem.pane.timeZoom = this.timeZoom;
        });

        this.timeAxis.timeZoom = this.timeZoom;
      })
      .on("zoomend", (_event) => {});

    this.timeAxis.update();
    this.timeAxis.render();

    this.timeZoom.scaleExtent = [0.1, 10];
  }

  public addPane(pane: Pane) {
    pane
      .on("zoomstart", (_event) => {})
      .on("zoom", (transform) => {
        this.timeZoom.__zoom = transform;

        this.paneItems.forEach((paneItem) => {
          paneItem.pane.timeZoom = this.timeZoom;
        });

        this.timeAxis.timeZoom = this.timeZoom;
      })
      .on("zoomend", (_event) => {});

    pane.update();
    pane.render();

    this.paneItems.push(new PaneItem(pane));
  }

  public removePane(index: number): void {
    this.paneItems.splice(index, 1);
  }
}
