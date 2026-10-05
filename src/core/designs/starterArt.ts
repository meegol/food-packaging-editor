export interface SvgAsset {
  src: string;
  width: number;
  height: number;
}

export type FoodArtId =
  | 'burger'
  | 'pizza'
  | 'fries'
  | 'sandwich'
  | 'croissant'
  | 'cake'
  | 'ramen'
  | 'coffee-beans'
  | 'cookies'
  | 'coffee-cup'
  | 'bread';

export type BackgroundStyle = 'kraft' | 'street' | 'fresh' | 'noir';
export type BadgeStyle = 'kraft' | 'street' | 'fresh' | 'noir';

function svgAsset(width: number, height: number, body: string, origin = 0): SvgAsset {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${origin} ${origin} ${w} ${h}">${body}</svg>`;
  return { src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, width: w, height: h };
}

function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const SHADOW = '<ellipse cx="200" cy="350" rx="150" ry="16" fill="#000" opacity="0.14"/>';

const FOOD_ART: Record<FoodArtId, (accent: string) => string> = {
  burger: () => `${SHADOW}
    <rect x="62" y="262" width="276" height="62" rx="28" fill="#d88a3c"/>
    <rect x="62" y="262" width="276" height="20" fill="#c7772c" opacity="0.6"/>
    <rect x="48" y="218" width="304" height="52" rx="24" fill="#5b2f1b"/>
    <path d="M70 232 h260" stroke="#7a4128" stroke-width="5" stroke-linecap="round" stroke-dasharray="14 18"/>
    <path d="M52 214 H348 L336 236 L312 224 L292 252 L270 226 L238 244 L214 224 L186 250 L160 226 L130 246 L108 224 L80 240 Z" fill="#ffc531"/>
    <path d="M44 204 q22 -22 44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 v12 H44 Z" fill="#5fb548"/>
    <rect x="72" y="182" width="256" height="20" rx="10" fill="#e8452c"/>
    <path d="M58 188 Q58 70 200 66 Q342 70 342 188 Z" fill="#eaa04d"/>
    <path d="M92 150 Q110 92 190 84" stroke="#f6c784" stroke-width="12" stroke-linecap="round" fill="none" opacity="0.8"/>
    <g fill="#fff3d6">
      <ellipse cx="150" cy="118" rx="7" ry="4" transform="rotate(-20 150 118)"/>
      <ellipse cx="200" cy="104" rx="7" ry="4"/>
      <ellipse cx="248" cy="120" rx="7" ry="4" transform="rotate(20 248 120)"/>
      <ellipse cx="176" cy="146" rx="7" ry="4" transform="rotate(10 176 146)"/>
      <ellipse cx="228" cy="150" rx="7" ry="4" transform="rotate(-12 228 150)"/>
      <ellipse cx="280" cy="152" rx="7" ry="4" transform="rotate(25 280 152)"/>
      <ellipse cx="122" cy="156" rx="7" ry="4" transform="rotate(-30 122 156)"/>
    </g>`,

  pizza: () => `${SHADOW}
    <circle cx="200" cy="196" r="164" fill="#d9974a"/>
    <circle cx="200" cy="196" r="146" fill="#c8402b"/>
    <path d="M200 62 c40 4 70 20 96 50 c22 26 30 50 34 84 c-4 40 -24 72 -52 96 c-30 24 -56 32 -82 34 c-40 -2 -72 -20 -96 -48 c-24 -28 -34 -56 -34 -88 c4 -36 18 -64 44 -88 c26 -24 56 -38 90 -40 Z" fill="#f6c654"/>
    <g fill="#b8322a">
      <circle cx="150" cy="136" r="24"/><circle cx="252" cy="128" r="22"/><circle cx="276" cy="220" r="24"/>
      <circle cx="196" cy="206" r="22"/><circle cx="130" cy="246" r="24"/><circle cx="222" cy="292" r="22"/>
    </g>
    <g fill="#8f2620" opacity="0.5">
      <circle cx="144" cy="130" r="5"/><circle cx="258" cy="134" r="5"/><circle cx="282" cy="214" r="5"/>
      <circle cx="190" cy="212" r="5"/><circle cx="136" cy="240" r="5"/><circle cx="216" cy="286" r="5"/>
    </g>
    <g fill="#3f8f3a">
      <path d="M206 150 q14 -18 30 -4 q-14 16 -30 4 Z"/><path d="M166 288 q12 -20 30 -8 q-12 18 -30 8 Z"/>
      <path d="M262 266 q18 -10 28 6 q-18 10 -28 -6 Z"/><path d="M104 182 q10 -18 26 -6 q-12 16 -26 6 Z"/>
    </g>
    <g stroke="#e9b86a" stroke-width="4" opacity="0.9">
      <line x1="200" y1="32" x2="200" y2="360"/><line x1="58" y1="114" x2="342" y2="278"/><line x1="58" y1="278" x2="342" y2="114"/>
    </g>`,

  fries: (accent) => `${SHADOW}
    <g stroke="#d99a1e" stroke-width="3">
      <rect x="112" y="70" width="26" height="170" rx="6" fill="#f7c948" transform="rotate(-14 125 155)"/>
      <rect x="146" y="46" width="26" height="190" rx="6" fill="#ffd45c" transform="rotate(-6 159 141)"/>
      <rect x="180" y="34" width="26" height="200" rx="6" fill="#f7c948"/>
      <rect x="214" y="44" width="26" height="190" rx="6" fill="#ffd45c" transform="rotate(6 227 139)"/>
      <rect x="248" y="64" width="26" height="176" rx="6" fill="#f7c948" transform="rotate(13 261 152)"/>
      <rect x="160" y="84" width="24" height="150" rx="6" fill="#f2b632" transform="rotate(-2 172 159)"/>
      <rect x="230" y="92" width="24" height="140" rx="6" fill="#f2b632" transform="rotate(9 242 162)"/>
    </g>
    <path d="M92 168 H308 L284 346 H116 Z" fill="${accent}"/>
    <path d="M92 168 Q200 222 308 168 L304 196 Q200 246 96 196 Z" fill="#000" opacity="0.12"/>
    <path d="M140 246 h120" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity="0.85"/>
    <path d="M150 276 h100" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0.6"/>`,

  sandwich: () => `${SHADOW}
    <path d="M44 330 L200 70 L356 330 Z" fill="#d6a15a"/>
    <path d="M66 318 L200 96 L334 318 Z" fill="#f7e2b5"/>
    <path d="M110 246 L290 246 L306 272 L94 272 Z" fill="#5fb548"/>
    <path d="M100 262 q20 -14 40 0 t40 0 t40 0 t40 0 t40 0 l6 12 H94 Z" fill="#6cc552"/>
    <path d="M128 216 H272 L290 246 H110 Z" fill="#f2a7a0"/>
    <path d="M146 186 H254 L272 216 H128 Z" fill="#ffd04a"/>
    <path d="M94 272 H306 L318 292 H82 Z" fill="#e8452c"/>
    <circle cx="170" cy="150" r="5" fill="#e8c99a"/><circle cx="214" cy="136" r="5" fill="#e8c99a"/><circle cx="236" cy="168" r="5" fill="#e8c99a"/>`,

  croissant: () => `${SHADOW}
    <g stroke="#9c5a1f" stroke-width="4">
      <path d="M60 268 Q50 220 96 206 Q120 244 112 290 Q86 296 60 268 Z" fill="#d98a35"/>
      <path d="M340 268 Q350 220 304 206 Q280 244 288 290 Q314 296 340 268 Z" fill="#d98a35"/>
      <path d="M94 204 Q110 150 160 152 Q176 214 160 286 Q120 300 108 290 Q120 244 94 204 Z" fill="#e7a24a"/>
      <path d="M306 204 Q290 150 240 152 Q224 214 240 286 Q280 300 292 290 Q280 244 306 204 Z" fill="#e7a24a"/>
      <path d="M158 152 Q200 120 242 152 Q256 220 240 288 Q200 306 160 288 Q144 220 158 152 Z" fill="#f0b45c"/>
    </g>
    <path d="M176 170 Q200 156 224 170" stroke="#fbd79a" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M118 180 Q132 172 146 178" stroke="#fbd79a" stroke-width="6" stroke-linecap="round" fill="none"/>`,

  cake: () => `${SHADOW}
    <path d="M70 300 L330 300 L330 200 L70 140 Z" fill="#f6d39b"/>
    <path d="M70 300 L330 300 L330 200 L70 140 Z" fill="none" stroke="#e7b874" stroke-width="3"/>
    <path d="M70 184 L330 244 L330 262 L70 202 Z" fill="#fff7ec"/>
    <path d="M70 236 L330 276 L330 290 L70 252 Z" fill="#fff7ec"/>
    <path d="M70 184 L330 244 L330 252 L70 192 Z" fill="#e8455a" opacity="0.7"/>
    <path d="M60 140 Q66 118 90 122 L340 182 Q352 196 340 206 L70 146 Z" fill="#fffaf2"/>
    <path d="M330 200 L350 196 L350 296 L330 300 Z" fill="#e7b874"/>
    <g>
      <path d="M150 120 q-26 -32 6 -48 q34 6 22 44 q-12 14 -28 4 Z" fill="#e23b4e"/>
      <path d="M156 72 l-10 -14 m10 14 l12 -14 m-12 14 v-16" stroke="#3f8f3a" stroke-width="5" stroke-linecap="round"/>
      <g fill="#ffd9a6"><circle cx="152" cy="96" r="2.5"/><circle cx="166" cy="104" r="2.5"/><circle cx="160" cy="84" r="2.5"/></g>
      <path d="M232 150 q-22 -26 4 -40 q28 4 18 36 q-10 12 -22 4 Z" fill="#e23b4e"/>
      <path d="M236 110 l-8 -12 m8 12 l10 -12" stroke="#3f8f3a" stroke-width="4" stroke-linecap="round"/>
    </g>`,

  ramen: (accent) => `${SHADOW}
    <ellipse cx="200" cy="176" rx="160" ry="44" fill="#f4e3c4"/>
    <g stroke="#f1cb68" stroke-width="7" fill="none" stroke-linecap="round">
      <path d="M70 176 q20 -26 40 0 t40 0 t40 0 t40 0 t40 0 t40 0"/>
      <path d="M80 190 q20 -22 40 0 t40 0 t40 0 t40 0 t40 0 t40 0"/>
      <path d="M96 164 q18 -20 36 0 t36 0 t36 0 t36 0 t36 0"/>
    </g>
    <ellipse cx="268" cy="160" rx="34" ry="22" fill="#fff"/><ellipse cx="268" cy="160" rx="16" ry="11" fill="#f6a623"/>
    <path d="M118 150 q24 -12 48 0 q-24 16 -48 0 Z" fill="#e88a8a"/><circle cx="142" cy="150" r="6" fill="#fff" opacity="0.7"/>
    <g fill="#5fb548"><circle cx="196" cy="150" r="6"/><circle cx="212" cy="160" r="5"/><circle cx="184" cy="166" r="5"/><circle cx="226" cy="146" r="4"/></g>
    <path d="M40 176 H360 Q352 312 200 330 Q48 312 40 176 Z" fill="${accent}"/>
    <path d="M70 214 H330" stroke="#fff" stroke-width="6" opacity="0.5" stroke-dasharray="18 12"/>
    <rect x="236" y="40" width="10" height="170" rx="5" fill="#8a5a33" transform="rotate(28 241 125)"/>
    <rect x="262" y="40" width="10" height="170" rx="5" fill="#a26c40" transform="rotate(34 267 125)"/>`,

  'coffee-beans': () => {
    const beans: Array<[number, number, number]> = [
      [140, 160, -30], [210, 130, 20], [270, 180, -10], [180, 220, 40], [250, 250, -40],
      [120, 250, 15], [200, 290, -20], [300, 300, 30], [100, 320, -50],
    ];
    return `${SHADOW}` + beans.map(([x, y, r]) =>
      `<g transform="rotate(${r} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="38" ry="27" fill="#6b3a1e"/>
       <ellipse cx="${x - 8}" cy="${y - 8}" rx="18" ry="8" fill="#8d5330" opacity="0.7"/>
       <path d="M${x - 30} ${y} q15 -10 30 0 t30 0" stroke="#2f170a" stroke-width="5" fill="none" stroke-linecap="round"/></g>`
    ).join('');
  },

  cookies: () => {
    const chips = (cx: number, cy: number) => {
      const rnd = seeded(cx * 31 + cy);
      let out = '';
      for (let i = 0; i < 9; i++) {
        const a = rnd() * Math.PI * 2;
        const d = rnd() * 52;
        out += `<circle cx="${(cx + Math.cos(a) * d).toFixed(1)}" cy="${(cy + Math.sin(a) * d * 0.55).toFixed(1)}" r="${(5 + rnd() * 4).toFixed(1)}" fill="#4a2a17"/>`;
      }
      return out;
    };
    const cookie = (cy: number) => `<ellipse cx="200" cy="${cy + 10}" rx="118" ry="30" fill="#b7752f"/>
      <ellipse cx="200" cy="${cy}" rx="118" ry="34" fill="#d9a05b"/>${chips(200, cy)}`;
    return `${SHADOW}${cookie(306)}${cookie(250)}${cookie(194)}
      <g transform="rotate(-12 220 120)"><ellipse cx="220" cy="128" rx="96" ry="84" fill="#b7752f"/>
      <ellipse cx="220" cy="120" rx="96" ry="84" fill="#dca461"/>${chips(220, 120)}</g>`;
  },

  'coffee-cup': (accent) => `${SHADOW}
    <ellipse cx="200" cy="320" rx="150" ry="26" fill="#f2efe8"/>
    <path d="M96 150 H304 L286 318 Q200 340 114 318 Z" fill="${accent}"/>
    <path d="M300 180 q58 0 54 52 q-4 46 -66 50" stroke="${accent}" stroke-width="18" fill="none"/>
    <ellipse cx="200" cy="150" rx="104" ry="24" fill="#6b3a1e"/>
    <ellipse cx="200" cy="150" rx="104" ry="24" fill="none" stroke="#fff" stroke-width="6" opacity="0.6"/>
    <path d="M182 156 q18 -14 36 0 q-18 12 -36 0 Z" fill="#d9a873"/>
    <g stroke="#9aa3ad" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.7">
      <path d="M160 116 q-16 -24 0 -46 q16 -22 0 -44"/><path d="M200 112 q-16 -24 0 -46 q16 -22 0 -44"/><path d="M240 116 q-16 -24 0 -46 q16 -22 0 -44"/>
    </g>`,

  bread: () => `${SHADOW}
    <path d="M60 330 V196 Q60 96 200 92 Q340 96 340 196 V330 Z" fill="#c9803a"/>
    <path d="M82 330 V204 Q82 120 200 116 Q318 120 318 204 V330 Z" fill="#f6dfb1"/>
    <g fill="#e9c98d" opacity="0.8">
      <circle cx="140" cy="200" r="5"/><circle cx="220" cy="170" r="4"/><circle cx="260" cy="240" r="5"/>
      <circle cx="170" cy="270" r="4"/><circle cx="120" cy="290" r="3"/><circle cx="280" cy="300" r="4"/><circle cx="200" cy="220" r="3"/>
    </g>
    <path d="M110 140 Q200 108 290 140" stroke="#e7a75a" stroke-width="6" fill="none" opacity="0.7"/>`,
};

