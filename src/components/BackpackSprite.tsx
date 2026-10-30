import { useState } from 'react';
import { Backpack } from 'lucide-react';
import { backpackSprite } from '../data/backpackSprites';
import './reference-art.css';

export default function BackpackSprite({ color, size = 48 }: { color: string; size?: number }) {
  const source = backpackSprite(color);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return source && source !== failedSource
    ? <img className="tibia-backpack-sprite" src={source} alt="" aria-hidden="true" width={size} height={size} style={{ width: size, height: size }} loading="lazy" decoding="async" onError={() => setFailedSource(source)} />
    : <span className="tibia-spell-fallback" aria-hidden="true" style={{ width: size, height: size }}><Backpack size={Math.round(size * .65)} /></span>;
}
