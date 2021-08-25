import EventEmitter from "eventemitter3";
import { debounce } from "lodash";

import styles from "./sash.module.css";

export interface SashOptions {
  readonly orientation: Orientation;
  readonly size?: number;
}

export interface SashEvent {
  startX: number;
  currentX: number;
  startY: number;
  currentY: number;
}

export enum Orientation {
  VERTICAL,
  HORIZONTAL,
}

export enum SashState {
  Disabled,
  Minimum,
  Maximum,
  Enabled,
}

export interface SashLayoutProvider {}

export interface VerticalSashLayoutProvider extends SashLayoutProvider {
  getVerticalSashLeft(sash: Sash): number;
  getVerticalSashTop?(sash: Sash): number;
  getVerticalSashHeight?(sash: Sash): number;
}

export interface HorizontalSashLayoutProvider extends SashLayoutProvider {
  getHorizontalSashTop(sash: Sash): number;
  getHorizontalSashLeft?(sash: Sash): number;
  getHorizontalSashWidth?(sash: Sash): number;
}

export class Sash extends EventEmitter {
  private el: HTMLElement;
  private layoutProvider: SashLayoutProvider;
  private hidden: boolean;
  private orientation!: Orientation;
  private size: number;
  private hoverDelay = 300;
  private hoverDelayer = debounce(
    (el) => el.classList.add(styles.hover),
    this.hoverDelay
  );

  private _state: SashState = SashState.Enabled;
  get state(): SashState {
    return this._state;
  }
  set state(state: SashState) {
    if (this._state === state) {
      return;
    }

    this.el.classList.toggle(styles.disabled, state === SashState.Disabled);
    this.el.classList.toggle(styles.minimum, state === SashState.Minimum);
    this.el.classList.toggle(styles.maximum, state === SashState.Maximum);

    this._state = state;

    this.emit("enablementChange", state);
  }

  constructor(
    container: HTMLElement,
    layoutProvider: VerticalSashLayoutProvider,
    options: SashOptions
  );
  constructor(
    container: HTMLElement,
    layoutProvider: HorizontalSashLayoutProvider,
    options: SashOptions
  );
  constructor(
    container: HTMLElement,
    layoutProvider: SashLayoutProvider,
    options: SashOptions
  ) {
    super();

    this.el = document.createElement("div");
    this.el.classList.add(styles.sash);
    container.append(this.el);

    this.el.addEventListener("mousedown", this.onPointerStart);
    this.el.addEventListener("dblclick", this.onPointerDoublePress);
    this.el.addEventListener("mouseenter", () => Sash.onMouseEnter(this));
    this.el.addEventListener("mouseleave", () => Sash.onMouseLeave(this));

    this.size = 4;

    this.hidden = false;
    this.layoutProvider = layoutProvider;

    this.orientation = options.orientation ?? Orientation.VERTICAL;

    if (this.orientation === Orientation.HORIZONTAL) {
      this.el.classList.add(styles.horizontal);
      this.el.classList.remove(styles.vertical);
    } else {
      this.el.classList.remove(styles.horizontal);
      this.el.classList.add(styles.vertical);
    }

    this.layout();
  }

  private onPointerStart = (event: MouseEvent) => {
    const startX = event.pageX;
    const startY = event.pageY;

    const startEvent: SashEvent = {
      startX,
      currentX: startX,
      startY,
      currentY: startY,
    };

    this.el.classList.add(styles.active);

    this.emit("start", startEvent);

    const onPointerMove = (event: MouseEvent) => {
      event.preventDefault();

      const moveEvent: SashEvent = {
        startX,
        currentX: event.pageX,
        startY,
        currentY: event.pageY,
      };

      this.emit("change", moveEvent);
    };

    const onPointerUp = (event: MouseEvent): void => {
      event.preventDefault();

      this.el.classList.remove(styles.active);

      this.emit("end");

      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
    };

    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
  };

  private onPointerDoublePress(event: MouseEvent): void {
    this.emit("reset");
  }

  private static onMouseEnter(sash: Sash): void {
    if (sash.el.classList.contains(styles.active)) {
      sash.hoverDelayer.cancel();
      sash.el.classList.add(styles.hover);
    } else {
      sash.hoverDelayer(sash.el);
    }
  }

  private static onMouseLeave(sash: Sash): void {
    sash.hoverDelayer.cancel();
    sash.el.classList.remove(styles.hover);
  }

  public layout(): void {
    if (this.orientation === Orientation.VERTICAL) {
      const verticalProvider = <VerticalSashLayoutProvider>this.layoutProvider;
      this.el.style.left =
        verticalProvider.getVerticalSashLeft(this) - this.size / 2 + "px";

      if (verticalProvider.getVerticalSashTop) {
        this.el.style.top = verticalProvider.getVerticalSashTop(this) + "px";
      }

      if (verticalProvider.getVerticalSashHeight) {
        this.el.style.height =
          verticalProvider.getVerticalSashHeight(this) + "px";
      }
    } else {
      const horizontalProvider = <HorizontalSashLayoutProvider>(
        this.layoutProvider
      );
      this.el.style.top =
        horizontalProvider.getHorizontalSashTop(this) - this.size / 2 + "px";

      if (horizontalProvider.getHorizontalSashLeft) {
        this.el.style.left =
          horizontalProvider.getHorizontalSashLeft(this) + "px";
      }

      if (horizontalProvider.getHorizontalSashWidth) {
        this.el.style.width =
          horizontalProvider.getHorizontalSashWidth(this) + "px";
      }
    }
  }

  isHidden(): boolean {
    return this.hidden;
  }

  public dispose(): void {
    this.el.remove();
  }
}