export function foodArt(id: FoodArtId, accent: string): SvgAsset {
  return svgAsset(344, 344, FOOD_ART[id](accent), 28);
}

export function panelBackground(style: BackgroundStyle, width: number, height: number, seed: number, decorated: boolean): SvgAsset {
  const w = Math.round(width);
  const h = Math.round(height);
  const rnd = seeded(seed + w * 7 + h * 13);
  let body = '';

  if (style === 'kraft') {
    body = `<rect width="${w}" height="${h}" fill="#c9a27a"/>`;
    const count = Math.min(Math.round((w * h) / 180), 900);
    for (let i = 0; i < count; i++) {
      const dark = rnd() > 0.45;
      body += `<circle cx="${(rnd() * w).toFixed(1)}" cy="${(rnd() * h).toFixed(1)}" r="${(0.5 + rnd() * 1.4).toFixed(1)}" fill="${dark ? '#8a6544' : '#e6c9a5'}" opacity="${(0.35 + rnd() * 0.4).toFixed(2)}"/>`;
    }
  } else if (style === 'street') {
    body = `<rect width="${w}" height="${h}" fill="#e63b2e"/>`;
    const step = 46;
    let k = 0;
    for (let y = 18; y < h + step; y += step) {
      for (let x = (k % 2) * (step / 2) + 14; x < w + step; x += step) {
        const kind = Math.floor(rnd() * 4);
        const rot = Math.round(rnd() * 360);
        const g = `transform="translate(${x} ${y}) rotate(${rot})"`;
        if (kind === 0) body += `<path ${g} d="M0 -9 L2.6 -2.8 L9 -2.8 L3.8 1.2 L5.6 8 L0 4 L-5.6 8 L-3.8 1.2 L-9 -2.8 L-2.6 -2.8 Z" fill="#ffc93c" opacity="0.55"/>`;
        else if (kind === 1) body += `<circle ${g} r="6" fill="none" stroke="#ffffff" stroke-width="2.4" opacity="0.35"/>`;
        else if (kind === 2) body += `<path ${g} d="M-9 0 l4.5 -5 l4.5 5 l4.5 -5 l4.5 5" fill="none" stroke="#ffc93c" stroke-width="2.4" stroke-linecap="round" opacity="0.5"/>`;
        else body += `<circle ${g} r="2.6" fill="#ffffff" opacity="0.4"/>`;
      }
      k++;
    }
  } else if (style === 'fresh') {
    body = `<rect width="${w}" height="${h}" fill="#f6f8f1"/>`;
    const step = 64;
    for (let y = 26; y < h; y += step) {
      for (let x = ((y / step) % 2) * 32 + 22; x < w; x += step) {
        const rot = Math.round(rnd() * 360);
        body += `<path transform="translate(${x} ${y}) rotate(${rot})" d="M0 -10 Q8 -2 0 10 Q-8 -2 0 -10 Z M0 -8 V8" fill="#cfe5c4" stroke="#b6d6a7" stroke-width="1" opacity="0.8"/>`;
      }
    }
    if (decorated) {
      const band = Math.max(6, Math.min(h * 0.06, 22));
      body += `<rect y="${h - band}" width="${w}" height="${band}" fill="#3f8f4f"/>`;
      body += `<rect y="${h - band * 1.6}" width="${w}" height="${band * 0.3}" fill="#9ccc65"/>`;
    }
  } else {
    body = `<rect width="${w}" height="${h}" fill="#17171c"/>`;
    for (let x = -h; x < w; x += 14) {
      body += `<line x1="${x}" y1="${h}" x2="${x + h}" y2="0" stroke="#ffffff" stroke-width="0.6" opacity="0.04"/>`;
    }
    const inset = Math.max(4, Math.min(w, h) * 0.05);
    if (decorated) {
      body += `<rect x="${inset}" y="${inset}" width="${w - inset * 2}" height="${h - inset * 2}" fill="none" stroke="#d4a24c" stroke-width="1.6"/>`;
      body += `<rect x="${inset * 1.5}" y="${inset * 1.5}" width="${w - inset * 3}" height="${h - inset * 3}" fill="none" stroke="#d4a24c" stroke-width="0.6" opacity="0.7"/>`;
    }
  }

  return svgAsset(w, h, body);
}

