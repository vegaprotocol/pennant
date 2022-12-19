export function calculateShiftedPositions(positions: number[], height: number) {
  let previousY = -Infinity;
  const sortedYPositions = [...positions].sort((a, b) => a - b);

  const shiftedYPositions = sortedYPositions.reduce<number[]>((p, y) => {
    const ypx = y;
    let ny = ypx;

    if (ypx - previousY < height) {
      ny = previousY + height;
    }

    p.push(ny);

    previousY = ny || ypx;

    return p;
  }, []);

  return shiftedYPositions;
}
