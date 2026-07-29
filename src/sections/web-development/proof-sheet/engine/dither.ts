export const USER_NORMALIZE = [2, 98] as const;

export function imageLayer(source: HTMLCanvasElement, width: number, height: number): HTMLCanvasElement {
  const layer = document.createElement('canvas');
  layer.width = width; layer.height = height;
  const context = layer.getContext('2d');
  if (!context) throw new Error('IMAGE LAYER CONTEXT UNAVAILABLE');
  context.drawImage(source, 0, 0, width, height);
  return layer;
}

export function dither(source: HTMLCanvasElement, seed: number): HTMLCanvasElement {
  const context = source.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('DITHER CONTEXT UNAVAILABLE');
  const pixels = context.getImageData(0, 0, source.width, source.height);
  const matrix = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const levels = 4;
  for (let y = 0; y < source.height; y += 3) for (let x = 0; x < source.width; x += 3) {
    const index = (y * source.width + x) * 4;
    const threshold = matrix[y % 4][x % 4] / 16 + (hash(`${seed}:${x}:${y}`) % 12 - 6) / 255;
    const colors = [0, 1, 2].map((channel) => quantize(pixels.data[index + channel], levels, threshold));
    for (let yy = y; yy < Math.min(y + 3, source.height); yy++) for (let xx = x; xx < Math.min(x + 3, source.width); xx++) {
      const pixel = (yy * source.width + xx) * 4;
      pixels.data[pixel] = colors[0]; pixels.data[pixel + 1] = colors[1]; pixels.data[pixel + 2] = colors[2]; pixels.data[pixel + 3] = 255;
    }
  }
  context.putImageData(pixels, 0, 0);
  return source;
}

function quantize(value: number, levels: number, threshold: number): number {
  const scaled = (value / 255) * (levels - 1);
  const lower = Math.floor(scaled);
  const upper = Math.min(levels - 1, lower + 1);
  const level = scaled - lower > threshold ? upper : lower;
  return Math.round((level / (levels - 1)) * 255);
}

function hash(input: string): number {
  let value = 2166136261;
  for (let index = 0; index < input.length; index++) value = Math.imul(value ^ input.charCodeAt(index), 16777619);
  return value >>> 0;
}
