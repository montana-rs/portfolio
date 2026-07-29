import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

export const prerender = true;

const width = 1200;
const height = 630;
const background = '#282420';
const foreground = '#e5c6a8';
const cream = '#f6f6ec';
const orange = '#ff9168';
const muted = '#665e54';

type SatoriNode = { type: string; props: { style?: Record<string, string | number>; children?: SatoriNode | SatoriNode[] | string } };

const node = (style: Record<string, string | number>, children?: SatoriNode | SatoriNode[] | string): SatoriNode => ({
  type: 'div',
  props: { style, children },
});

const fontPath = (name: string) => resolve(process.cwd(), 'src/assets/og-fonts', name);

export const GET: APIRoute = async () => {
  const [departureMono, jetBrainsMono] = await Promise.all([
    readFile(fontPath('DepartureMono-Regular.otf')),
    readFile(fontPath('JetBrainsMono-Regular.ttf')),
  ]);

  const markup = node({
    width,
    height,
    display: 'flex',
    position: 'relative',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '100px',
    background,
    color: foreground,
    fontFamily: 'Departure Mono',
  }, [
    node({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      color: orange,
      fontFamily: 'JetBrains Mono',
      fontSize: 22,
      letterSpacing: 3,
    }, [
      node({}, '[ PORTFOLIO / 00 ]'),
      node({ width: 54, height: 8, background: orange }),
    ]),
    node({ display: 'flex', flexDirection: 'column', gap: 22 }, [
      node({ fontSize: 112, lineHeight: 1, letterSpacing: -3, color: cream }, 'Montana Stake'),
      node({ fontFamily: 'JetBrains Mono', fontSize: 27, letterSpacing: 2, color: foreground }, 'WEB SYSTEMS / NETWORKS / EXPERIMENTS'),
    ]),
    node({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      paddingTop: 22,
      borderTop: `1px solid ${muted}`,
      color: orange,
      fontFamily: 'JetBrains Mono',
      fontSize: 20,
      letterSpacing: 2,
    }, [
      node({}, 'MONTANARS.COM'),
      node({}, 'CLIENT WORK / TECHNICAL STUDIES'),
    ]),
  ]);

  const svg = await satori(markup as never, {
    width,
    height,
    fonts: [
      { name: 'Departure Mono', data: departureMono, weight: 400, style: 'normal' },
      { name: 'JetBrains Mono', data: jetBrainsMono, weight: 400, style: 'normal' },
    ],
  });
  const png = new Resvg(svg, { fitTo: { mode: 'original' } }).render().asPng();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
