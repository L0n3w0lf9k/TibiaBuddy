import { useRef, useState, type FormEvent } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { useApp } from '../context';
import { spells, type SpellRecord } from '../data/game';
import { effectiveSpell, spellOverrideKey } from '../domain/spellCatalog';
import { Badge, Field, Modal, Notice, gp, number } from '../shared';
import type { SpellOverride, Vocation } from '../types';
import SpellSprite from './SpellSprite';
import './spell-editor.css';

type KnownVocation = Exclude<Vocation, 'unselected'>;
type NumericField = 'mana' | 'runeCharges' | 'soulCost' | 'price';
const vocationOptions: { id: KnownVocation; name: string }[] = [
  { id: 'knight', name: 'Knight' }, { id: 'paladin', name: 'Paladin' },
  { id: 'sorcerer', name: 'Sorcerer' }, { id: 'druid', name: 'Druid' },
];
const fields: { id: NumericField; label: string; minimum: number; hint: string }[] = [
  { id: 'mana', label: 'Mana per cast', minimum: 0, hint: 'Creation mana for runes; casting mana for instant spells.' },
  { id: 'runeCharges', label: 'Charges per created rune', minimum: 1, hint: 'Charges on one finished rune, not runes per backpack.' },
  { id: 'soulCost', label: 'Soul points per cast', minimum: 0, hint: 'Use 0 when the spell consumes no soul points.' },
  { id: 'price', label: 'Learning price (gp)', minimum: 0, hint: 'The NPC price to learn the spell, not a rune selling price.' },
];
const inputValue = (value: number | null) => value === null ? '' : String(value);
const sameVocations = (a: Vocation[] | null, b: Vocation[] | null) => a === null || b === null ? a === b : [...a].sort().join(',') === [...b].sort().join(',');

