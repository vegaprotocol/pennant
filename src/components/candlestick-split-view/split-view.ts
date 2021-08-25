import { range } from "d3-array";
import { clamp } from "lodash";

import styles from "./candlestick-split-view.module.css";
import {
  Orientation,
  Sash,
  SashEvent as BaseSashEvent,
  SashState,
} from "./sash";

interface SashEvent {
  readonly sash: Sash;
  readonly start: number;
  readonly current: number;
}

export interface SplitViewOptions {
  readonly orientation?: Orientation;
  readonly orthogonalStartSash?: Sash;
  readonly orthogonalEndSash?: Sash;
  readonly inverseAltBehavior?: boolean;
  readonly proportionalLayout?: boolean;
  readonly getSashOrthogonalSize?: () => number;
}

export interface View {
  readonly element: HTMLElement;
  readonly minimumSize: number;
  readonly maximumSize: number;
  readonly snap?: boolean;
  layout(size: number, offset: number): void;
  setVisible?(visible: boolean): void;
}

abstract class ViewItem {
  protected container: HTMLElement;
  private view: View;
  private _size: number;

  constructor(container: HTMLElement, view: View, size: number) {
    this.container = container;
    this.view = view;
    this._size = size;
  }

  set size(size: number) {
    this._size = size;
  }

  get size(): number {
    return this._size;
  }

  get snap(): boolean {
    return !!this.view.snap;
  }

  private _cachedVisibleSize: number | undefined = undefined;
  get cachedVisibleSize(): number | undefined {
    return this._cachedVisibleSize;
  }

  get visible(): boolean {
    return typeof this._cachedVisibleSize === "undefined";
  }

  setVisible(visible: boolean, size?: number): void {
    if (visible === this.visible) {
      return;
    }

    if (visible) {
      this.size = clamp(
        this._cachedVisibleSize!,
        this.viewMinimumSize,
        this.viewMaximumSize
      );
      this._cachedVisibleSize = undefined;
    } else {
      this._cachedVisibleSize = typeof size === "number" ? size : this.size;
      this.size = 0;
    }

    this.container.classList.toggle("visible", visible);

    if (this.view.setVisible) {
      this.view.setVisible(visible);
    }
  }

  get minimumSize(): number {
    return this.visible ? this.view.minimumSize : 0;
  }
  get viewMinimumSize(): number {
    return this.view.minimumSize;
  }

  get maximumSize(): number {
    return this.visible ? this.view.maximumSize : 0;
  }
  get viewMaximumSize(): number {
    return this.view.maximumSize;
  }

  set enabled(enabled: boolean) {
    this.container.style.pointerEvents = enabled ? "" : "none";
  }

  layout(offset: number): void {
    this.layoutContainer(offset);
    this.view.layout(this.size, offset);
  }

  abstract layoutContainer(offset: number): void;
}

class VerticalViewItem extends ViewItem {
  layoutContainer(offset: number): void {
    this.container.style.top = `${offset}px`;
    this.container.style.height = `${this.size}px`;
  }
}

interface SashItem {
  sash: Sash;
}

interface SashDragSnapState {
  readonly index: number;
  readonly limitDelta: number;
  readonly size: number;
}

interface SashDragState {
  index: number;
  start: number;
  current: number;
  sizes: number[];
  minDelta: number;
  maxDelta: number;
  snapBefore: SashDragSnapState | undefined;
  snapAfter: SashDragSnapState | undefined;
}

export class SplitView {
  readonly orientation: Orientation;
  private sashContainer: HTMLElement;
  private viewContainer: HTMLElement;
  private size = 0;
  private contentSize = 0;
  private proportions: undefined | number[] = undefined;
  private viewItems: ViewItem[] = [];
  private sashItems: SashItem[] = [];
  private sashDragState: SashDragState | undefined;
  private proportionalLayout: boolean;
  private readonly getSashOrthogonalSize: { (): number } | undefined;

  private _startSnappingEnabled = true;
  get startSnappingEnabled(): boolean {
    return this._startSnappingEnabled;
  }
  set startSnappingEnabled(startSnappingEnabled: boolean) {
    if (this._startSnappingEnabled === startSnappingEnabled) {
      return;
    }

    this._startSnappingEnabled = startSnappingEnabled;
    this.updateSashEnablement();
  }

