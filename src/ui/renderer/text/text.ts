import { Renderer, Texture } from "../core";
import { Rectangle } from "../math";
import { settings } from "../settings";
import { Sprite } from "../sprite";
import { sign } from "../utils";
import { TEXT_GRADIENT } from "./const";
import { TextMetrics } from "./text-metrics";
import { ITextStyle, TextStyle } from "./text-style";

export class Text extends Sprite {
  public static nextLineHeightBehavior = true;

  public canvas: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;

  protected _resolution: number;
  protected _autoResolution: boolean;
  protected _style!: TextStyle;
  protected _text: string;
  protected _font: string;

  constructor(
    text: string,
    style: Partial<ITextStyle> | TextStyle,
    canvas?: HTMLCanvasElement,
  ) {
    if (!canvas) {
      canvas = document.createElement("canvas");
    }

    const texture = Texture.from(canvas);

    texture.orig = new Rectangle();

    super(texture);

    this.canvas = canvas;
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    this._resolution = settings.RESOLUTION;
    this._autoResolution = true;

    this._text = null!;
    this._font = "";

    this.style = style;
    this.text = text;
  }

  public updateText(): void {
    const style = this._style;

    this._font = this._style.toFontString();

    const context = this.context;

    const measured = TextMetrics.measureText(
      this._text || " ",
      this._style,
      this._style.wordWrap,
      this.canvas,
    );

    const width = measured.width;
    const height = measured.height;
    const lines = measured.lines;
    const lineHeight = measured.lineHeight;
    const lineWidths = measured.lineWidths;
    const maxLineWidth = measured.maxLineWidth;
    const fontProperties = measured.fontProperties;

    this.canvas.width = Math.ceil(Math.max(1, width) * this._resolution);
    this.canvas.height = Math.ceil(Math.max(1, height) * this._resolution);

    context.scale(this._resolution, this._resolution);

    context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    context.font = this._font;

    let linePositionX: number;
    let linePositionY: number;

    // set canvas text styles
    context.fillStyle = this._generateFillStyle(style, lines, measured);
    // TODO: Can't have different types for getter and setter. The getter shouldn't have the number type as
    //       the setter converts to string. See this thread for more details:
    //       https://github.com/microsoft/TypeScript/issues/2521
    context.strokeStyle = style.stroke as string;

    context.shadowColor = "black";
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;

    let linePositionYShift = (lineHeight - fontProperties.fontSize) / 2;

    if (
      !Text.nextLineHeightBehavior ||
      lineHeight - fontProperties.fontSize < 0
    ) {
      linePositionYShift = 0;
    }

    // draw lines line by line
    for (let i = 0; i < lines.length; i++) {
      linePositionX = style.strokeThickness / 2;
      linePositionY =
        style.strokeThickness / 2 +
        i * lineHeight +
        fontProperties.ascent +
        linePositionYShift;

      if (style.align === "right") {
        linePositionX += maxLineWidth - lineWidths[i];
      } else if (style.align === "center") {
        linePositionX += (maxLineWidth - lineWidths[i]) / 2;
      }

      if (style.stroke && style.strokeThickness) {
        this.drawLetterSpacing(
          lines[i],
          linePositionX + style.padding,
          linePositionY + style.padding,
          true,
        );
      }

      if (style.fill) {
        this.drawLetterSpacing(
          lines[i],
          linePositionX + style.padding,
          linePositionY + style.padding,
        );
      }
    }

    this.updateTexture();
  }

  _render(renderer: Renderer): void {
    if (this._autoResolution && this._resolution !== renderer.resolution) {
      this._resolution = renderer.resolution;
    }

    this.updateText();

    super._render(renderer);
  }

