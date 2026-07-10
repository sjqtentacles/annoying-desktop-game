// Procedural tray icon — a 16x16 gremlin face, pure code instead of a binary
// asset. Black + alpha only so macOS can use it as a template image.
// No electron imports: unit-testable.

export const ART = [
  '.##..........##.',
  '.#.#........#.#.',
  '.#..#......#..#.',
  '.#...######...#.',
  '.#.##########.#.',
  '..############..',
  '.##############.',
  '.###..####..###.',
  '.##....##....##.',
  '.###..####..###.',
  '.##############.',
  '..#..##..##..#..',
  '..#####..#####..',
  '...##########...',
  '....###..###....',
  '................',
]

function bitmapFrom(grid) {
  const size = grid.length
  const buffer = new Uint8Array(size * size * 4) // BGRA
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x] === '#') buffer[(y * size + x) * 4 + 3] = 255 // black, opaque
    }
  }
  return { width: size, height: size, buffer }
}

export function buildIconBitmaps() {
  const doubled = ART.map((row) =>
    Array.from(row, (c) => c + c).join('')
  ).flatMap((row) => [row, row])
  return [bitmapFrom(ART), bitmapFrom(doubled)]
}