  private _endSnappingEnabled = true;
  get endSnappingEnabled(): boolean {
    return this._endSnappingEnabled;
  }
  set endSnappingEnabled(endSnappingEnabled: boolean) {
    if (this._endSnappingEnabled === endSnappingEnabled) {
      return;
    }

    this._endSnappingEnabled = endSnappingEnabled;
    this.updateSashEnablement();
  }

  constructor(
    container: HTMLElement,
    viewContainer: HTMLElement,
    options: SplitViewOptions = {}
  ) {
    this.orientation = options.orientation ?? Orientation.VERTICAL;
    this.proportionalLayout = options.proportionalLayout ?? true;
    this.getSashOrthogonalSize = options.getSashOrthogonalSize;

    this.sashContainer = document.createElement("div");
    this.viewContainer = viewContainer;

    this.sashContainer.classList.add(styles.sashContainer);
    container.prepend(this.sashContainer);
  }

  public addView(container: HTMLElement, view: View, size: number) {
    const viewSize = size;

    const item = new VerticalViewItem(container, view, viewSize);

    this.viewItems.push(item);

    if (this.viewItems.length > 1) {
      const sash =
        this.orientation === Orientation.VERTICAL
          ? new Sash(
              this.sashContainer,
              {
                getHorizontalSashTop: (s) => this.getSashPosition(s),
                getHorizontalSashWidth: this.getSashOrthogonalSize,
              },
              { orientation: Orientation.HORIZONTAL }
            )
          : new Sash(
              this.sashContainer,
              {
                getVerticalSashLeft: (s) => this.getSashPosition(s),
                getVerticalSashHeight: this.getSashOrthogonalSize,
              },
              { orientation: Orientation.VERTICAL }
            );

      const sashEventMapper =
        this.orientation === Orientation.VERTICAL
          ? (e: BaseSashEvent) => ({
              sash,
              start: e.startY,
              current: e.currentY,
            })
          : (e: BaseSashEvent) => ({
              sash,
              start: e.startX,
              current: e.currentX,
            });

      sash.on("start", (event: BaseSashEvent) =>
        this.onSashStart(sashEventMapper(event))
      );

      sash.on("change", (event: BaseSashEvent) =>
        this.onSashChange(sashEventMapper(event))
      );

      sash.on("end", this.onSashEnd);

      const sashItem: SashItem = { sash };

      this.sashItems.push(sashItem);
    }

    this.relayout();
  }

  private relayout(): void {
    const contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);

