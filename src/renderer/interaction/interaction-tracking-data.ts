export interface InteractionTrackingFlags {
  OVER: number;
  LEFT_DOWN: number;
  RIGHT_DOWN: number;
  NONE: number;
}

export class InteractionTrackingData {
  public static FLAGS: Readonly<InteractionTrackingFlags> = Object.freeze({
    NONE: 0,
    OVER: 1 << 0,
    LEFT_DOWN: 1 << 1,
    RIGHT_DOWN: 1 << 2,
  });

  private readonly _pointerId: number;
  private _flags: number;

  constructor(pointerId: number) {
    this._pointerId = pointerId;
    this._flags = InteractionTrackingData.FLAGS.NONE;
  }

  private _doSet(flag: number, yn: boolean): void {
    if (yn) {
      this._flags = this._flags | flag;
    } else {
      this._flags = this._flags & ~flag;
    }
  }

  get pointerId(): number {
    return this._pointerId;
  }

  get flags(): number {
    return this._flags;
  }

  set flags(flags: number) {
    this._flags = flags;
  }

  get none(): boolean {
    return this._flags === InteractionTrackingData.FLAGS.NONE;
  }

  get over(): boolean {
    return (this._flags & InteractionTrackingData.FLAGS.OVER) !== 0;
  }

  set over(yn: boolean) {
    this._doSet(InteractionTrackingData.FLAGS.OVER, yn);
  }

  get rightDown(): boolean {
    return (this._flags & InteractionTrackingData.FLAGS.RIGHT_DOWN) !== 0;
  }

  set rightDown(yn: boolean) {
    this._doSet(InteractionTrackingData.FLAGS.RIGHT_DOWN, yn);
  }

  /**
   * Did the left mouse button come down in the DisplayObject?
   *
   * @private
   * @member {boolean}
   */
  get leftDown(): boolean {
    return (this._flags & InteractionTrackingData.FLAGS.LEFT_DOWN) !== 0;
  }

  set leftDown(yn: boolean) {
    this._doSet(InteractionTrackingData.FLAGS.LEFT_DOWN, yn);
  }
}