  private _generateFillStyle(
    style: TextStyle,
    lines: string[],
    metrics: TextMetrics,
  ): string | CanvasGradient | CanvasPattern {
    // TODO: Can't have different types for getter and setter. The getter shouldn't have the number type as
    //       the setter converts to string. See this thread for more details:
    //       https://github.com/microsoft/TypeScript/issues/2521
    const fillStyle: string | string[] | CanvasGradient | CanvasPattern =
      style.fill as any;

    if (!Array.isArray(fillStyle)) {
      return fillStyle;
    } else if (fillStyle.length === 1) {
      return fillStyle[0];
    }

    // the gradient will be evenly spaced out according to how large the array is.
    // ['#FF0000', '#00FF00', '#0000FF'] would created stops at 0.25, 0.5 and 0.75
    let gradient: string[] | CanvasGradient;

    // a dropshadow will enlarge the canvas and result in the gradient being
    // generated with the incorrect dimensions
    const dropShadowCorrection = style.dropShadow
      ? style.dropShadowDistance
      : 0;

    // should also take padding into account, padding can offset the gradient
    const padding = style.padding || 0;

    const width =
      Math.ceil(this.canvas.width / this._resolution) -
      dropShadowCorrection -
      padding * 2;

    const height =
      Math.ceil(this.canvas.height / this._resolution) -
      dropShadowCorrection -
      padding * 2;

    // make a copy of the style settings, so we can manipulate them later
    const fill = fillStyle.slice();
    const fillGradientStops = style.fillGradientStops.slice();

    // wanting to evenly distribute the fills. So an array of 4 colours should give fills of 0.25, 0.5 and 0.75
    if (!fillGradientStops.length) {
      const lengthPlus1 = fill.length + 1;

      for (let i = 1; i < lengthPlus1; ++i) {
        fillGradientStops.push(i / lengthPlus1);
      }
    }

    // stop the bleeding of the last gradient on the line above to the top gradient of the this line
    // by hard defining the first gradient colour at point 0, and last gradient colour at point 1
    fill.unshift(fillStyle[0]);
    fillGradientStops.unshift(0);

    fill.push(fillStyle[fillStyle.length - 1]);
    fillGradientStops.push(1);

    if (style.fillGradientType === TEXT_GRADIENT.LINEAR_VERTICAL) {
      // start the gradient at the top center of the canvas, and end at the bottom middle of the canvas
      gradient = this.context.createLinearGradient(
        width / 2,
        padding,
        width / 2,
        height + padding,
      );

      // we need to repeat the gradient so that each individual line of text has the same vertical gradient effect
      // ['#FF0000', '#00FF00', '#0000FF'] over 2 lines would create stops at 0.125, 0.25, 0.375, 0.625, 0.75, 0.875

      // Actual height of the text itself, not counting spacing for lineHeight/leading/dropShadow etc
      const textHeight =
        metrics.fontProperties.fontSize + style.strokeThickness;

      // textHeight, but as a 0-1 size in global gradient stop space
      const gradStopLineHeight = textHeight / height;

      for (let i = 0; i < lines.length; i++) {
        const thisLineTop = metrics.lineHeight * i;

        for (let j = 0; j < fill.length; j++) {
          // 0-1 stop point for the current line, multiplied to global space afterwards
          let lineStop = 0;

          if (typeof fillGradientStops[j] === "number") {
            lineStop = fillGradientStops[j];
          } else {
            lineStop = j / fill.length;
          }

          let globalStop = Math.min(
            1,
            Math.max(0, thisLineTop / height + lineStop * gradStopLineHeight),
          );

          // There's potential for floating point precision issues at the seams between gradient repeats.
          globalStop = Number(globalStop.toFixed(5));
          gradient.addColorStop(globalStop, fill[j]);
        }
      }
    } else {
      // start the gradient at the center left of the canvas, and end at the center right of the canvas
      gradient = this.context.createLinearGradient(
        padding,
        height / 2,
        width + padding,
        height / 2,
      );

      // can just evenly space out the gradients in this case, as multiple lines makes no difference
      // to an even left to right gradient
      const totalIterations = fill.length + 1;
      let currentIteration = 1;

      for (let i = 0; i < fill.length; i++) {
        let stop: number;

        if (typeof fillGradientStops[i] === "number") {
          stop = fillGradientStops[i];
        } else {
          stop = currentIteration / totalIterations;
        }
        gradient.addColorStop(stop, fill[i]);
        currentIteration++;
      }
    }

    return gradient;
  }

  private drawLetterSpacing(
    text: string,
    x: number,
    y: number,
    isStroke = false,
  ): void {
    const style = this._style;

    // letterSpacing of 0 means normal
    const letterSpacing = style.letterSpacing;

    if (letterSpacing === 0) {
      if (isStroke) {
        this.context.strokeText(text, x, y);
      } else {
        this.context.fillText(text, x, y);
      }

      return;
    }

    let currentPosition = x;

    // Using Array.from correctly splits characters whilst keeping emoji together.
    // This is not supported on IE as it requires ES6, so regular text splitting occurs.
    // This also doesn't account for emoji that are multiple emoji put together to make something else.
    // Handling all of this would require a big library itself.
    // https://medium.com/@giltayar/iterating-over-emoji-characters-the-es6-way-f06e4589516
    // https://github.com/orling/grapheme-splitter
    const stringArray = Array.from ? Array.from(text) : text.split("");
    let previousWidth = this.context.measureText(text).width;
    let currentWidth = 0;

    for (let i = 0; i < stringArray.length; ++i) {
      const currentChar = stringArray[i];

      if (isStroke) {
        this.context.strokeText(currentChar, currentPosition, y);
      } else {
        this.context.fillText(currentChar, currentPosition, y);
      }
      currentWidth = this.context.measureText(text.substring(i + 1)).width;
      currentPosition += previousWidth - currentWidth + letterSpacing;
      previousWidth = currentWidth;
    }
  }

  private updateTexture(): void {
    const canvas = this.canvas;

    const texture = this._texture;
    const style = this._style;
    const padding = style.padding;
    const baseTexture = texture.baseTexture;

    texture.orig.width = texture._frame.width - padding * 2;
    texture.orig.height = texture._frame.height - padding * 2;

    if (this._width) {
      this.scale.x =
        (sign(this.scale.x) * this._width) / this._texture.orig.width;
    }

    if (this._height) {
      this.scale.y =
        (sign(this.scale.y) * this._height) / this._texture.orig.height;
    }

    baseTexture.setRealSize(canvas.width, canvas.height, this._resolution);

    texture.onBaseTextureUpdated(baseTexture);
  }

  get height(): number {
    this.updateText();

    return Math.abs(this.scale.y) * this._texture.orig.height;
  }

  set height(value: number) {
    this.updateText();

    const s = sign(this.scale.y) || 1;

    this.scale.y = (s * value) / this._texture.orig.height;
    this._height = value;
  }

  get resolution(): number {
    return this._resolution;
  }

  set resolution(value: number) {
    this._autoResolution = false;

    if (this._resolution === value) {
      return;
    }

    this._resolution = value;
  }

  get style(): TextStyle {
    return this._style;
  }

  set style(style: Partial<TextStyle>) {
    this._style = new TextStyle(style);
  }

  get text(): string {
    return this._text;
  }

  set text(text: string) {
    text = String(text === null || text === undefined ? "" : text);

    if (this._text === text) {
      return;
    }

    this._text = text;
  }

  get width(): number {
    this.updateText();

    return Math.abs(this.scale.x) * this._texture.orig.width;
  }

  set width(value: number) {
    this.updateText();

    const s = sign(this.scale.x) || 1;

    this.scale.x = (s * value) / this._texture.orig.width;
    this._width = value;
  }
}
