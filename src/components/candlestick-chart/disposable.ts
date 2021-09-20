/**
 * Represents a type which can release resources, such
 * as event listening or a timer.
 */
export interface Disposable {
  /**
   * Dispose this object.
   */
  dispose(): void;
}
