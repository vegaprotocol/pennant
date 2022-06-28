import { RenderableElement, RenderableHTMLElement } from "../elements";
import { UpdatableObject } from "../renderer/core/updatable-object";

export type { RenderableElement, RenderableHTMLElement };
export interface Pane {
  id: string;
  name: string;
  originalData: any[];
  renderableElements: RenderableElement[][];
  objects: UpdatableObject[];
  labels?: RenderableHTMLElement[];
  labelLines?: RenderableElement[];

  /**
   * Fields to use to determine y axis extent
   */
  yEncodingFields: string[];
  yDomain?: [number, number];
}

export interface Scenegraph {
  panes: Pane[];
}
