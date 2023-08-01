import EventEmitter from "eventemitter3";

import { AbstractRenderer } from "../core";
import { DisplayObject, TemporaryDisplayObject } from "../display";
import { PointData } from "../math";
import { InteractionData, InteractivePointerEvent } from "./interaction-data";
import { InteractionCallback, InteractionEvent } from "./interaction-event";
import { InteractionTrackingData } from "./interaction-tracking-data";
import { TreeSearch } from "./tree-search";

const MOUSE_POINTER_ID = 1;

export interface InteractionManagerOptions {
  interactionFrequency?: number;
}

export interface DelayedEvent {
  displayObject: DisplayObject;
  eventString: string;
  eventData: InteractionEvent;
}

interface CrossCSSStyleDeclaration extends CSSStyleDeclaration {
  msContentZooming: string;
  msTouchAction: string;
}

export class InteractionManager extends EventEmitter {
  public readonly activeInteractionData: { [key: number]: InteractionData };
  public readonly supportsTouchEvents: boolean;
  public readonly supportsPointerEvents: boolean;

  public cursor: string | null = null;
  public delayedEvents: DelayedEvent[] = [];
  public interactionDataPool: InteractionData[];
  public interactionFrequency: number;
  public moveWhenInside: boolean = false;
  public renderer: AbstractRenderer;
  public resolution: number;
  public search = new TreeSearch();
  public cursorStyles: {
    [key: string]: string | ((mode: string) => void) | CSSStyleDeclaration;
  } = {
    default: "inherit",
    grab: "grab",
    pointer: "pointer",
  };
  public currentCursorMode: string | null = null;

  public eventData: InteractionEvent;
  public mouse: InteractionData;

  protected interactionDOMElement: HTMLElement | null;
  protected mouseOverRenderer: boolean;

  private _tempDisplayObject: DisplayObject = new TemporaryDisplayObject();
  private readonly _eventListenerOptions = { capture: true, passive: false };

  constructor(renderer: AbstractRenderer, options?: InteractionManagerOptions) {
    super();

    this.interactionFrequency = options?.interactionFrequency ?? 10;
    this.mouse = new InteractionData();
    this.mouse.identifier = MOUSE_POINTER_ID;

    this.mouse.global.set(-999999);

    this.activeInteractionData = {};
    this.activeInteractionData[MOUSE_POINTER_ID] = this.mouse;

    this.renderer = renderer;

    this.resolution = 1;

    this.mouseOverRenderer = !("PointerEvent" in self);
    this.supportsTouchEvents = "ontouchstart" in self;
    this.supportsPointerEvents = !!self.PointerEvent;
    this.interactionDataPool = [];
    this.eventData = new InteractionEvent();
    this.interactionDOMElement = null;

    this.setTargetElement(this.renderer.view, this.renderer.resolution);
  }

  public setTargetElement(element: HTMLElement, resolution = 1): void {
    this.removeEvents();

    this.interactionDOMElement = element;

    this.resolution = resolution;

    this.addEvents();
  }

  public processInteractive(
    interactionEvent: InteractionEvent,
    displayObject: DisplayObject,
    func?: InteractionCallback,
    hitTest?: boolean,
  ): boolean {
    const hit = this.search.findHit(
      interactionEvent,
      displayObject,
      func,
      hitTest,
    );

    const delayedEvents = this.delayedEvents;

    if (!delayedEvents.length) {
      return hit;
    }
    // Reset the propagation hint, because we start deeper in the tree again.
    interactionEvent.stopPropagationHint = false;

    const delayedLen = delayedEvents.length;

    this.delayedEvents = [];

    for (let i = 0; i < delayedLen; i++) {
      const { displayObject, eventString, eventData } = delayedEvents[i];

      // When we reach the object we wanted to stop propagating at,
      // set the propagation hint.
      if (eventData.stopsPropagatingAt === displayObject) {
        eventData.stopPropagationHint = true;
      }

      this.dispatchEvent(displayObject, eventString, eventData);
    }

    return hit;
  }

