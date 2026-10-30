import { useMemo, useRef, useState, type FormEvent } from 'react';
import { BookOpen, Bookmark, ExternalLink, FileText, Library, Pencil, Play, Plus, Save, Star, Trash2, Undo2, X } from 'lucide-react';
import { useApp } from '../context';
import { curatedGuides, type CuratedGuide } from '../data/guides';
import { cleanGuideDraft, editGuide, guideKinds, guideMatches, guideSource, guideVocations, normalizeGuideUrl, type GuideDraft, type GuideVocation } from '../domain/guides';
import { Badge, EmptyState, Field, Modal, Notice, PageHeader, SearchBox, Tabs, dateLabel, uid } from '../shared';
import type { GuideKind, GuideLink } from '../types';
import './guides.css';

type GuideCard = GuideDraft & { id: string; origin: 'curated' | 'personal'; details?: CuratedGuide; personal?: GuideLink };
const blankGuide: GuideDraft = { title: '', url: '', description: '', kind: 'article', vocations: [], versionLabel: '' };
const kindIcon = { article: FileText, video: Play, reference: Library };
const safeUrl = (value: string) => { try { return normalizeGuideUrl(value); } catch { return undefined; } };

function GuideEditor({ guide, onClose, onSaved }: { guide?: GuideLink; onClose: () => void; onSaved: () => void }) {
  const { update, notify } = useApp();
  const [initial] = useState(guide);
  const [values, setValues] = useState<GuideDraft>(() => initial ? { title: initial.title, url: initial.url, description: initial.description, kind: initial.kind, vocations: [...initial.vocations], versionLabel: initial.versionLabel } : { ...blankGuide, vocations: [] });
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const dismiss = () => { if (!busyRef.current) onClose(); };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (busyRef.current) return;
    setError('');
    try {
      const clean = cleanGuideDraft(values), now = new Date().toISOString(), id = initial?.id || uid();
      busyRef.current = true; setBusy(true);
      await update(draft => {
        const links = draft.guideLinks || [];
        if (initial) draft.guideLinks = editGuide(links, initial, clean, now);
        else {
          if (links.some(link => link.id === id)) throw new Error('This link could not be assigned an ID. Close the editor and try again.');
          draft.guideLinks = [...links, { ...clean, id, createdAt: now, updatedAt: now }];
        }
      });
      notify(initial ? 'Guide link updated.' : 'Guide added to your links.'); onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save this link. Please try again.'); }
    finally { busyRef.current = false; setBusy(false); }
  };
  return <Modal title={initial ? 'Edit your guide link' : 'Add a guide link'} onClose={dismiss} wide>
    <form className="guides-editor" onSubmit={save} aria-busy={busy}>
      <p>Keep a useful guide, hunt video or reference here. Your links are shared by your characters on this device and included in your backups.</p>
      {error && <Notice tone="warning">{error}</Notice>}
      <Field label="Title"><input autoFocus required maxLength={160} disabled={busy} value={values.title} placeholder="e.g. Paladin route: levels 20–40" onChange={event => setValues(v => ({ ...v, title: event.target.value }))} /></Field>
      <Field label="Web address" hint="Use a complete https:// or http:// link. YouTube watch links work too."><input required type="url" maxLength={2048} disabled={busy} value={values.url} placeholder="https://…" onChange={event => setValues(v => ({ ...v, url: event.target.value }))} /></Field>
      <div className="form-grid"><Field label="Format"><select disabled={busy} value={values.kind} onChange={event => setValues(v => ({ ...v, kind: event.target.value as GuideKind }))}>{guideKinds.map(kind => <option key={kind.id} value={kind.id}>{kind.label}</option>)}</select></Field><Field label="Version / server (optional)" hint="Keep the guide’s own context visible."><input disabled={busy} maxLength={100} value={values.versionLabel} placeholder="e.g. 7.7 · my server" onChange={event => setValues(v => ({ ...v, versionLabel: event.target.value }))} /></Field></div>
      <fieldset className="guides-vocation-fieldset" disabled={busy}><legend>Useful for</legend><div>{guideVocations.map(vocation => <label key={vocation.id}><input type="checkbox" checked={values.vocations.includes(vocation.id)} onChange={event => setValues(v => ({ ...v, vocations: event.target.checked ? [...v.vocations, vocation.id] : v.vocations.filter(value => value !== vocation.id) }))} /><span>{vocation.label}</span></label>)}</div><small>Leave all unchecked for every vocation.</small></fieldset>
      <Field label="Notes (optional)" hint="Why it is useful, a level range, a video timestamp, or differences on your server."><textarea rows={4} maxLength={1000} disabled={busy} value={values.description} onChange={event => setValues(v => ({ ...v, description: event.target.value }))} /></Field>
      <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={dismiss} disabled={busy}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}><Save size={15} />{busy ? 'Saving…' : initial ? 'Save changes' : 'Add guide link'}</button></div>
    </form>
  </Modal>;
}

