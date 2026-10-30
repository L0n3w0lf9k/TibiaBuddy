import { useState } from 'react';
import { Package } from 'lucide-react';
import { itemSprite } from '../data/itemSprites';

/** Decorative item image; the adjacent text supplies the accessible name. */
export default function ItemSprite({ itemId, name, size = 32 }: { itemId?: string; name?: string; size?: number }) {
  const source = itemSprite(itemId || '') || itemSprite(name || '');
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return source && source !== failedSource
    ? <img className="tibia-item-sprite" src={source} alt="" aria-hidden="true" width={size} height={size} loading="lazy" decoding="async" style={{ width: size, height: size }} onError={() => setFailedSource(source)} />
    : <span className="tibia-item-sprite item-sprite-fallback" aria-hidden="true" style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Package size={Math.round(size * .58)} /></span>;
}