  public mapPositionToPoint(point: PointData, x: number, y: number): void {
    if (this.interactionDOMElement) {
      const rect = this.interactionDOMElement.getBoundingClientRect();

      const resolutionMultiplier = 1.0 / this.resolution;

      point.x =
        (x - rect.left) *
        ((this.interactionDOMElement as any).width / rect.width) *
        resolutionMultiplier;

      point.y =
        (y - rect.top) *
        ((this.interactionDOMElement as any).height / rect.height) *
        resolutionMultiplier;
    }
  }

  public setCursorMode(mode: string | null): void {
    mode = mode || "default";
    let applyStyles = true;

    if (
      self.OffscreenCanvas &&
      this.interactionDOMElement instanceof OffscreenCanvas
    ) {
      applyStyles = false;
    }
    // if the mode didn't actually change, bail early
    if (this.currentCursorMode === mode) {
      return;
    }
    this.currentCursorMode = mode;
    const style = this.cursorStyles[mode];

    // only do things if there is a cursor style for it
    if (style) {
      switch (typeof style) {
        case "string":
          // string styles are handled as cursor CSS
          if (applyStyles && this.interactionDOMElement) {
            this.interactionDOMElement.style.cursor = style;
          }
          break;
        case "function":
          // functions are just called, and passed the cursor mode
          style(mode);
          break;
        case "object":
          // if it is an object, assume that it is a dictionary of CSS styles,
          // apply it to the interactionDOMElement
          if (applyStyles) {
            Object.assign(this.interactionDOMElement!.style, style);
          }
          break;
      }
    } else if (
      applyStyles &&
      typeof mode === "string" &&
      !Object.prototype.hasOwnProperty.call(this.cursorStyles, mode)
    ) {
      // if it mode is a string (not a Symbol) and cursorStyles doesn't have any entry
      // for the mode, then assume that the dev wants it to be CSS for the cursor.
      this.interactionDOMElement!.style.cursor = mode;
    }
  }

  public destroy(): void {
    this.removeEvents();
    this.removeAllListeners();
    this.interactionDOMElement = null;
  }

  private addEvents(): void {
    if (!this.interactionDOMElement) {
      return;
    }

    const style = this.interactionDOMElement.style as CrossCSSStyleDeclaration;

    if ((self.navigator as any).msPointerEnabled) {
      style.msContentZooming = "none";
      style.msTouchAction = "none";
    } else if (this.supportsPointerEvents) {
      style.touchAction = "none";
    }

    /*
     * These events are added first, so that if pointer events are normalized, they are fired
     * in the same order as non-normalized events. ie. pointer event 1st, mouse / touch 2nd
     */
    if (this.supportsPointerEvents) {
      self.document.addEventListener(
        "pointermove",
        this.onPointerMove,
        this._eventListenerOptions,
      );
      this.interactionDOMElement.addEventListener(
        "pointerdown",
        this.onPointerDown,
        this._eventListenerOptions,
      );

      this.interactionDOMElement.addEventListener(
        "pointerleave",
        this.onPointerOut,
        this._eventListenerOptions,
      );
      this.interactionDOMElement.addEventListener(
        "pointerover",
        this.onPointerOver,
        this._eventListenerOptions,
      );
      /*       self.addEventListener(
        "pointercancel",
        this.onPointerCancel,
        this._eventListenerOptions
      ); */
      self.addEventListener(
        "pointerup",
        this.onPointerUp,
        this._eventListenerOptions,
      );
    } else {
      self.document.addEventListener(
        "mousemove",
        this.onPointerMove,
        this._eventListenerOptions,
      );
      this.interactionDOMElement.addEventListener(
        "mousedown",
        this.onPointerDown,
        this._eventListenerOptions,
      );
      this.interactionDOMElement.addEventListener(
        "mouseout",
        this.onPointerOut,
        this._eventListenerOptions,
      );
      this.interactionDOMElement.addEventListener(
        "mouseover",
        this.onPointerOver,
        this._eventListenerOptions,
      );
      self.addEventListener(
        "mouseup",
        this.onPointerUp,
        this._eventListenerOptions,
      );
    }

    this.interactionDOMElement.addEventListener(
      "wheel",
      this.onWheel,
      this._eventListenerOptions,
    );

    this.interactionDOMElement.addEventListener(
      "dblclick",
      this.onDblClick,
      this._eventListenerOptions,
    );

    // always look directly for touch events so that we can provide original data
    // In a future version we should change this to being just a fallback and rely solely on
    // PointerEvents whenever available
    if (this.supportsTouchEvents) {
      this.interactionDOMElement.addEventListener(
        "touchstart",
        this.onPointerDown,
        this._eventListenerOptions,
      );
      /*       this.interactionDOMElement.addEventListener(
        "touchcancel",
        this.onPointerCancel,
        this._eventListenerOptions
      ); */
      this.interactionDOMElement.addEventListener(
        "touchend",
        this.onPointerUp,
        this._eventListenerOptions,
      );
      this.interactionDOMElement.addEventListener(
        "touchmove",
        this.onPointerMove,
        this._eventListenerOptions,
      );
    }
  }

