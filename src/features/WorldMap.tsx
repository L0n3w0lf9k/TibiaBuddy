import { useEffect, useState, type FormEvent } from 'react';
import { Bookmark as BookmarkIcon, Check, Compass, Copy, Edit3, ExternalLink, MapPin, Plus, Trash2, X } from 'lucide-react';
import { useApp } from '../context';
import { Badge, Field, Modal, PageHeader, uid } from '../shared';
import { worldMapUrl } from '../data/game';
import type { Bookmark } from '../types';
import './reference.css';

interface Position { x: number; y: number; z: number; zoom: number }
interface PositionDraft { x: string; y: string; z: string; zoom: string }
const startPosition: Position = { x: 32368, y: 32288, z: 7, zoom: 7 };
const draftOf = (p: Position): PositionDraft => ({ x: String(p.x), y: String(p.y), z: String(p.z), zoom: String(p.zoom) });
function readPosition(value: unknown): Position {
  if (!value || typeof value !== 'object') return { ...startPosition };
  const p = value as Position;
  if ([p.x, p.y, p.z, p.zoom].every(Number.isInteger) && p.x >= 0 && p.x <= 65535 && p.y >= 0 && p.y <= 65535 && p.z >= 0 && p.z <= 15 && p.zoom >= 1 && p.zoom <= 8) return { x: p.x, y: p.y, z: p.z, zoom: p.zoom };
  return { ...startPosition };
}
function parsePosition(draft: PositionDraft): Position {
  if (Object.values(draft).some(v => v.trim() === '')) throw new Error('Enter X, Y, floor and zoom.');
  const p = { x: Number(draft.x), y: Number(draft.y), z: Number(draft.z), zoom: Number(draft.zoom) };
  if (![p.x, p.y, p.z, p.zoom].every(Number.isInteger)) throw new Error('Coordinates, floor and zoom must be whole numbers.');
  if (p.x < 0 || p.x > 65535 || p.y < 0 || p.y > 65535) throw new Error('X and Y must be between 0 and 65,535.');
  if (p.z < 0 || p.z > 15) throw new Error('The world floor must be between 0 and 15.');
  if (p.zoom < 1 || p.zoom > 8) throw new Error('Choose a zoom between 1 and 8.');
  return p;
}
const floorLabel = (z: number) => z === 7 ? 'Surface' : z < 7 ? `${7 - z} floor${7 - z === 1 ? '' : 's'} above surface` : `${z - 7} floor${z - 7 === 1 ? '' : 's'} underground`;

function CoordinateFields({ draft, onChange }: { draft: PositionDraft; onChange: (draft: PositionDraft) => void }) {
  return <div className="atlas-coordinate-fields"><Field label="X coordinate"><input inputMode="numeric" type="number" min="0" max="65535" step="1" value={draft.x} onChange={e => onChange({ ...draft, x: e.target.value })} required /></Field><Field label="Y coordinate"><input inputMode="numeric" type="number" min="0" max="65535" step="1" value={draft.y} onChange={e => onChange({ ...draft, y: e.target.value })} required /></Field><Field label="World floor (z)"><select value={draft.z} onChange={e => onChange({ ...draft, z: e.target.value })}>{Array.from({ length: 16 }, (_, z) => <option key={z} value={z}>{z}{z === 7 ? ' · Surface' : z < 7 ? ` · +${7 - z}` : ` · −${z - 7}`}</option>)}</select></Field><Field label="Zoom"><select value={draft.zoom} onChange={e => onChange({ ...draft, zoom: e.target.value })}>{Array.from({ length: 8 }, (_, i) => i + 1).map(z => <option key={z} value={z}>{z}{z === 7 ? ' · Default' : z === 8 ? ' · Close' : ''}</option>)}</select></Field></div>;
}

