/**
 * Generate a URL-safe slug from a string
 * Properly converts German umlauts to their ASCII equivalents
 */
export function slugify(text: string): string {
  return text
    .normalize('NFC') // Normalize Unicode (decomposed → composed: u + ¨ → ü)
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
