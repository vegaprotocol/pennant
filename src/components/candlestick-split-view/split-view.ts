import styles from "./candlestick-split-view.module.css";
import { Sash } from "./sash";

export interface View {
  readonly element: HTMLElement;
  readonly minimumSize: number;
  readonly maximumSize: number;
}

abstract class ViewItem {
  protected container: HTMLElement;
  private view: View;
  public size: number;

  constructor(container: HTMLElement, view: View, size: number) {
    this.container = container;
    this.view = view;
    this.size = size;
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

export class SplitView {
  private sashContainer: HTMLElement;
  private viewContainer: HTMLElement;

  private viewItems: ViewItem[] = [];
  private sashItems: SashItem[] = [];

  constructor(container: HTMLElement, viewContainer: HTMLElement) {
    this.sashContainer = document.createElement("div");
    this.viewContainer = viewContainer;

    this.sashContainer.classList.add(styles.sashContainer);
    container.prepend(this.sashContainer);
  }

  public addView(container: HTMLElement, view: View) {
    const viewSize = 100;

    const item = new VerticalViewItem(container, view, viewSize);

    this.viewItems.push(item);

    console.log(this.viewItems);

    if (this.viewItems.length > 1) {
      /*  const sash = new Sash(this.sashContainer, {
        getHorizontalSashTop: (s) => this.getSashPosition(s),
        getHorizontalSashWidth: this.getSashOrthogonalSize,
      }); */
    }
  }

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
}