    this.resize(this.viewItems.length - 1, this.size - contentSize, undefined);
    this.distributeEmptySpace();
    this.layoutViews();
    this.saveProportions();
  }

  private onSashStart({ sash, start }: SashEvent): void {
    const index = this.sashItems.findIndex((item) => item.sash === sash);

    const resetSashDragState = (start: number) => {
      const sizes = this.viewItems.map((i) => i.size);

      let minDelta = Number.NEGATIVE_INFINITY;
      let maxDelta = Number.POSITIVE_INFINITY;

      let snapBefore: SashDragSnapState | undefined;
      let snapAfter: SashDragSnapState | undefined;

      const upIndexes = range(index, -1);
      const downIndexes = range(index + 1, this.viewItems.length);

      const minDeltaUp = upIndexes.reduce(
        (r, i) => r + (this.viewItems[i].minimumSize - sizes[i]),
        0
      );

      const maxDeltaUp = upIndexes.reduce(
        (r, i) => r + (this.viewItems[i].viewMaximumSize - sizes[i]),
        0
      );

      const maxDeltaDown =
        downIndexes.length === 0
          ? Number.POSITIVE_INFINITY
          : downIndexes.reduce(
              (r, i) => r + (sizes[i] - this.viewItems[i].minimumSize),
              0
            );

      const minDeltaDown =
        downIndexes.length === 0
          ? Number.NEGATIVE_INFINITY
          : downIndexes.reduce(
              (r, i) => r + (sizes[i] - this.viewItems[i].viewMaximumSize),
              0
            );

      minDelta = Math.max(minDeltaUp, minDeltaDown);
      maxDelta = Math.min(maxDeltaDown, maxDeltaUp);

      const snapBeforeIndex = this.findFirstSnapIndex(upIndexes);
      const snapAfterIndex = this.findFirstSnapIndex(downIndexes);

      if (typeof snapBeforeIndex === "number") {
        const viewItem = this.viewItems[snapBeforeIndex];
        const halfSize = Math.floor(viewItem.viewMinimumSize / 2);

        snapBefore = {
          index: snapBeforeIndex,
          limitDelta: viewItem.visible
            ? minDelta - halfSize
            : minDelta + halfSize,
          size: viewItem.size,
        };
      }

      if (typeof snapAfterIndex === "number") {
        const viewItem = this.viewItems[snapAfterIndex];
        const halfSize = Math.floor(viewItem.viewMinimumSize / 2);

        snapAfter = {
          index: snapAfterIndex,
          limitDelta: viewItem.visible
            ? maxDelta + halfSize
            : maxDelta - halfSize,
          size: viewItem.size,
        };
      }

      this.sashDragState = {
        start,
        current: start,
        index,
        sizes,
        minDelta,
        maxDelta,
        snapBefore,
        snapAfter,
      };
    };

    resetSashDragState(start);
  }

  private onSashChange({ current }: SashEvent): void {
    const { index, start, sizes, minDelta, maxDelta, snapBefore, snapAfter } =
      this.sashDragState!;

    this.sashDragState!.current = current;

    const delta = current - start;

    this.resize(index, delta, sizes, minDelta, maxDelta, snapBefore, snapAfter);

    this.distributeEmptySpace();
    this.layoutViews();
  }

  private onSashEnd = (index: number): void => {
    // TODO: this._onDidSashChange.fire(index);
    this.saveProportions();

    for (const item of this.viewItems) {
      item.enabled = true;
    }
  };

  private getSashPosition(sash: Sash): number {
    let position = 0;

    for (let i = 0; i < this.sashItems.length; i++) {
      position += this.viewItems[i].size;

      if (this.sashItems[i].sash === sash) {
        return position;
      }
    }

    return 0;
  }

  private resize(
    index: number,
    delta: number,
    sizes = this.viewItems.map((i) => i.size),
    overloadMinDelta: number = Number.NEGATIVE_INFINITY,
    overloadMaxDelta: number = Number.POSITIVE_INFINITY,
    snapBefore?: SashDragSnapState,
    snapAfter?: SashDragSnapState
  ): number {
    if (index < 0 || index >= this.viewItems.length) {
      return 0;
    }

    const upIndexes = range(0, index + 1);
    const downIndexes = range(index + 1, this.viewItems.length);

    const upItems = upIndexes.map((i) => this.viewItems[i]);
    const upSizes = upIndexes.map((i) => sizes[i]);

    const downItems = downIndexes.map((i) => this.viewItems[i]);
    const downSizes = downIndexes.map((i) => sizes[i]);

    const minDeltaUp = upIndexes.reduce(
      (r, i) => r + (this.viewItems[i].minimumSize - sizes[i]),
      0
    );

    const maxDeltaUp = upIndexes.reduce(
      (r, i) => r + (this.viewItems[i].maximumSize - sizes[i]),
      0
    );

    const maxDeltaDown =
      downIndexes.length === 0
        ? Number.POSITIVE_INFINITY
        : downIndexes.reduce(
            (r, i) => r + (sizes[i] - this.viewItems[i].minimumSize),
            0
          );

    const minDeltaDown =
      downIndexes.length === 0
        ? Number.NEGATIVE_INFINITY
        : downIndexes.reduce(
            (r, i) => r + (sizes[i] - this.viewItems[i].maximumSize),
            0
          );

    console.log(downIndexes, index);
    console.log(minDeltaUp, minDeltaDown, overloadMinDelta);
    console.log(maxDeltaDown, maxDeltaUp, overloadMaxDelta);

    const minDelta = Math.max(minDeltaUp, minDeltaDown, overloadMinDelta);
    const maxDelta = Math.min(maxDeltaDown, maxDeltaUp, overloadMaxDelta);

    let snapped = false;

    if (snapBefore) {
      const snapView = this.viewItems[snapBefore.index];
      const visible = delta >= snapBefore.limitDelta;
      snapped = visible !== snapView.visible;
      snapView.setVisible(visible, snapBefore.size);
    }

    if (!snapped && snapAfter) {
      const snapView = this.viewItems[snapAfter.index];
      const visible = delta < snapAfter.limitDelta;
      snapped = visible !== snapView.visible;
      snapView.setVisible(visible, snapAfter.size);
    }

    if (snapped) {
      return this.resize(
        index,
        delta,
        sizes,
        overloadMinDelta,
        overloadMaxDelta
      );
    }

    //console.log(delta, minDelta, maxDelta);
    //console.log(upSizes);

    delta = clamp(delta, minDelta, maxDelta);

    for (let i = 0, deltaUp = delta; i < upItems.length; i++) {
      const item = upItems[i];

      const size = clamp(
        upSizes[i] + deltaUp,
        item.minimumSize,
        item.maximumSize
      );

      const viewDelta = size - upSizes[i];

      deltaUp -= viewDelta;

      item.size = size;
    }

    for (let i = 0, deltaDown = delta; i < downItems.length; i++) {
      const item = downItems[i];

      const size = clamp(
        downSizes[i] - deltaDown,
        item.minimumSize,
        item.maximumSize
      );

      const viewDelta = size - downSizes[i];

      deltaDown += viewDelta;
      item.size = size;
    }

    return delta;
  }

  private distributeEmptySpace(): void {
    const contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);
    let emptyDelta = this.size - contentSize;

    const indexes = range(this.viewItems.length - 1, -1);

    for (let i = 0; emptyDelta !== 0 && i < indexes.length; i++) {
      const item = this.viewItems[indexes[i]];
      const size = clamp(
        item.size + emptyDelta,
        item.minimumSize,
        item.maximumSize
      );
      const viewDelta = size - item.size;

      emptyDelta -= viewDelta;
      item.size = size;
    }
  }

  private layoutViews(): void {
    // Save new content size
    this.contentSize = this.viewItems.reduce((r, i) => r + i.size, 0);

    // Layout views
    let offset = 0;

    for (const viewItem of this.viewItems) {
      viewItem.layout(offset);
      offset += viewItem.size;
    }

    // Layout sashes
    this.sashItems.forEach((item) => item.sash.layout());
    this.updateSashEnablement();
  }

  private saveProportions(): void {
    if (this.proportionalLayout && this.contentSize > 0) {
      this.proportions = this.viewItems.map((i) => i.size / this.contentSize);
    }
  }

  private updateSashEnablement(): void {
    let previous = false;

    const collapsesDown = this.viewItems.map(
      (i) => (previous = i.size - i.minimumSize > 0 || previous)
    );

    previous = false;

    const expandsDown = this.viewItems.map(
      (i) => (previous = i.maximumSize - i.size > 0 || previous)
    );

    const reverseViews = [...this.viewItems].reverse();

    previous = false;

    const collapsesUp = reverseViews
      .map((i) => (previous = i.size - i.minimumSize > 0 || previous))
      .reverse();

    previous = false;

    const expandsUp = reverseViews
      .map((i) => (previous = i.maximumSize - i.size > 0 || previous))
      .reverse();

    let position = 0;

    for (let index = 0; index < this.sashItems.length; index++) {
      const { sash } = this.sashItems[index];
      const viewItem = this.viewItems[index];

      position += viewItem.size;

      const min = !(collapsesDown[index] && expandsUp[index + 1]);
      const max = !(expandsDown[index] && collapsesUp[index + 1]);

      if (min && max) {
        const upIndexes = range(0, index + 1);
        const downIndexes = range(index + 1, this.viewItems.length);
        const snapBeforeIndex = this.findFirstSnapIndex(upIndexes);
        const snapAfterIndex = this.findFirstSnapIndex(downIndexes);

        const snappedBefore =
          typeof snapBeforeIndex === "number" &&
          !this.viewItems[snapBeforeIndex].visible;

        const snappedAfter =
          typeof snapAfterIndex === "number" &&
          !this.viewItems[snapAfterIndex].visible;

        if (
          snappedBefore &&
          collapsesUp[index] &&
          (position > 0 || this.startSnappingEnabled)
        ) {
          sash.state = SashState.Minimum;
        } else if (
          snappedAfter &&
          collapsesDown[index] &&
          (position < this.contentSize || this.endSnappingEnabled)
        ) {
          sash.state = SashState.Maximum;
        } else {
          sash.state = SashState.Disabled;
        }
      } else if (min && !max) {
        sash.state = SashState.Minimum;
      } else if (!min && max) {
        sash.state = SashState.Maximum;
      } else {
        sash.state = SashState.Enabled;
      }
    }
  }

  private findFirstSnapIndex(indexes: number[]): number | undefined {
    for (const index of indexes) {
      const viewItem = this.viewItems[index];

      if (!viewItem.visible) {
        continue;
      }

      if (viewItem.snap) {
        return index;
      }
    }

    for (const index of indexes) {
      const viewItem = this.viewItems[index];

      if (viewItem.visible && viewItem.maximumSize - viewItem.minimumSize > 0) {
        return undefined;
      }

      if (!viewItem.visible && viewItem.snap) {
        return index;
      }
    }

    return undefined;
  }
}
