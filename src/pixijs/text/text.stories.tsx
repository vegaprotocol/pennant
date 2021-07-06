import { useRef, useEffect } from "react";
import { Renderer } from "../core";

import { Container } from "../display";
import { Text } from "./text";

export default {
  title: "Text",
};

export const BasicText = () => {
  const ref = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    const container = new Container();
    const renderer = new Renderer();
    const text = new Text("Basic text in pennant", {}, ref.current);

    container.addChild(text);

    renderer.render(container);
  });

  return (
    <div>
      <canvas ref={ref} />
    </div>
  );
};
