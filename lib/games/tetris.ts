export type Point = [number, number];
export const TETRIS_SHAPES: Point[][] = [
  [[0, 0], [1, 0], [0, 1], [1, 1]],
  [[0, 0], [-1, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [1, 1], [-1, 0]],
  [[0, 0], [0, 1], [-1, 1], [1, 0]],
  [[0, 0], [-1, 0], [1, 0], [0, 1]],
];

export function rotate(shape: Point[]): Point[] {
  return shape.map(([x, y]) => [-y, x]);
}

export function randomTetrisShape() {
  return TETRIS_SHAPES[Math.floor(Math.random() * TETRIS_SHAPES.length)];
}
