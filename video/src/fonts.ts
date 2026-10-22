import { cancelRender, continueRender, delayRender } from 'remotion';

// Satoshi loads from Fontshare's CDN at render time, the same way the app does: its licence (ITF FFL)
// forbids committing the font file. Inter and JetBrains Mono come from Google Fonts (SIL OFL).
const SHEETS = [
  'https://api.fontshare.com/v2/css?f[]=satoshi@1&display=swap',
  'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@500;700&display=swap',
];
const FACES = ['900 80px Satoshi', '800 80px Satoshi', '700 80px Satoshi', '400 40px Inter', '500 40px Inter', '650 40px Inter', '700 40px Inter', '500 40px "JetBrains Mono"', '700 40px "JetBrains Mono"'];

const handle = delayRender('Loading Satoshi, Inter and JetBrains Mono');
Promise.all(
  SHEETS.map((href) => new Promise<void>((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Could not load ${href}`));
    document.head.appendChild(link);
  })),
)
  .then(() => Promise.all(FACES.map((f) => document.fonts.load(f))))
  .then(() => {
    if (!document.fonts.check('900 80px Satoshi')) throw new Error('Satoshi did not load');
    continueRender(handle);
  })
  .catch((err) => cancelRender(err));
