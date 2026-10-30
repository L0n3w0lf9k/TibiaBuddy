export const backpackChoices = [
  { color: 'Brown', id: 'brown', name: 'Backpack' },
  { color: 'Blue', id: 'blue', name: 'Blue Backpack' },
  { color: 'Purple', id: 'purple', name: 'Purple Backpack' },
  { color: 'Red', id: 'red', name: 'Red Backpack' },
  { color: 'Grey', id: 'grey', name: 'Grey Backpack' },
  { color: 'Orange', id: 'orange', name: 'Orange Backpack' },
  { color: 'Golden', id: 'golden', name: 'Golden Backpack' },
  { color: 'Green', id: 'green', name: 'Green Backpack' },
  { color: 'Yellow', id: 'yellow', name: 'Yellow Backpack' },
  { color: 'Camouflage', id: 'camouflage', name: 'Camouflage Backpack' },
  { color: 'Holding', id: 'holding', name: 'Backpack of Holding' },
] as const;

export function backpackSpriteId(color: string): string | undefined {
  const normalized = color.toLowerCase().trim().replace(/\\/g, '/').replace(/backpack/g, '').replace(/\s+/g, ' ').trim();
  if (['', 'normal', 'standard', 'brown', 'regular'].includes(normalized)) return 'brown';
  if (normalized === 'gray') return 'grey';
  if (normalized === 'gold') return 'golden';
  if (/^orange\s*[/&-]\s*brown$/.test(normalized)) return 'orange';
  if (normalized === 'of holding') return 'holding';
  return backpackChoices.find(b => b.id === normalized)?.id;
}

export function backpackSprite(color: string): string | undefined {
  const id = backpackSpriteId(color);
  return id ? (import.meta.env?.BASE_URL || '/') + 'assets/backpacks/' + id + '.gif' : undefined;
}
export const backpackSpriteManifest = (import.meta.env?.BASE_URL || '/') + 'assets/backpacks/manifest.json';
