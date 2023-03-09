import { useEffect, useRef } from "react";

import { Container } from "../../display";
import { Rectangle } from "../../math";
import { Sprite } from "../../sprite";
import { Renderer } from "../renderer";
import { Texture } from "./texture";

export default {
  title: "Renderer/Texture",
};

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

function createGradTexture() {
  // adjust it if somehow you need better quality for very very big images
  const quality = 8;
  //const canvas = document.createElement("canvas");
  canvas.width = quality;
  canvas.height = 1;

  const ctx = canvas.getContext("2d");

  // use canvas2d API to create gradient
  const grd = ctx!.createLinearGradient(0, 0, quality, 0);
  grd.addColorStop(0, "rgba(0,0,0, 0.0)");
  grd.addColorStop(1, "rgba(0,0,0, 1.0)");

  ctx!.fillStyle = grd;
  ctx!.fillRect(0, 0, quality, 1);

  return Texture.from(canvas);
}

export const GradientBasic = () => {
  const ref = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    const container = new Container();
    const renderer = new Renderer({
      resolution: 1.5,
      view: ref.current,
    });

    const gradTexture = createGradTexture();

    gradTexture.orig = new Rectangle(0, 0, 8, 1);
    gradTexture._frame = new Rectangle(0, 0, 8, 1);

    const sprite = new Sprite(gradTexture);

    sprite.position.set(100, 100);
    sprite.rotation = Math.PI / 8;
    sprite.width = 256;
    sprite.height = 50;
    sprite.anchor.x = 0;
    sprite.anchor.y = 0;

    container.addChild(sprite);

    const sprite2 = new Sprite(gradTexture);

    sprite2.position.set(100, 100);
    sprite2.rotation = Math.PI / 2;
    sprite2.width = 8;
    sprite2.height = 50;

    container.addChild(sprite2);

    renderer.render(container);
  });

  return (
    <div style={{ border: "1px solid grey", backgroundColor: "yellow" }}>
      <canvas ref={ref} width="800" height="600" />
    </div>
  );
};
