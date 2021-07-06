export function hex2rgb(
  hex: number,
  out: Array<number> | Float32Array = []
): Array<number> | Float32Array {
  out[0] = ((hex >> 16) & 0xff) / 255;
  out[1] = ((hex >> 8) & 0xff) / 255;
  out[2] = (hex & 0xff) / 255;

  return out;
}

export function hex2string(hex: number): string {
  let hexString = hex.toString(16);

  hexString = "000000".substr(0, 6 - hexString.length) + hexString;

  return `#${hexString}`;
}
