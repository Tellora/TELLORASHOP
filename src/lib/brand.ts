/** Split "TelloraShop" into ["Tellora", "Shop"] so the second half can be coloured. Falls back to the whole name. */
export function brandParts(name: string): [string, string] {
  const m = name.match(/^(.+?)([A-Z][a-z]+)$/);
  return m ? [m[1], m[2]] : [name, ''];
}
