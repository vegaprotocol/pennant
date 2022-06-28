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

export function string2hex(string: string): number {
  if (typeof string === "string") {
    if (string[0] === "#") {
      string = string.substr(1);
    }
  }

  if (string.length === 3) {
    string = string
      .split("")
      .map(function (hex) {
        return hex + hex;
      })
      .join("");
  }

  return parseInt(string, 16);
}

export function rgb2hex(rgb: number[] | Float32Array): number {
  return ((rgb[0] * 255) << 16) + ((rgb[1] * 255) << 8) + ((rgb[2] * 255) | 0);
}