function BookmarkEditor({ existing, position, onClose }: { existing: Bookmark | null; position: Position; onClose: () => void }) {
  const { character, update, notify } = useApp();
  const [name, setName] = useState(existing?.name || ''), [notes, setNotes] = useState(existing?.notes || ''), [draft, setDraft] = useState(draftOf(existing || position)), [error, setError] = useState(''), [saving, setSaving] = useState(false);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) { setError('Give this location a name.'); return; }
    let point: Position;
    try { point = parsePosition(draft); } catch (e) { setError((e as Error).message); return; }
    setSaving(true); setError('');
    const bookmark: Bookmark = { id: existing?.id || uid(), characterId: character.id, name: name.trim(), notes: notes.trim(), ...point };
    try {
      await update(d => { const index = d.bookmarks.findIndex(b => b.id === bookmark.id && b.characterId === character.id); if (index >= 0) d.bookmarks[index] = bookmark; else d.bookmarks.push(bookmark); });
      notify(existing ? 'Bookmark updated' : 'Location bookmarked'); onClose();
    } catch { setError('The bookmark could not be saved. Please try again.'); }
    finally { setSaving(false); }
  };
  return <Modal title={existing ? 'Edit bookmark' : 'Save a location'} onClose={onClose}><form onSubmit={e => void save(e)} className="atlas-bookmark-dialog"><p className="muted">A useful spot for {character.name}. Coordinates and the selected floor are saved together.</p><Field label="Location name"><input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Edron dragon cave entrance" maxLength={80} required /></Field><div className="form-grid"><CoordinateFields draft={draft} onChange={setDraft} /></div><Field label="Notes" hint="A route, a reminder, or why this place matters."><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Bring a rope. The entrance is behind…" maxLength={1000} /></Field>{error && <p className="atlas-error" role="alert">{error}</p>}<div className="atlas-position-actions"><button type="button" className="btn" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}><Check size={16} />{saving ? 'Saving…' : 'Save bookmark'}</button></div></form></Modal>;
}

