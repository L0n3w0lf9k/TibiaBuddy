import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { spells, type SpellRecord } from '../data/game';
import { instantSpellIcon, spellIconInfo } from '../data/spellIcons';
import { itemSprite } from '../data/itemSprites';
import ItemSprite from './ItemSprite';
import './reference-art.css';

export interface SpellSpriteProps {
  spell?: SpellRecord;
  name?: string;
  words?: string;
  spellId?: string;
  size?: number;
}

/** Modern instant-spell art is decorative; the supplied record controls classic rules. */
export default function SpellSprite({ spell, name, words, spellId, size = 32 }: SpellSpriteProps) {
  const record = spell || spells.find(s => spellId ? s.id === spellId : words ? s.words.toLowerCase() === words.trim().toLowerCase() : s.name.toLowerCase() === name?.trim().toLowerCase());
  const source = record?.type === 'instant' ? instantSpellIcon(record.id) : undefined;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (record?.type === 'rune' || !record && name && itemSprite(name)) return <ItemSprite name={record?.name || name} size={size} />;
  const metadata = record ? spellIconInfo[record.id] : undefined;
  const title = metadata ? `${metadata.artworkKind === 'archived-spell-illustration' ? 'Archived' : 'Modern'} ${metadata.artworkName} artwork · visual only${metadata.renamed ? ' · classic spell rules retained' : ''}` : undefined;
  return source && source !== failedSource
    ? <img className="tibia-spell-icon" src={source} width={size} height={size} alt="" aria-hidden="true" title={title} loading="lazy" decoding="async" onError={() => setFailedSource(source)} style={{ width: size, height: size }} />
    : <span className="tibia-spell-fallback" aria-hidden="true" style={{ width: size, height: size }}><Wand2 size={Math.round(size * .65)} /></span>;
}