  private removeEvents(): void {
    if (!this.interactionDOMElement) {
      return;
    }
  }

  private delayDispatchEvent(
    displayObject: DisplayObject,
    eventString: string,
    eventData: InteractionEvent,
  ): void {
    this.delayedEvents.push({ displayObject, eventString, eventData });
  }

  private onPointerMove = (originalEvent: InteractivePointerEvent): void => {
    const events = this.normalizeToPointerData(originalEvent);

    if (events[0].pointerType === "mouse" || events[0].pointerType === "pen") {
      this.cursor = null;
    }

    for (const event of events) {
      const interactionData = this.getInteractionDataForPointerId(event);

      const interactionEvent = this.configureInteractionEventForDOMEvent(
        this.eventData,
        event,
        interactionData,
      );

      interactionEvent.data!.originalEvent = originalEvent;

      this.processInteractive(
        interactionEvent,
        this.lastObjectRendered,
        this.processPointerMove,
        true,
      );

      this.emit("pointermove", interactionEvent);
    }

    if (events[0].pointerType === "mouse") {
      this.setCursorMode(this.cursor);
    }
  };

  private processPointerMove = (
    interactionEvent: InteractionEvent,
    displayObject: DisplayObject,
    hit?: boolean,
  ): void => {
    const data = interactionEvent.data;

    const isTouch = data?.pointerType === "touch";

    const isMouse =
      data?.pointerType === "mouse" || data?.pointerType === "pen";

    if (isMouse) {
      this.processPointerOverOut(interactionEvent, displayObject, hit);
    }

    if (hit) {
      this.dispatchEvent(displayObject, "pointermove", interactionEvent);

      if (isTouch)
        this.dispatchEvent(displayObject, "touchmove", interactionEvent);
      if (isMouse)
        this.dispatchEvent(displayObject, "mousemove", interactionEvent);
    }
  };

  private processPointerOverOut = (
    interactionEvent: InteractionEvent,
    displayObject: DisplayObject,
    hit?: boolean,
  ): void => {
    const data = interactionEvent.data;

    const id = interactionEvent?.data?.identifier ?? -1;

    const isMouse =
      data?.pointerType === "mouse" || data?.pointerType === "pen";

    let trackingData = displayObject.trackedPointers[id];

    if (hit && !trackingData) {
      trackingData = displayObject.trackedPointers[id] =
        new InteractionTrackingData(id);
    }

    if (trackingData === undefined) return;

    if (hit && this.mouseOverRenderer) {
      if (!trackingData.over) {
        trackingData.over = true;
        this.delayDispatchEvent(displayObject, "pointerover", interactionEvent);

        if (isMouse) {
          this.delayDispatchEvent(displayObject, "mouseover", interactionEvent);
        }
      }

      // only change the cursor if it has not already been changed (by something deeper in the
      // display tree)
      if (isMouse && this.cursor === null) {
        this.cursor = displayObject.cursor;
      }
    } else if (trackingData.over) {
      trackingData.over = false;
      this.dispatchEvent(displayObject, "pointerout", this.eventData);
      if (isMouse) {
        this.dispatchEvent(displayObject, "mouseout", interactionEvent);
      }
      // if there is no mouse down information for the pointer, then it is safe to delete
      if (trackingData.none) {
        delete displayObject.trackedPointers[id];
      }
    }
  };

