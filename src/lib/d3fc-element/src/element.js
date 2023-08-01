import requestRedraw from "./requestRedraw";

const addMeasureListener = (element) => {
  if (element.__measureListener__ != null) {
    return;
  }
  element.__measureListener__ = (event) =>
    element.setMeasurements(event.detail);
  element.addEventListener("measure", element.__measureListener__);
};

const removeMeasureListener = (element) => {
  if (element.__measureListener__ == null) {
    return;
  }
  element.removeEventListener("measure", element.__measureListener__);
  element.__measureListener__ = null;
};

let el = class {};

if (typeof window !== "undefined") {
  el = HTMLElement;
}

export default (createNode, applyMeasurements) =>
  class extends el {
    static get observedAttributes() {
      return ["use-device-pixel-ratio"];
    }

    attributeChangedCallback(name) {
      switch (name) {
        case "use-device-pixel-ratio":
          this.requestRedraw();
          break;
      }
    }

    connectedCallback() {
      if (this.childNodes.length === 0) {
        this.appendChild(createNode());
      }
      addMeasureListener(this);
    }

    disconnectedCallback() {
      removeMeasureListener(this);
    }

    setMeasurements({ width, height }) {
      const {
        childNodes: [node, ...other],
      } = this;
      if (other.length > 0) {
        throw new Error(
          "A d3fc-svg/canvas element must only contain a single svg/canvas element.",
        );
      }
      applyMeasurements(this, node, { width, height });
    }

    get useDevicePixelRatio() {
      return (
        this.hasAttribute("use-device-pixel-ratio") &&
        this.getAttribute("use-device-pixel-ratio") !== "false"
      );
    }

    set useDevicePixelRatio(useDevicePixelRatio) {
      if (useDevicePixelRatio && !this.useDevicePixelRatio) {
        this.setAttribute("use-device-pixel-ratio", "");
      } else if (!useDevicePixelRatio && this.useDevicePixelRatio) {
        this.removeAttribute("use-device-pixel-ratio");
      }
      this.requestRedraw();
    }

    requestRedraw() {
      requestRedraw(this);
    }
  };
