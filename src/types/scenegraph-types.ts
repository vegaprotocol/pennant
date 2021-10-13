import { UpdatableObject } from "../renderer/core/updatable-object";

export interface Pane {
  id: string;
  name: string;
  originalData: any[];
  objects: UpdatableObject[];

  /**
   * Fields to use to determine y axis extent
   */
  yEncodingFields: string[];
  yDomain?: [number, number];
}

export interface Scenegraph {
  panes: Pane[];
}