export default function Guides() {
  const { state, character, update, notify } = useApp();
  const [tab, setTab] = useState('all'), [query, setQuery] = useState('');
  const [vocation, setVocation] = useState<GuideVocation | 'all'>('all'), [kind, setKind] = useState<GuideKind | 'all'>('all');
  const [editor, setEditor] = useState<{ guide?: GuideLink } | null>(null);
  const [removed, setRemoved] = useState<{ guide: GuideLink; index: number; favourite: boolean } | null>(null);
  const [mutationBusy, setMutationBusy] = useState(false);
  const mutationRef = useRef(false);
  const links = state.guideLinks || [];
  const allGuides = useMemo<GuideCard[]>(() => [
    ...curatedGuides.map(guide => ({ ...guide, origin: 'curated' as const, details: guide })),
    ...links.map(guide => ({ ...guide, origin: 'personal' as const, personal: guide })),
  ], [state.guideLinks]);
  const favouriteCount = allGuides.filter(guide => state.favourites.includes(`guide:${guide.id}`)).length;
  const visible = allGuides.filter(guide => (tab !== 'personal' || guide.origin === 'personal') && (tab !== 'favourites' || state.favourites.includes(`guide:${guide.id}`)) && guideMatches({ ...guide, tags: guide.details?.tags, sourceLabel: guide.details?.sourceLabel }, { query, kind, vocation }));
  const toggleFavourite = async (guide: GuideCard) => {
    const key = `guide:${guide.id}`;
    try { await update(draft => { draft.favourites = draft.favourites.includes(key) ? draft.favourites.filter(value => value !== key) : [...draft.favourites, key]; }); }
    catch { notify('Could not update favourites. Please try again.', 'error'); }
  };
  const remove = async (guide: GuideLink) => {
    if (mutationRef.current) return;
    mutationRef.current = true; setMutationBusy(true);
    let undo: typeof removed = null;
    try {
      await update(draft => {
        const current = draft.guideLinks || [], index = current.findIndex(link => link.id === guide.id);
        if (index < 0) throw new Error('This link has already been removed.');
        const key = `guide:${guide.id}`;
        undo = { guide: current[index], index, favourite: draft.favourites.includes(key) };
        draft.guideLinks = current.filter(link => link.id !== guide.id);
        draft.favourites = draft.favourites.filter(value => value !== key);
      });
      setRemoved(undo);
    } catch (cause) { notify(cause instanceof Error ? cause.message : 'Could not remove this link.', 'error'); }
    finally { mutationRef.current = false; setMutationBusy(false); }
  };
  const undoRemove = async () => {
    if (!removed || mutationRef.current) return;
    mutationRef.current = true; setMutationBusy(true);
    const restore = removed;
    try {
      await update(draft => {
        const current = draft.guideLinks || [];
        if (current.some(link => link.id === restore.guide.id)) throw new Error('This link is already present.');
        draft.guideLinks = [...current.slice(0, restore.index), restore.guide, ...current.slice(restore.index)];
        const key = `guide:${restore.guide.id}`;
        if (restore.favourite && !draft.favourites.includes(key)) draft.favourites.push(key);
      });
      setRemoved(null); notify('Guide link restored.');
    } catch (cause) { notify(cause instanceof Error ? cause.message : 'Could not restore this link.', 'error'); }
    finally { mutationRef.current = false; setMutationBusy(false); }
  };
  const clearFilters = () => { setQuery(''); setVocation('all'); setKind('all'); };
  const hasFilters = Boolean(query || vocation !== 'all' || kind !== 'all');

  return <div className="guides-page">
    <PageHeader eyebrow="THE FIELD LIBRARY" title="A good guide goes a long way." description="Hunting routes, quests, vocation advice and classic references, with their version in view." actions={<button type="button" className="btn btn-primary" onClick={() => setEditor({})}><Plus size={16} />Add your own link</button>} />
    <section className="guides-intro"><div className="guides-intro-icon"><BookOpen size={25} /></div><div><h2>Learn the old world. Keep what helps.</h2><p>Explore original-era guides, quest playthroughs and practical hunting advice. Version labels and source notes keep each resource in context.</p></div><div className="guides-intro-count"><strong>{curatedGuides.length}</strong><span>selected resources</span></div></section>
    <Tabs value={tab} onChange={setTab} tabs={[{ id: 'all', label: 'All guides', count: allGuides.length }, { id: 'personal', label: 'My links', count: links.length }, { id: 'favourites', label: 'Favourites', count: favouriteCount }]} />
    <div className="guides-toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search guides, hunts, versions…" /><label className="guides-select-label"><span>Vocation</span><select aria-label="Filter guides by vocation" value={vocation} onChange={event => setVocation(event.target.value as GuideVocation | 'all')}><option value="all">Every vocation</option>{guideVocations.map(value => <option key={value.id} value={value.id}>{value.label}</option>)}</select></label><label className="guides-select-label"><span>Format</span><select aria-label="Filter guides by format" value={kind} onChange={event => setKind(event.target.value as GuideKind | 'all')}><option value="all">Every format</option>{guideKinds.map(value => <option key={value.id} value={value.id}>{value.label}</option>)}</select></label></div>
    <div className="guides-results-line"><span>{visible.length} {visible.length === 1 ? 'resource' : 'resources'}{vocation !== 'all' ? ` for ${guideVocations.find(value => value.id === vocation)?.label.toLowerCase()}s, including general guides` : ''}</span><div>{character.vocation !== 'unselected' && vocation !== character.vocation && <button type="button" className="guides-text-button" onClick={() => setVocation(character.vocation as GuideVocation)}>For my vocation</button>}{hasFilters && <button type="button" className="guides-text-button" onClick={clearFilters}><X size={12} />Clear filters</button>}</div></div>
    {removed && <div className="guides-undo" role="status"><span><b>{removed.guide.title}</b> removed from your links.</span><button type="button" className="btn btn-secondary" disabled={mutationBusy} onClick={() => void undoRemove()}><Undo2 size={14} />Undo</button><button type="button" className="icon-btn" aria-label="Dismiss undo" disabled={mutationBusy} onClick={() => setRemoved(null)}><X size={15} /></button></div>}
    {visible.length ? <div className="guides-grid">{visible.map(guide => {
      const Icon = kindIcon[guide.kind], favourite = state.favourites.includes(`guide:${guide.id}`), href = safeUrl(guide.url);
      return <article className={`guides-card guides-card-${guide.kind}`} key={`${guide.origin}:${guide.id}`}>
        <div className="guides-card-top"><span className={`guides-kind-icon ${guide.kind}`}><Icon size={18} /></span><div><span className="guides-kind-label">{guideKinds.find(value => value.id === guide.kind)?.label}</span><span className="guides-source">{guide.details?.sourceLabel || guideSource(guide.url)}</span></div><button type="button" className={`icon-btn guides-star ${favourite ? 'selected' : ''}`} aria-label={`${favourite ? 'Remove' : 'Add'} ${guide.title} ${favourite ? 'from' : 'to'} favourites`} aria-pressed={favourite} onClick={() => void toggleFavourite(guide)}><Star size={18} fill={favourite ? 'currentColor' : 'none'} /></button></div>
        <h2>{href ? <a href={href} target="_blank" rel="noopener noreferrer">{guide.title}</a> : guide.title}</h2>
        <div className="guides-labels"><span className={`guides-version ${guide.details?.versionLabel.startsWith('7.4') ? 'earlier' : ''}`}>{guide.versionLabel || 'Version not specified'}</span>{guide.origin === 'personal' && <Badge tone="green">Personal</Badge>}{guide.details?.language && <span className="guides-language">{guide.details.language}</span>}</div>
        {guide.description && <p className="guides-description">{guide.description}</p>}
        {guide.details?.context && <p className="guides-context">{guide.details.context}</p>}
        <div className="guides-vocations">{guide.vocations.length ? guide.vocations.map(value => <span key={value}>{guideVocations.find(option => option.id === value)?.label}</span>) : <span>General · all vocations</span>}</div>
        <footer><div className="guides-card-footnote">{guide.details ? <><span>Link checked {dateLabel(guide.details.checkedAt)}</span>{guide.details.provenanceUrl && <a href={guide.details.provenanceUrl} target="_blank" rel="noopener noreferrer">Source details <ExternalLink size={10} /></a>}</> : <span>Saved on this device</span>}</div><div className="guides-card-actions">{guide.personal && <><button type="button" className="icon-btn" aria-label={`Edit ${guide.title}`} onClick={() => setEditor({ guide: guide.personal })}><Pencil size={15} /></button><button type="button" className="icon-btn" aria-label={`Remove ${guide.title}`} disabled={mutationBusy} onClick={() => void remove(guide.personal!)}><Trash2 size={15} /></button></>}{href ? <a className="guides-open" href={href} target="_blank" rel="noopener noreferrer">{guide.kind === 'video' ? 'Watch' : guide.kind === 'reference' ? 'Open' : 'Read'} <ExternalLink size={13} /></a> : <span className="guides-invalid">Edit invalid link</span>}</div></footer>
      </article>;
    })}</div> : <div className="panel guides-empty"><EmptyState icon={tab === 'favourites' ? <Star size={25} /> : <Bookmark size={25} />} title={hasFilters ? 'No guides match these filters.' : tab === 'personal' ? 'Your field library starts here.' : 'Keep your favourites close.'} description={hasFilters ? 'Try another vocation, format or search term.' : tab === 'personal' ? 'Add a hunt walkthrough, a trusted video or a useful server reference. Your links stay available to every character on this device.' : 'Use the star on any guide to keep it in this list.'} action={hasFilters ? <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear filters</button> : tab === 'personal' ? <button type="button" className="btn btn-primary" onClick={() => setEditor({})}><Plus size={15} />Add a guide link</button> : <button type="button" className="btn btn-secondary" onClick={() => setTab('all')}>Browse all guides</button>} /></div>}
    <div className="guides-source-note"><BookOpen size={16} /><p>Version labels preserve each source’s context. A checked link confirms its public title and destination; it does not certify every tactic or server rule. Curated videos open on YouTube. Personal links are stored locally and are included in your backup.</p></div>
    {editor && <GuideEditor key={editor.guide?.id || 'new-guide'} guide={editor.guide} onClose={() => setEditor(null)} onSaved={() => { if (!editor.guide) { setTab('personal'); clearFilters(); } setEditor(null); }} />}
  </div>;
}