  private onPointerDown = (originalEvent: InteractivePointerEvent): void => {
    const events = this.normalizeToPointerData(originalEvent);

    for (const event of events) {
      const interactionData = this.getInteractionDataForPointerId(event);

      const interactionEvent = this.configureInteractionEventForDOMEvent(
        this.eventData,
        event,
        interactionData,
      );

      interactionEvent.data!.originalEvent = originalEvent;

      this.processInteractive(
        interactionEvent,
        this.lastObjectRendered,
        this.processPointerDown,
        true,
      );

      this.emit("pointerdown", interactionEvent);

      if (event.pointerType === "touch") {
        this.emit("touchstart", interactionEvent);
      } else if (event.pointerType === "mouse" || event.pointerType === "pen") {
        const isRightButton = event.button === 2;

        this.emit(isRightButton ? "rightdown" : "mousedown", this.eventData);
      }
    }
  };

  private processPointerDown = (
    interactionEvent: InteractionEvent,
    displayObject: DisplayObject,
    hit?: boolean,
  ): void => {
    const data = interactionEvent.data;
    const id = interactionEvent?.data?.identifier ?? -1;

    if (hit) {
      if (!displayObject.trackedPointers[id]) {
        displayObject.trackedPointers[id] = new InteractionTrackingData(id);
      }
      this.dispatchEvent(displayObject, "pointerdown", interactionEvent);

      if (data?.pointerType === "touch") {
        this.dispatchEvent(displayObject, "touchstart", interactionEvent);
      } else if (data?.pointerType === "mouse" || data?.pointerType === "pen") {
        const isRightButton = data.button === 2;

        if (isRightButton) {
          displayObject.trackedPointers[id].rightDown = true;
        } else {
          displayObject.trackedPointers[id].leftDown = true;
        }

        this.dispatchEvent(
          displayObject,
          isRightButton ? "rightdown" : "mousedown",
          interactionEvent,
        );
      }
    }
  };

  private onPointerOut = (originalEvent: InteractivePointerEvent): void => {
    const events = this.normalizeToPointerData(originalEvent);

    // Only mouse and pointer can call onPointerOut, so events will always be length 1
    const event = events[0];

    if (event.pointerType === "mouse") {
      this.mouseOverRenderer = false;
      this.setCursorMode(null);
    }

    const interactionData = this.getInteractionDataForPointerId(event);

    const interactionEvent = this.configureInteractionEventForDOMEvent(
      this.eventData,
      event,
      interactionData,
    );

    interactionEvent.data!.originalEvent = event;

    this.processInteractive(
      interactionEvent,
      this.lastObjectRendered,
      this.processPointerOverOut,
      false,
    );

    this.emit("pointerout", interactionEvent);
    if (event.pointerType === "mouse" || event.pointerType === "pen") {
      this.emit("mouseout", interactionEvent);
    } else {
      // we can get touchleave events after touchend, so we want to make sure we don't
      // introduce memory leaks
      this.releaseInteractionDataForPointerId(interactionData.identifier!);
    }
  };

  private onPointerOver = (originalEvent: InteractivePointerEvent): void => {
    const events = this.normalizeToPointerData(originalEvent);

    // Only mouse and pointer can call onPointerOver, so events will always be length 1
    const event = events[0];

    const interactionData = this.getInteractionDataForPointerId(event);

    const interactionEvent = this.configureInteractionEventForDOMEvent(
      this.eventData,
      event,
      interactionData,
    );

    interactionEvent.data!.originalEvent = event;

    if (event.pointerType === "mouse") {
      this.mouseOverRenderer = true;
    }

    this.emit("pointerover", interactionEvent);
    if (event.pointerType === "mouse" || event.pointerType === "pen") {
      this.emit("mouseover", interactionEvent);
    }
  };

  private onPointerUp = (event: InteractivePointerEvent): void => {
    this.onPointerComplete(event, false, this.processPointerUp);
  };

