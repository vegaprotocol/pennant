export interface D3fcGroupElement
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLElement>,
    HTMLElement
  > {
  class?: string;
}

export interface D3fcCanvasElement
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLElement>,
    HTMLElement
  > {
  class?: string;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "d3fc-group": D3fcGroupElement;
      "d3fc-canvas": D3fcCanvasElement;
    }
  }
}

export interface FcElement extends HTMLElement {
  requestRedraw(): void;
}