export function brandBadge(style: BadgeStyle): SvgAsset {
  const bodies: Record<BadgeStyle, string> = {
    kraft: `<circle cx="120" cy="120" r="114" fill="#f6ecdc"/>
      <circle cx="120" cy="120" r="102" fill="none" stroke="#7a4e2d" stroke-width="3"/>
      <circle cx="120" cy="120" r="96" fill="none" stroke="#7a4e2d" stroke-width="1" stroke-dasharray="3 4"/>
      <path d="M86 52 l34 -18 l34 18" stroke="#b45309" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M70 188 h100" stroke="#b45309" stroke-width="3" stroke-linecap="round"/>`,
    street: (() => {
      let pts = '';
      for (let i = 0; i < 32; i++) {
        const r = i % 2 === 0 ? 118 : 98;
        const a = (i / 32) * Math.PI * 2;
        pts += `${(120 + Math.cos(a) * r).toFixed(1)},${(120 + Math.sin(a) * r).toFixed(1)} `;
      }
      return `<polygon points="${pts.trim()}" fill="#ffc93c"/><circle cx="120" cy="120" r="88" fill="none" stroke="#1d1d1f" stroke-width="5"/>`;
    })(),
    fresh: `<circle cx="120" cy="120" r="112" fill="#ffffff"/>
      <circle cx="120" cy="120" r="104" fill="none" stroke="#3f8f4f" stroke-width="5"/>
      <path d="M120 22 Q146 44 120 66 Q94 44 120 22 Z" fill="#7cb342"/>
      <path d="M120 66 V40" stroke="#3f8f4f" stroke-width="3"/>`,
    noir: `<circle cx="120" cy="120" r="114" fill="#17171c"/>
      <circle cx="120" cy="120" r="108" fill="none" stroke="#d4a24c" stroke-width="3"/>
      <circle cx="120" cy="120" r="98" fill="none" stroke="#d4a24c" stroke-width="1"/>
      <path d="M100 40 l20 -14 l20 14" stroke="#d4a24c" stroke-width="3" fill="none"/>
      <circle cx="120" cy="200" r="4" fill="#d4a24c"/>`,
  };
  return svgAsset(240, 240, bodies[style]);
}