  private processPointerUp = (
    interactionEvent: InteractionEvent,
    displayObject: DisplayObject,
    hit?: boolean,
  ): void => {
    const data = interactionEvent.data;

    const id = interactionEvent?.data?.identifier ?? -1;

    const trackingData = displayObject.trackedPointers[id];

    const isTouch = data?.pointerType === "touch";

    const isMouse =
      data?.pointerType === "mouse" || data?.pointerType === "pen";
    // need to track mouse down status in the mouse block so that we can emit
    // event in a later block
    let isMouseTap = false;

    // Mouse only
    if (isMouse) {
      const isRightButton = data?.button === 2;

      const flags = InteractionTrackingData.FLAGS;

      const test = isRightButton ? flags.RIGHT_DOWN : flags.LEFT_DOWN;

      const isDown = trackingData !== undefined && trackingData.flags & test;

      if (hit) {
        this.dispatchEvent(
          displayObject,
          isRightButton ? "rightup" : "mouseup",
          interactionEvent,
        );

        if (isDown) {
          this.dispatchEvent(
            displayObject,
            isRightButton ? "rightclick" : "click",
            interactionEvent,
          );
          // because we can confirm that the mousedown happened on this object, flag for later emit of pointertap
          isMouseTap = true;
        }
      } else if (isDown) {
        this.dispatchEvent(
          displayObject,
          isRightButton ? "rightupoutside" : "mouseupoutside",
          interactionEvent,
        );
      }
      // update the down state of the tracking data
      if (trackingData) {
        if (isRightButton) {
          trackingData.rightDown = false;
        } else {
          trackingData.leftDown = false;
        }
      }
    }

    // Pointers and Touches, and Mouse
    if (hit) {
      this.dispatchEvent(displayObject, "pointerup", interactionEvent);
      if (isTouch)
        this.dispatchEvent(displayObject, "touchend", interactionEvent);

      if (trackingData) {
        // emit pointertap if not a mouse, or if the mouse block decided it was a tap
        if (!isMouse || isMouseTap) {
          this.dispatchEvent(displayObject, "pointertap", interactionEvent);
        }
        if (isTouch) {
          this.dispatchEvent(displayObject, "tap", interactionEvent);
          // touches are no longer over (if they ever were) when we get the touchend
          // so we should ensure that we don't keep pretending that they are
          trackingData.over = false;
        }
      }
    } else if (trackingData) {
      this.dispatchEvent(displayObject, "pointerupoutside", interactionEvent);
      if (isTouch)
        this.dispatchEvent(displayObject, "touchendoutside", interactionEvent);
    }
    // Only remove the tracking data if there is no over/down state still associated with it
    if (trackingData && trackingData.none) {
      delete displayObject.trackedPointers[id];
    }
  };

  private onPointerComplete = (
    originalEvent: InteractivePointerEvent,
    cancelled: boolean,
    func: InteractionCallback,
  ): void => {
    const events = this.normalizeToPointerData(originalEvent);

    const eventLen = events.length;

    // if the event wasn't targeting our canvas, then consider it to be pointerupoutside
    // in all cases (unless it was a pointercancel)
    const eventAppend =
      originalEvent.target !== this.interactionDOMElement ? "outside" : "";

    for (let i = 0; i < eventLen; i++) {
      const event = events[i];

      const interactionData = this.getInteractionDataForPointerId(event);

      const interactionEvent = this.configureInteractionEventForDOMEvent(
        this.eventData,
        event,
        interactionData,
      );

      interactionEvent.data!.originalEvent = originalEvent;

      // perform hit testing for events targeting our canvas or cancel events
      this.processInteractive(
        interactionEvent,
        this.lastObjectRendered,
        func,
        cancelled || !eventAppend,
      );

      this.emit(
        cancelled ? "pointercancel" : `pointerup${eventAppend}`,
        interactionEvent,
      );

      if (event.pointerType === "mouse" || event.pointerType === "pen") {
        const isRightButton = event.button === 2;

        this.emit(
          isRightButton ? `rightup${eventAppend}` : `mouseup${eventAppend}`,
          interactionEvent,
        );
      } else if (event.pointerType === "touch") {
        this.emit(
          cancelled ? "touchcancel" : `touchend${eventAppend}`,
          interactionEvent,
        );

        this.releaseInteractionDataForPointerId(event.pointerId);
      }
    }
  };

