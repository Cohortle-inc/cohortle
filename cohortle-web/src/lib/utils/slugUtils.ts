/** Convert a title to a URL-safe slug */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Build the canonical URL segment: "42-mandela-washington-fellowship" */
export function toIdSlug(id: number, title: string): string {
  return `${id}-${toSlug(title)}`;
}

/** Extract the numeric ID from an idSlug like "42-mandela-washington-fellowship" */
export function parseIdFromSlug(idSlug: string): number | null {
  const match = idSlug.match(/^(\d+)/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return isNaN(n) ? null : n;
}
