/**
 * Deterministic placeholder artwork colours, derived from a product slug so a
 * product keeps the same stand-in image everywhere it appears.
 *
 * Deliberately dependency-free: this is imported by client components, so it
 * must not reach anything that touches the database.
 */
const swatches = [
  ["#e9d9c6", "#cbb094"],
  ["#dce1d4", "#b3c0a6"],
  ["#f0dcd2", "#d9ab93"],
  ["#dfe2e8", "#b4bcc9"],
  ["#eee2cf", "#d3bd93"],
  ["#e6d7dd", "#c2a2b0"],
] as const;

export function swatchFor(slug: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return swatches[hash % swatches.length];
}
