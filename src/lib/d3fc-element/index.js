/* globals customElements */
import "./src/css";

import Canvas from "./src/canvas";
import Group from "./src/group";
import Svg from "./src/svg";

if (
  typeof customElements === "object" &&
  typeof customElements.define === "function"
) {
  customElements.define("d3fc-canvas", Canvas);
  customElements.define("d3fc-group", Group);
  customElements.define("d3fc-svg", Svg);
}