  private onDblClick = (originalEvent: InteractivePointerEvent): void => {
    const events = this.normalizeToPointerData(originalEvent);

    // Only mouse and pointer can call onDblClick, so events will always be length 1
    const event = events[0];

    const interactionData = this.getInteractionDataForPointerId(event);

    const interactionEvent = this.configureInteractionEventForDOMEvent(
      this.eventData,
      event,
      interactionData,
    );

    interactionEvent.data!.originalEvent = originalEvent;

    this.processInteractive(
      interactionEvent,
      this.lastObjectRendered,
      this.processDblClick,
      true,
    );
  };

  private processDblClick = (
    interactionEvent: InteractionEvent,
    displayObject: DisplayObject,
    hit?: boolean,
  ): void => {
    if (hit) {
      interactionEvent.data?.originalEvent?.preventDefault();
      this.dispatchEvent(displayObject, "dblclick", interactionEvent);
    }
  };

  private onWheel = (originalEvent: InteractivePointerEvent): void => {
    const events = this.normalizeToPointerData(originalEvent);

    if (events[0].pointerType === "mouse" || events[0].pointerType === "pen") {
      this.cursor = null;
    }

    for (const event of events) {
      const interactionData = this.getInteractionDataForPointerId(event);

      const interactionEvent = this.configureInteractionEventForDOMEvent(
        this.eventData,
        event,
        interactionData,
      );

      interactionEvent.data!.originalEvent = originalEvent;

      this.processInteractive(
        interactionEvent,
        this.lastObjectRendered,
        this.processWheel,
        true,
      );

      this.emit("pointermove", interactionEvent);
    }
  };

  private processWheel = (
    interactionEvent: InteractionEvent,
    displayObject: DisplayObject,
    hit?: boolean,
  ): void => {
    if (hit) {
      interactionEvent.data?.originalEvent?.preventDefault();
      this.dispatchEvent(displayObject, "wheel", interactionEvent);
    }
  };

  private releaseInteractionDataForPointerId(pointerId: number): void {
    const interactionData = this.activeInteractionData[pointerId];

    if (interactionData) {
      delete this.activeInteractionData[pointerId];
      interactionData.reset();
      this.interactionDataPool.push(interactionData);
    }
  }

  private dispatchEvent(
    displayObject: DisplayObject,
    eventString: string,
    eventData: InteractionEvent,
  ): void {
    if (
      !eventData.stopPropagationHint ||
      displayObject === eventData.stopsPropagatingAt
    ) {
      eventData.currentTarget = displayObject;
      eventData.type = eventString;

      displayObject.emit(eventString, eventData);

      if ((displayObject as any)[eventString]) {
        (displayObject as any)[eventString](eventData);
      }
    }
  }

  private configureInteractionEventForDOMEvent(
    interactionEvent: InteractionEvent,
    pointerEvent: PointerEvent,
    interactionData: InteractionData,
  ): InteractionEvent {
    interactionEvent.data = interactionData;

    this.mapPositionToPoint(
      interactionData.global,
      pointerEvent.clientX,
      pointerEvent.clientY,
    );

    // Not really sure why this is happening, but it's how a previous version handled things
    if (pointerEvent.pointerType === "touch") {
      (pointerEvent as any).globalX = interactionData.global.x;
      (pointerEvent as any).globalY = interactionData.global.y;
    }

    interactionData.originalEvent = pointerEvent;
    interactionEvent.reset();

    return interactionEvent;
  }

