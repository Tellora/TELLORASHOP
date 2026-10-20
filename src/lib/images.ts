/** Accepts an array, a JSON-encoded array (possibly double-encoded) or newline/comma separated text and returns clean URLs. */
export function normalizeImages(value: unknown): string[] {
  let v: unknown = value;
  for (let i = 0; i < 3 && typeof v === 'string'; i++) {
    const t = v.trim();
    if (t.startsWith('[') || t.startsWith('"')) {
      try { v = JSON.parse(t); continue; } catch { /* fall through to text parsing */ }
    }
    break;
  }
  const list = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[\n,]+/) : [];
  return list
    .map(x => String(x ?? '').trim())
    .filter(x => /^(https?:\/\/|\/)/i.test(x))
    .slice(0, 10);
}
