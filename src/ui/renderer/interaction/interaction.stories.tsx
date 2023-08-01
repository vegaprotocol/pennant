import { curveBasis } from "d3-shape";
import { useEffect, useRef } from "react";

import { Renderer } from "../core";
import { Container } from "../display";
import { Graphics } from "../graphics";
import { Rectangle } from "../math";

export default {
  title: "Renderer/Interaction",
};

export const Simple = () => {
  const ref = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    const stage = new Container();
    stage.interactive = true;
    stage.hitArea = new Rectangle(0, 0, 800, 600);

    const renderer = new Renderer({
      resolution: 1,
      view: ref.current,
    });

    const graphics = new Graphics();

    graphics.beginFill(0xde3249);
    graphics.drawRect(50, 50, 100, 100);
    graphics.endFill();

    graphics.lineStyle({ color: 0xfeeb77, width: 2 });
    graphics.beginFill(0x650a5a);
    graphics.drawRect(200, 50, 100, 100);
    graphics.endFill();

    graphics.lineStyle({ color: 0xffbd01, width: 10 });
    graphics.beginFill(0xc34288);
    graphics.drawRect(350, 50, 100, 100);
    graphics.endFill();

    graphics.lineStyle({ color: 0xffffff, width: 2 });
    graphics.beginFill(0xaa4f08);
    graphics.drawRect(530, 50, 140, 100);
    graphics.endFill();

    graphics.interactive = true;
    graphics.on("mousedown", (event) => {
      console.log("Graphics");
    });

    graphics.cursor = "grab";

    const horizontal = new Graphics();

    horizontal.beginFill(0xde3249);
    horizontal.drawRect(0, 0, 800, 1);
    horizontal.endFill();

    const vertical = new Graphics();

    vertical.beginFill(0xde3249);
    vertical.drawRect(0, 0, 1, 600);
    vertical.endFill();

    stage
      .on("pointermove", (event) => {
        horizontal.visible = true;
        vertical.visible = true;

        horizontal.y = event.data.global.y;
        vertical.x = event.data.global.x;

        requestAnimationFrame(() => renderer.render(stage));
      })
      .on("pointerout", (event) => {
        horizontal.visible = false;
        vertical.visible = false;

        requestAnimationFrame(() => renderer.render(stage));
      });

    stage.addChild(graphics);
    stage.addChild(horizontal);
    stage.addChild(vertical);

    renderer.render(stage);
  });

  return (
    <div style={{ border: "1px solid grey" }}>
      <canvas ref={ref} width="800" height="600" />
    </div>
  );
};

export const Advanced = () => {
  const ref = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    const container = new Container();
    const renderer = new Renderer({
      resolution: 1,
      view: ref.current,
    });

    const realPath = new Graphics();

    realPath.lineStyle({ width: 2, color: 0xffffff });
    realPath.drawLine([
      [0, 0],
      [100, 200],
      [200, 200],
      [240, 100],
    ]);

    realPath.position.x = 50;
    realPath.position.y = 50;

    container.addChild(realPath);

    const curve = new Graphics();

    curve.lineStyle({ width: 5, color: 0xaa0000 });
    curve.drawLine(
      [
        [0, 0],
        [100, 200],
        [200, 200],
        [240, 100],
      ],
      curveBasis,
    );

    curve.position.x = 50;
    curve.position.y = 50;

    container.addChild(curve);

    renderer.render(container);
  });

  return (
    <div style={{ border: "1px solid grey" }}>
      <canvas ref={ref} width="800" height="600" />
    </div>
  );
};

export const Dynamic = () => {
  const ref = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    const container = new Container();
    const renderer = new Renderer({
      resolution: 1,
      view: ref.current,
    });

    const thing = new Graphics();

    container.addChild(thing);

    thing.x = 800 / 2;
    thing.y = 600 / 2;

    let start: any;

    function step(timestamp: number) {
      if (start === undefined) start = timestamp;
      const elapsed = timestamp - start;
      const count = (4 * elapsed) / 1000;

      thing.clear();
      thing.lineStyle({ width: 10, color: 0xff0000 });
      thing.beginFill(0xffff00);

      thing.drawRect(0, 0, 100, 100);

      thing.rotation = count * 0.1;

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