  private normalizeToPointerData(
    event: InteractivePointerEvent,
  ): PennantPointerEvent[] {
    const normalizedEvents = [];

    if (event instanceof WheelEvent) {
      const tempEvent = event as PennantPointerEvent;

      if (typeof tempEvent.deltaX === "undefined")
        tempEvent.deltaX = event.deltaX;
      if (typeof tempEvent.deltaY === "undefined")
        tempEvent.deltaY = event.deltaY;

      normalizedEvents.push(tempEvent);
    } else if (this.supportsTouchEvents && event instanceof TouchEvent) {
      for (let i = 0, li = event.changedTouches.length; i < li; i++) {
        const touch = event.changedTouches[i] as PixiTouch;

        if (typeof touch.button === "undefined")
          touch.button = event.touches.length ? 1 : 0;
        if (typeof touch.buttons === "undefined")
          touch.buttons = event.touches.length ? 1 : 0;
        if (typeof touch.isPrimary === "undefined") {
          touch.isPrimary =
            event.touches.length === 1 && event.type === "touchstart";
        }
        if (typeof touch.width === "undefined")
          touch.width = touch.radiusX || 1;
        if (typeof touch.height === "undefined")
          touch.height = touch.radiusY || 1;
        if (typeof touch.tiltX === "undefined") touch.tiltX = 0;
        if (typeof touch.tiltY === "undefined") touch.tiltY = 0;
        if (typeof touch.pointerType === "undefined")
          touch.pointerType = "touch";
        if (typeof touch.pointerId === "undefined")
          touch.pointerId = touch.identifier || 0;
        if (typeof touch.pressure === "undefined")
          touch.pressure = touch.force || 0.5;
        if (typeof touch.twist === "undefined") touch.twist = 0;
        if (typeof touch.tangentialPressure === "undefined")
          touch.tangentialPressure = 0;

        // mark the touch as normalized, just so that we know we did it
        touch.isNormalized = true;

        normalizedEvents.push(touch);
      }
    }
    // apparently PointerEvent subclasses MouseEvent, so yay
    else if (
      !self.MouseEvent ||
      (event instanceof MouseEvent &&
        (!this.supportsPointerEvents || !(event instanceof self.PointerEvent)))
    ) {
      const tempEvent = event as PennantPointerEvent;

      if (typeof tempEvent.isPrimary === "undefined")
        tempEvent.isPrimary = true;
      if (typeof tempEvent.width === "undefined") tempEvent.width = 1;
      if (typeof tempEvent.height === "undefined") tempEvent.height = 1;
      if (typeof tempEvent.tiltX === "undefined") tempEvent.tiltX = 0;
      if (typeof tempEvent.tiltY === "undefined") tempEvent.tiltY = 0;
      if (typeof tempEvent.pointerType === "undefined")
        tempEvent.pointerType = "mouse";
      if (typeof tempEvent.pointerId === "undefined")
        tempEvent.pointerId = MOUSE_POINTER_ID;
      if (typeof tempEvent.pressure === "undefined") tempEvent.pressure = 0.5;
      if (typeof tempEvent.twist === "undefined") tempEvent.twist = 0;
      if (typeof tempEvent.tangentialPressure === "undefined")
        tempEvent.tangentialPressure = 0;

      // mark the mouse event as normalized, just so that we know we did it
      tempEvent.isNormalized = true;

      normalizedEvents.push(tempEvent);
    } else {
      normalizedEvents.push(event);
    }

    return normalizedEvents as PennantPointerEvent[];
  }

  private getInteractionDataForPointerId(
    event: PennantPointerEvent,
  ): InteractionData {
    const pointerId = event.pointerId;

    let interactionData;

    if (pointerId === MOUSE_POINTER_ID || event.pointerType === "mouse") {
      interactionData = this.mouse;
    } else if (this.activeInteractionData[pointerId]) {
      interactionData = this.activeInteractionData[pointerId];
    } else {
      interactionData = this.interactionDataPool.pop() || new InteractionData();
      interactionData.identifier = pointerId;
      this.activeInteractionData[pointerId] = interactionData;
    }

    interactionData.copyEvent(event);

    return interactionData;
  }

  get lastObjectRendered(): DisplayObject {
    return (
      (this.renderer._lastObjectRendered as unknown as DisplayObject) ??
      this._tempDisplayObject
    );
  }
}

interface PixiTouch extends Touch {
  button: number;
  buttons: number;
  isPrimary: boolean;
  width: number;
  height: number;
  tiltX: number;
  tiltY: number;
  pointerType: string;
  pointerId: number;
  pressure: number;
  twist: number;
  tangentialPressure: number;
  layerX: number;
  layerY: number;
  offsetX: number;
  offsetY: number;
  isNormalized: boolean;
}

export interface PennantPointerEvent extends PointerEvent, WheelEvent {
  isPrimary: boolean;
  width: number;
  height: number;
  tiltX: number;
  tiltY: number;
  pointerType: string;
  pointerId: number;
  pressure: number;
  twist: number;
  tangentialPressure: number;
  deltaX: number;
  deltaY: number;
  isNormalized: boolean;
}
