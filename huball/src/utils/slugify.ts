export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function themePrefix(themeName: string): string {
  const slug = slugify(themeName);
  const parts = slug.split('-');
  if (parts.length === 1) return parts[0].slice(0, 6);
  return parts
    .slice(0, 3)
    .map((p) => p.slice(0, 4))
    .join('-');
}

export function domainFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return 'website';
  }
}

export function themeNameFromUrl(url: string): string {
  const domain = domainFromUrl(url);
  return slugify(domain.replace(/\.[^.]+$/, ''));
}
