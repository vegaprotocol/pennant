export interface ISashLayoutProvider {}

export interface IVerticalSashLayoutProvider extends ISashLayoutProvider {
  getVerticalSashLeft(sash: Sash): number;
  getVerticalSashTop?(sash: Sash): number;
  getVerticalSashHeight?(sash: Sash): number;
}

export interface IHorizontalSashLayoutProvider extends ISashLayoutProvider {
  getHorizontalSashTop(sash: Sash): number;
  getHorizontalSashLeft?(sash: Sash): number;
  getHorizontalSashWidth?(sash: Sash): number;
}

export class Sash {
  private el: HTMLElement;

  constructor(container: HTMLElement, layoutProvider: IVerticalSashLayoutProvider);
  constructor(container: HTMLElement, layoutProvider: IHorizontalSashLayoutProvider);
  constructor(container: HTMLElement, layoutProvider: ISashLayoutProvider) {
      
  }