export default function WorldMap() {
  const { state, character, update, notify } = useApp();
  const saved = readPosition(state.preferences['mapPosition:' + character.id]);
  const [position, setPosition] = useState<Position>(saved), [draft, setDraft] = useState<PositionDraft>(draftOf(saved)), [error, setError] = useState(''), [embedded, setEmbedded] = useState(false), [saving, setSaving] = useState(false), [editor, setEditor] = useState<{ existing: Bookmark | null; position: Position } | null>(null), [deleting, setDeleting] = useState<Bookmark | null>(null);
  const bookmarks = state.bookmarks.filter(b => b.characterId === character.id);
  useEffect(() => { const p = readPosition(state.preferences['mapPosition:' + character.id]); setPosition(p); setDraft(draftOf(p)); setError(''); setEditor(null); setDeleting(null); }, [character.id]);
  const url = worldMapUrl(position.x, position.y, position.z, position.zoom);
  const jump = async (point: Position) => {
    setSaving(true); setError('');
    try { await update(d => { d.preferences['mapPosition:' + character.id] = point; }); setPosition(point); setDraft(draftOf(point)); }
    catch { setError('This location could not be saved. Please try again.'); }
    finally { setSaving(false); }
  };
  const submitPosition = (event: FormEvent) => { event.preventDefault(); try { void jump(parsePosition(draft)); } catch (e) { setError((e as Error).message); } };
  const bookmarkCurrent = () => { try { const p = parsePosition(draft); setEditor({ existing: null, position: p }); setError(''); } catch (e) { setError((e as Error).message); } };
  const copyLink = async () => { try { await navigator.clipboard.writeText(url); notify('Map link copied'); } catch { notify('Copy the address from the full map after opening it', 'info'); } };
  const removeBookmark = async () => { if (!deleting) return; setSaving(true); try { await update(d => { d.bookmarks = d.bookmarks.filter(b => !(b.id === deleting.id && b.characterId === character.id)); }); notify('Bookmark removed'); setDeleting(null); } catch { notify('Could not remove this bookmark. Please try again.', 'error'); } finally { setSaving(false); } };
  return <div className="atlas-page"><PageHeader eyebrow="THE FIELD GUIDE" title="Your world, within reach." description="Keep the places that matter, return to the right floor, and plan your next journey." actions={<button className="btn btn-primary" onClick={bookmarkCurrent}><Plus size={16} />Save location</button>} /><div className="atlas-layout"><div className="atlas-main"><section className="atlas-map-panel"><div className="atlas-map-toolbar"><Compass size={20} /><div><strong>Classic world map</strong><small>OpenTibia Info · 7.7 map reference</small></div><a className="btn atlas-open-link" href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} />Open full map</a>{embedded && <button className="icon-btn" onClick={() => setEmbedded(false)} aria-label="Hide embedded map"><X size={16} /></button>}</div>{embedded ? <iframe className="atlas-frame" title="OpenTibia Info interactive historical world map" src={url} key={url} loading="lazy" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups" /> : <div className="atlas-map-placeholder"><div className="atlas-compass"><Compass size={48} strokeWidth={1.1} /></div><h2>Somewhere worth exploring.</h2><p>Open the original interactive map at your chosen coordinates, or show its viewer here.</p><a className="btn btn-primary atlas-open-link" href={url} target="_blank" rel="noopener noreferrer"><MapPin size={16} />Explore this location <ExternalLink size={14} /></a><button className="atlas-secondary-action" onClick={() => setEmbedded(true)}>Show the map here</button></div>}<div className="atlas-map-footer"><span className="atlas-coordinates">X {position.x} · Y {position.y} · Z {position.z} · Zoom {position.zoom}</span><span>{floorLabel(position.z)}</span></div></section>{embedded && <p className="atlas-embed-hint">The viewer is hosted by OpenTibia Info. If it cannot be displayed here, use “Open full map”. Moving inside the external viewer does not change the coordinates you have saved below.</p>}
    <section className="panel atlas-position-panel"><h3>Go to coordinates</h3><p>Enter a location from a guide or save the coordinates of a favourite spot.</p><form onSubmit={submitPosition}><CoordinateFields draft={draft} onChange={setDraft} />{error && <p className="atlas-error" role="alert">{error}</p>}<div className="atlas-position-actions"><button type="button" className="btn" onClick={() => void copyLink()}><Copy size={14} />Copy current link</button><button type="button" className="btn" onClick={bookmarkCurrent}><BookmarkIcon size={14} />Bookmark</button><button type="submit" className="btn btn-primary" disabled={saving}><MapPin size={14} />{saving ? 'Updating…' : 'Go to location'}</button></div></form></section><p className="atlas-embed-hint">The interactive map requires an internet connection. Saved coordinates and bookmarks are kept in your browser.</p></div>
    <aside className="panel atlas-sidebar"><div className="atlas-bookmark-head"><h3>Saved locations</h3><Badge>{bookmarks.length}</Badge></div><p className="ref-caption">{character.name}'s personal atlas</p>{bookmarks.length ? <div className="atlas-bookmarks">{bookmarks.map(bookmark => { const active = bookmark.x === position.x && bookmark.y === position.y && bookmark.z === position.z; return <div key={bookmark.id} className={'atlas-bookmark ' + (active ? 'active' : '')}><button className="atlas-bookmark-location" onClick={() => void jump({ x: bookmark.x, y: bookmark.y, z: bookmark.z, zoom: bookmark.zoom })} disabled={saving} aria-label={'Go to ' + bookmark.name}><MapPin size={15} /><span><strong>{bookmark.name}</strong><small>{bookmark.x}, {bookmark.y}, {bookmark.z}<br />{floorLabel(bookmark.z)}</small></span></button>{bookmark.notes && <p className="atlas-bookmark-notes">{bookmark.notes}</p>}<div className="atlas-bookmark-actions"><a className="icon-btn" href={worldMapUrl(bookmark.x, bookmark.y, bookmark.z, bookmark.zoom)} target="_blank" rel="noopener noreferrer" aria-label={'Open ' + bookmark.name + ' in full map'}><ExternalLink size={13} /></a><button className="icon-btn" aria-label={'Edit ' + bookmark.name} onClick={() => setEditor({ existing: bookmark, position: bookmark })}><Edit3 size={13} /></button><button className="icon-btn" aria-label={'Delete ' + bookmark.name} onClick={() => setDeleting(bookmark)}><Trash2 size={13} /></button></div></div>; })}</div> : <div className="atlas-bookmark-empty"><BookmarkIcon size={30} strokeWidth={1.3} /><p>Caves, trainers, meeting places.<br />Keep them close for the next trip.</p><button className="btn" onClick={bookmarkCurrent}><Plus size={14} />Add first bookmark</button></div>}<div className="atlas-help"><strong>Every floor has a coordinate.</strong><p>World floor <b>z=7</b> is the surface. Smaller numbers move up; larger numbers move underground. A building's entrance can be on a different world floor.</p><p>The Edron spell guide links directly to each trainer's floor.</p><button className="btn ref-text-action" onClick={() => void jump({ x: 33268, y: 31849, z: 6, zoom: 7 })}><MapPin size={13} />Edron academy entrance</button></div></aside></div>
    {editor && <BookmarkEditor key={editor.existing?.id || 'new'} existing={editor.existing} position={editor.position} onClose={() => setEditor(null)} />}{deleting && <Modal title="Remove this bookmark?" onClose={() => setDeleting(null)}><p>Remove <strong>{deleting.name}</strong> from {character.name}'s saved locations?</p><div className="atlas-position-actions"><button className="btn" onClick={() => setDeleting(null)} disabled={saving}>Keep bookmark</button><button className="btn btn-primary" onClick={() => void removeBookmark()} disabled={saving}><Trash2 size={15} />{saving ? 'Removing…' : 'Remove bookmark'}</button></div></Modal>}
  </div>;
}