/** Edits only this server's changed fields; unrelated and concurrent fields survive. */
export default function SpellEditor({ spell, onClose }: { spell: SpellRecord; onClose: () => void }) {
  const { state, server, update, notify } = useApp();
  const base = spells.find(s => s.id === spell.id) || spell;
  const [scope] = useState({ id: server.id, name: server.name });
  const [initial] = useState(() => effectiveSpell(state, scope.id, base));
  const [values, setValues] = useState<Record<NumericField, string>>(() => ({ mana: inputValue(initial.mana), runeCharges: inputValue(initial.runeCharges), soulCost: inputValue(initial.soulCost), price: inputValue(initial.price) }));
  const [availability, setAvailability] = useState<'known' | 'unknown'>(initial.vocations === null ? 'unknown' : 'known');
  const [selectedVocations, setSelectedVocations] = useState<KnownVocation[]>(() => (initial.vocations || []).filter((v): v is KnownVocation => v !== 'unselected'));
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const key = spellOverrideKey(scope.id, base.id);
  const hasOverrides = Boolean(state.spellOverrides?.[key] && Object.keys(state.spellOverrides[key]).length);
  const visibleFields = fields.filter(field => field.id !== 'runeCharges' || base.type === 'rune');
  const referenceValue = (field: NumericField) => {
    const value = base[field];
    return value === null ? 'Unknown / variable' : field === 'price' ? gp(value) : number(value);
  };
  const dismiss = () => { if (!busyRef.current) onClose(); };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (busyRef.current) return;
    setError('');
    const patch: SpellOverride = {};
    try {
      for (const field of visibleFields) {
        const raw = values[field.id].trim();
        const value = raw === '' ? null : Number(raw);
        if (value !== null && (!(field.id === 'price' ? Number.isFinite(value) : Number.isSafeInteger(value)) || value < field.minimum)) throw new Error(`${field.label} must be ${field.id === 'price' ? 'a number of 0 or more' : 'a whole number ' + (field.minimum === 0 ? 'of 0 or more' : 'of 1 or more')}. Leave it blank when unknown.`);
        if (value !== initial[field.id]) patch[field.id] = value;
      }
      const vocationValue = availability === 'unknown' ? null : selectedVocations;
      if (!sameVocations(vocationValue, initial.vocations)) patch.vocations = vocationValue;
      if (!Object.keys(patch).length) { onClose(); return; }
      busyRef.current = true; setBusy(true);
      await update(draft => {
        if (!draft.servers.some(s => s.id === scope.id)) throw new Error('This server profile no longer exists. Close the editor and select a server.');
        draft.spellOverrides ||= {};
        draft.spellOverrides[key] = { ...draft.spellOverrides[key], ...patch };
      });
      notify(`${base.name} settings saved for ${scope.name}.`); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save the spell settings. Please try again.'); }
    finally { busyRef.current = false; setBusy(false); }
  };

  const reset = async () => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      await update(draft => { if (draft.spellOverrides) delete draft.spellOverrides[key]; });
      notify(`${base.name} restored to the reference defaults for ${scope.name}.`); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not restore the defaults. Please try again.'); }
    finally { busyRef.current = false; setBusy(false); }
  };

  return <Modal title={`Edit ${base.name}`} onClose={dismiss} wide><form className="spell-editor" onSubmit={save} aria-busy={busy}>
    <div className="spell-editor-intro"><SpellSprite spell={base} size={44} /><div><strong>{base.words}</strong><p>Spell settings for <b>{scope.name}</b>. These values are shared by this server’s spellbook, Edron guide and rune planning.</p></div><Badge tone="gold">Server settings</Badge></div>
    {error && <Notice tone="warning">{error}</Notice>}
    <div className="form-grid">{visibleFields.map(field => <Field key={field.id} label={field.label} hint={field.hint}><input inputMode={field.id === 'price' ? 'decimal' : 'numeric'} type="number" min={field.minimum} step={field.id === 'price' ? 'any' : 1} disabled={busy} placeholder="Unknown / not established" value={values[field.id]} onChange={event => setValues(current => ({ ...current, [field.id]: event.target.value }))} /></Field>)}</div>
    <p className="spell-editor-help">A blank value means unknown. Zero is a known value and is saved as zero.</p>
    <fieldset className="spell-vocation-fieldset" disabled={busy}><legend>Vocations that can learn / create this spell</legend><Field label="Availability"><select value={availability} onChange={event => setAvailability(event.target.value as 'known' | 'unknown')}><option value="known">Known for this server</option><option value="unknown">Unknown / needs confirmation</option></select></Field>{availability === 'known' && <><div className="spell-vocation-options">{vocationOptions.map(v => <label key={v.id}><input type="checkbox" checked={selectedVocations.includes(v.id)} onChange={event => setSelectedVocations(current => event.target.checked ? [...current, v.id] : current.filter(value => value !== v.id))} /><span>{v.name}</span></label>)}</div><p className="spell-editor-help">{selectedVocations.length ? 'These vocation settings apply to learning or creating the spell. Finished rune use has separate requirements.' : 'No vocations selected: this spell is unavailable for learning or creation on this server.'}</p></>}</fieldset>
    <details className="spell-reference-defaults"><summary>Reference defaults</summary><dl>{visibleFields.map(field => <div key={field.id}><dt>{field.label}</dt><dd>{referenceValue(field.id)}</dd></div>)}<div><dt>Vocations</dt><dd>{base.vocations === null ? 'Unknown / needs confirmation' : base.vocations.length ? base.vocations.map(v => vocationOptions.find(option => option.id === v)?.name || v).join(', ') : 'None'}</dd></div></dl></details>
    <div className="modal-actions spell-editor-actions">{hasOverrides && <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void reset()}><RotateCcw size={15} />Restore reference defaults</button>}<button type="button" className="btn btn-secondary" disabled={busy} onClick={dismiss}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}><Save size={15} />{busy ? 'Saving…' : 'Save server settings'}</button></div>
  </form></Modal>;
}
