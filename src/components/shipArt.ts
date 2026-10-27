import type { Orientation } from '../game/types'

// Side-view warship drawings for your fleet. Each is drawn bow-right, 100 units per cell.
const HULL = '#2b3a50'
const DECK = '#3e4f68'
const SUPER = '#5a6d88'
const LIGHT = '#8fa3bd'
const RED = '#e04f5f'
const SALMON = '#f39182'

/** Standard hull with red waterline, bow raked to the right. */
function hull(w: number, top = 50) {
  return `
    <path d="M10 70 L${w - 18} 70 L${w - 30} 86 L18 86 Z" fill="${RED}"/>
    <path d="M6 ${top} L${w - 3} ${top - 3} L${w - 18} 70 L10 70 Z" fill="${HULL}"/>
    <path d="M10 66 L${w - 15} 66 L${w - 18} 70 L10 70 Z" fill="${SALMON}"/>
    <path d="M6 ${top} L${w - 3} ${top - 3} L${w - 6} ${top + 2} L6 ${top + 5} Z" fill="${LIGHT}" opacity=".35"/>`
}

const turret = (x: number, y: number, dir: 1 | -1) =>
  `<rect x="${x}" y="${y}" width="30" height="10" rx="3" fill="${SUPER}"/>
   <rect x="${dir === 1 ? x + 28 : x - 24}" y="${y + 3}" width="26" height="3" fill="${SUPER}"/>`

const mast = (x: number, top: number, base: number) =>
  `<rect x="${x - 2}" y="${top}" width="4" height="${base - top}" fill="${LIGHT}"/>
   <rect x="${x - 12}" y="${top + 8}" width="24" height="3" fill="${LIGHT}"/>
   <rect x="${x - 8}" y="${top + 16}" width="16" height="3" fill="${LIGHT}"/>`

const plane = (x: number) =>
  `<path d="M${x} 40 l18 0 l6 -3 l2 3 l-2 3 l-6 -3 Z M${x + 6} 40 l6 -6 l3 0 l-2 6 Z" fill="${LIGHT}"/>`

const DRAWINGS: Record<string, (w: number) => string> = {
  // Aircraft carrier: long flight deck, island tower, parked jets.
  carrier: (w) => `
    <path d="M20 72 L${w - 40} 72 L${w - 52} 86 L30 86 Z" fill="${RED}"/>
    <path d="M18 50 L${w - 28} 50 L${w - 40} 72 L20 72 Z" fill="${HULL}"/>
    <path d="M20 68 L${w - 38} 68 L${w - 40} 72 L20 72 Z" fill="${SALMON}"/>
    <path d="M4 42 L${w - 6} 42 L${w - 24} 50 L14 50 Z" fill="${DECK}"/>
    <path d="M4 42 L${w - 6} 42" stroke="${LIGHT}" stroke-width="2"/>
    <path d="M40 46 L${w - 60} 46" stroke="${LIGHT}" stroke-width="1.5" stroke-dasharray="14 10" opacity=".7"/>
    <rect x="300" y="18" width="46" height="24" rx="2" fill="${SUPER}"/>
    <rect x="306" y="24" width="34" height="4" fill="${LIGHT}" opacity=".7"/>
    ${mast(323, 8, 18)}
    ${plane(60)}${plane(110)}${plane(160)}${plane(220)}${plane(370)}${plane(420)}`,
  // Battleship: stepped superstructure, lattice mast, fore and aft turrets.
  battleship: (w) => `
    ${hull(w)}
    ${turret(50, 38, -1)}${turret(w - 110, 38, 1)}
    <rect x="130" y="34" width="140" height="16" fill="${SUPER}"/>
    <rect x="158" y="22" width="84" height="13" fill="${SUPER}"/>
    <rect x="166" y="26" width="68" height="3" fill="${LIGHT}" opacity=".7"/>
    ${mast(200, 8, 22)}
    <rect x="248" y="18" width="10" height="16" fill="${DECK}"/>`,
  // Cruiser: compact bridge, radar mast and a bow gun.
  cruiser: (w) => `
    ${hull(w)}
    <rect x="80" y="34" width="120" height="16" fill="${SUPER}"/>
    <rect x="110" y="22" width="60" height="13" fill="${SUPER}"/>
    <rect x="116" y="26" width="48" height="3" fill="${LIGHT}" opacity=".7"/>
    ${mast(140, 8, 22)}
    ${turret(214, 39, 1)}
    <rect x="40" y="42" width="24" height="8" rx="2" fill="${SUPER}"/>`,
  // Submarine: rounded body, conning tower, tail rudder.
  submarine: (w) => `
    <path d="M6 40 L22 40 L30 66 L6 66 Z" fill="${HULL}"/>
    <rect x="16" y="44" width="${w - 22}" height="32" rx="16" fill="#3a6680"/>
    <rect x="16" y="62" width="${w - 22}" height="14" rx="7" fill="${HULL}"/>
    <path d="M24 58 L${w - 20} 58" stroke="${SALMON}" stroke-width="3" stroke-linecap="round"/>
    <rect x="110" y="24" width="54" height="24" rx="5" fill="#3a6680"/>
    <rect x="110" y="24" width="54" height="5" rx="2" fill="${SALMON}"/>
    <rect x="132" y="10" width="4" height="16" fill="${LIGHT}"/>
    <rect x="144" y="14" width="3" height="12" fill="${LIGHT}"/>`,
  // Destroyer: low stealth profile with an angled deckhouse.
  destroyer: (w) => `
    ${hull(w, 52)}
    <path d="M44 51 L60 30 L116 30 L130 50 Z" fill="${SUPER}"/>
    <path d="M62 36 L114 36" stroke="${LIGHT}" stroke-width="3" opacity=".7"/>
    <rect x="84" y="16" width="4" height="16" fill="${LIGHT}"/>
    ${turret(140, 40, 1)}`,
}

const cache = new Map<string, string>()

/** Data URL of a full ship drawing; vertical ships are rotated so the bow points down. */
export function shipArt(id: string, length: number, orientation: Orientation): string {
  const key = `${id}:${length}:${orientation}`
  const hit = cache.get(key)
  if (hit) return hit
  const w = length * 100
  const draw = DRAWINGS[id] ?? ((width: number) => hull(width))
  // Stretch vertically so the ship fills more of the cell.
  const body = `<g transform="matrix(1 0 0 1.18 0 -8)">${draw(w)}</g>`
  const svg =
    orientation === 'horizontal'
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 100" preserveAspectRatio="none">${body}</svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 ${w}" preserveAspectRatio="none"><g transform="translate(100 0) rotate(90)">${body}</g></svg>`
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  cache.set(key, url)
  return url
}
