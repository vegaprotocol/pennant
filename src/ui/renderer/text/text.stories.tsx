import { useEffect, useRef } from "react";

import { Renderer } from "../core";
import { Container } from "../display";
import { Text } from "./text";

export default {
  title: "Renderer/Text",
};

export const BasicText = () => {
  const ref = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    const container = new Container();
    const renderer = new Renderer({
      resolution: window.devicePixelRatio,
      view: ref.current,
    });

    const text = new Text("Basic text in pennant", {
      fill: "white",
      fontSize: 24,
      align: "left",
    });

    text.x = 200;
    text.y = 100;

    container.addChild(text);

    renderer.render(container);

    let start: any;

    function step(timestamp: number) {
      if (start === undefined) start = timestamp;
      const elapsed = timestamp - start;

      text.x = (20 * elapsed) / 1000;

      renderer.render(container);

      if (elapsed < 10000) {
        // Stop the animation after 2 seconds
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  });

  return (
    <div style={{ border: "1px solid grey" }}>
      <canvas ref={ref} width="800" height="600" />
    </div>
  );
};
