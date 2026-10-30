import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Crosshair, Heart, RotateCcw, Shield, Sparkles, Swords } from 'lucide-react';
import { useApp } from '../context';
import { Badge, Evidence, External, Field, Notice, PageHeader, SearchBox, Stat, Tabs, gp, number } from '../shared';
import type { Character } from '../types';
import ItemSprite from '../components/ItemSprite';
import SpellSprite from '../components/SpellSprite';
import { COMBAT_SKILLS, characterSkill } from '../domain/characterSkills';
import { effectiveSpells, spellOverrideKey } from '../domain/spellCatalog';
import { combatSpellRange, meleeOverview, spellOverviewGroups, spellReference, spellRequirementCheck, WEAPON_REFERENCE, type CombatSkillInputs, type CombatSpellRow, type MeleeOverviewRow } from '../domain/combatOverview';
import './combat-updates.css';
import { SOURCES, SPELL_MODELS, characterStats, meleePeak, rangedScenario, spellRange } from '../domain/mechanics';

function Numeric({ value, onChange, min = 0, max, step = 1 }: {
  value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number | 'any';
}) {
  return <input type="number" value={Number.isFinite(value) ? value : ''} inputMode="decimal" min={min} max={max} step={step}
    onChange={e => onChange(e.target.value === '' ? NaN : Number(e.target.value))} />;
}
const rangeLabel = (range: ReturnType<typeof spellRange>) => range ? `${number(range.min)}–${number(range.max)}` : '—';

function SpellCalculator({ level, magicLevel, initialSelection }: { level: number; magicLevel: number; initialSelection?: string }) {
  const { character, state, server } = useApp();
  const references = effectiveSpells(state, server.id);
  const [selected, setSelected] = useState(initialSelection || (character.vocation === 'knight' ? 'uh' : 'hmm'));
  const [filter, setFilter] = useState('all');
  const [comparisonLevel, setComparisonLevel] = useState(level);
  const [comparisonML, setComparisonML] = useState(magicLevel + 5);
  const [missingHP, setMissingHP] = useState<number | null>(null);
  const model = SPELL_MODELS.find(item => item.id === selected)!;
  const shown = SPELL_MODELS.filter(item => filter === 'all' || item.category === filter).sort((a, b) => (spellReference(a, references)?.name ?? a.name).localeCompare(spellReference(b, references)?.name ?? b.name));
  const current = combatSpellRange(model, level, magicLevel);
  const comparison = combatSpellRange(model, comparisonLevel, comparisonML);
  const reference = spellReference(model, references);
  const { failures: failed, unchecked } = spellRequirementCheck(model, reference, character, level, magicLevel);
  const validMissingHP = missingHP !== null && Number.isFinite(missingHP) && missingHP >= 0;
  function changeFilter(value: string) {
    setFilter(value);
    if (value !== 'all' && model.category !== value) setSelected(SPELL_MODELS.find(item => item.category === value)!.id);
  }
  const requirementTitle = failed.length ? 'Requirements not met' : unchecked.length ? 'Partial requirement check' : 'Listed requirements met';
  return <>
    <section className="card">
      <div className="toolbar"><h2>Choose an action</h2><Badge tone="blue">Historical estimate</Badge></div>
      <div className="form-grid">
        <Field label="Show"><select value={filter} onChange={e => changeFilter(e.target.value)}><option value="all">Damage & healing</option><option value="damage">Damage</option><option value="healing">Healing</option></select></Field>
        <Field label="Spell or rune"><select value={selected} onChange={e => setSelected(e.target.value)}>{shown.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        {model.category === 'healing' && <Field label="Missing HP (optional)" hint="Limits effective healing to the health you can recover.">
          <input type="number" min={0} value={missingHP ?? ''} placeholder="Show the full healing range" onChange={e => setMissingHP(e.target.value === '' ? null : Number(e.target.value))} />
        </Field>}
      </div>
      <p><strong>{model.words}</strong> · {model.type === 'rune' ? 'Rune use' : 'Instant spell'} · <Badge>{model.element}</Badge></p>
      <p className="muted">Raw ranges from the legacy reference model. The preview applies no target armor, defense, immunity or PvP reduction.</p>
    </section>
    <div className="grid-2">
      <section className="card">
        <div className="toolbar"><h2>At your inputs</h2>{model.category === 'healing' ? <Heart size={20} /> : <Sparkles size={20} />}</div>
        <p className="muted">Level {number(level)} · Magic level {number(magicLevel)}</p>
        <div className="stat-grid">
          <Stat label={model.category === 'healing' ? 'Raw healing range' : 'Raw damage range'} value={rangeLabel(current)} detail="Model output before final game adjustments" tone={model.category === 'healing' ? 'green' : 'blue'} />
          <Stat label="Range midpoint" value={current ? number(current.midpoint, 1) : '—'} detail="Not a verified statistical average" />
        </div>
        {model.category === 'healing' && validMissingHP && current && <p>Effective healing with {number(missingHP!)} HP missing: <strong>{number(Math.min(current.min, missingHP!))}–{number(Math.min(current.max, missingHP!))}</strong>.</p>}
        <div className="toolbar"><Badge tone={failed.length ? 'amber' : unchecked.length ? 'muted' : 'green'}>{requirementTitle}</Badge></div>
        {failed.map(message => <p key={message}>{message}</p>)}
        {unchecked.map(message => <p className="muted" key={message}>{message}</p>)}
        <p className="muted">This is a mathematical preview. Spell learning, current mana and cooldowns are not checked.</p>
        {reference && <details className="evidence"><summary>Reference requirements</summary><div>
          {model.type === 'rune' ? <>
            <p>Rune use: ML {reference.useMagicLevel ?? 'unknown'}; character level {reference.useLevel ?? 'not confirmed'}.</p>
            <p>Creating the rune is a separate action: level {reference.level ?? 'unknown'}, {reference.mana ?? 'unknown'} mana, {reference.soulCost ?? 'unknown'} soul and {reference.runeCharges ?? 'unknown'} charges per rune item.</p><p>Creation vocations: {reference.vocations === null ? 'Not confirmed' : reference.vocations.length ? reference.vocations.join(', ') : 'None listed'}. These creation conditions do not restrict the use preview above.</p>
          </> : <p>Level {reference.level ?? 'unknown'} · {reference.mana ?? 'unknown'} mana · {reference.premium === null ? 'Premium rule unknown' : reference.premium ? 'Premium' : 'No premium requirement listed'}.</p>}
          <p>Requirements use a labelled 7.72 reconstruction. Meeting the listed conditions is not historical certification.</p>
        </div></details>}
      </section>
      <section className="card">
        <div className="toolbar"><h2>Compare a future build</h2><ArrowRight size={19} /></div>
        <div className="form-grid">
          <Field label="Compare character level"><Numeric value={comparisonLevel} onChange={setComparisonLevel} min={1} max={2000} /></Field>
          <Field label="Compare magic level"><Numeric value={comparisonML} onChange={setComparisonML} max={200} /></Field>
        </div>
        <div className="stat-grid">
          <Stat label="Comparison range" value={rangeLabel(comparison)} detail="Same model and action" />
          <Stat label="Change in maximum" value={current && comparison ? (comparison.max - current.max >= 0 ? '+' : '') + number(comparison.max - current.max) : '—'} detail="Compared with the inputs above" />
        </div>
        <button className="btn" onClick={() => { setComparisonLevel(level); setComparisonML(magicLevel + 5); }}>Compare +5 magic levels</button>
      </section>
    </div>
    {(!current || !comparison) && <Notice tone="warning">Enter whole levels and magic levels. Character level must be at least 1.</Notice>}
    <section className="card">
      <h2>Compare actions at these inputs</h2>
      <div style={{ overflowX: 'auto' }}><table className="data-table"><thead><tr><th>Action</th><th>Type</th><th>Element</th><th>Raw range</th><th></th></tr></thead><tbody>
        {shown.map(item => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.type === 'rune' ? 'Rune' : 'Instant'}</td><td>{item.element}</td><td>{rangeLabel(combatSpellRange(item, level, magicLevel))}</td><td><button className="btn" disabled={item.id === selected} onClick={() => setSelected(item.id)}>{item.id === selected ? 'Selected' : 'Inspect'}</button></td></tr>)}
      </tbody></table></div>
    </section>
    <Evidence>
      <p>This independently implemented estimate uses legacy magic power 2 × character level + 3 × magic level. Each action has its own low/high coefficient; some actions use a minimum power of 100. This selected action uses {number(model.low * 100, 2)}–{number(model.high * 100, 2)}% of {model.floorPower ? 'at least 100 power' : 'power'}, rounded down.</p>
      <p>The linked calculator is branded 7.4. Its coefficients are preserved as a transparent comparison model, not certified 7.7 combat. Its old magic-level-only instant-spell eligibility has not been copied. The 2006 observations support the old model family and physical classifications, but exact final combat rules and damage distribution still need corroboration.</p>
      <p><External href={SOURCES.damage}>Legacy calculator reference</External> · <External href={SOURCES.historicalDamage}>2006 damage observations</External> · <External href={SOURCES.update}>7.6 spell-requirement change</External></p>
    </Evidence>
  </>;
}

function WeaponCalculator({ skills, initialWeapon, initialKind }: { skills: CombatSkillInputs; initialWeapon?: MeleeOverviewRow; initialKind?: string }) {
  const { character, state, server } = useApp();
  const [kind, setKind] = useState(initialWeapon ? 'melee' : initialKind || (character.vocation === 'paladin' ? 'distance' : 'melee'));
  const [weaponSkill, setWeaponSkill] = useState<'axe' | 'sword' | 'club'>(initialWeapon?.skill || 'sword');
  const [skill, setSkill] = useState(initialWeapon?.inputSkill ?? skills.sword);
  const [attack, setAttack] = useState(initialWeapon ? initialWeapon.attack ?? NaN : 30);
  const [otherAttack, setOtherAttack] = useState(35);
  const [otherSkill, setOtherSkill] = useState(initialWeapon?.inputSkill ?? skills.sword);
  const [observedMin, setObservedMin] = useState(30);
  const [observedMax, setObservedMax] = useState(60);
  const [hitPercent, setHitPercent] = useState(75);
  const [attackSeconds, setAttackSeconds] = useState(2);
  const [cost, setCost] = useState(2);
  const peak = Number.isInteger(skill) && skill >= 0 && skill <= 300 && attack > 0 && attack <= 1000 ? meleePeak(skill, attack) : null;
  const otherPeak = Number.isInteger(otherSkill) && otherSkill >= 0 && otherSkill <= 300 && otherAttack > 0 && otherAttack <= 1000 ? meleePeak(otherSkill, otherAttack) : null;
  const scenario = rangedScenario(observedMin, observedMax, hitPercent, attackSeconds, cost);
  const weapons = meleeOverview(state, server.id, skills).filter(item => item.attack !== null && item.attack > 0);
  return <>
    <section className="card">
      <h2>Weapon planning</h2>
      <Tabs value={kind} onChange={setKind} tabs={[{ id: 'melee', label: 'Melee peak estimate' }, { id: 'distance', label: 'Distance scenario' }, { id: 'wand', label: 'Wand / rod scenario' }]} />
      {kind === 'melee' ? <>
        <p className="muted">Full-attack raw maximum from the legacy weapon model. Armor, shielding, misses and attack timing are excluded.</p>
        {weapons.length > 0 && <Field label="Use a sourced weapon attack value"><select defaultValue={initialWeapon?.id || ''} onChange={e => { const item = weapons.find(w => w.id === e.target.value); if (item?.attack) { setAttack(item.attack); setWeaponSkill(item.skill); setSkill(item.inputSkill); } }}><option value="" disabled>Choose a weapon</option>{weapons.map(item => <option key={item.id} value={item.id}>{item.name} · Atk {item.attack}</option>)}</select></Field>}
        <div className="grid-2">
          <div className="combat-weapon-setup"><h3>Current setup</h3><div className="form-grid">
            <Field label="Weapon skill"><select value={weaponSkill} onChange={e => { const selected = e.target.value as 'axe' | 'sword' | 'club'; setWeaponSkill(selected); setSkill(skills[selected]); }}><option value="axe">Axe fighting</option><option value="sword">Sword fighting</option><option value="club">Club fighting</option></select></Field><Field label={`${weaponSkill[0].toUpperCase() + weaponSkill.slice(1)} skill`}><Numeric value={skill} onChange={setSkill} max={300} /></Field>
            <Field label="Weapon attack"><Numeric value={attack} onChange={setAttack} min={1} max={1000} /></Field>
          </div><Stat label="Estimated raw maximum" value={peak === null ? '—' : number(peak)} icon={<Swords size={17} />} /></div>
          <div className="combat-weapon-setup"><h3>Compare a setup</h3><div className="form-grid">
            <Field label="Comparison melee skill"><Numeric value={otherSkill} onChange={setOtherSkill} max={300} /></Field>
            <Field label="Comparison weapon attack"><Numeric value={otherAttack} onChange={setOtherAttack} min={1} max={1000} /></Field>
          </div><Stat label="Comparison raw maximum" value={otherPeak === null ? '—' : number(otherPeak)} detail={peak !== null && otherPeak !== null ? `${otherPeak - peak >= 0 ? '+' : ''}${number(otherPeak - peak)} maximum damage` : 'Enter valid values'} /></div>
        </div>
      </> : <>
        <p className="muted">Use your observed hits to compare a {kind === 'wand' ? 'wand or rod' : 'distance'} setup. The initial numbers are examples, not a weapon’s historical stats.</p>
        <div className="form-grid">
          <Field label="Observed minimum hit"><Numeric value={observedMin} onChange={setObservedMin} /></Field>
          <Field label="Observed maximum hit"><Numeric value={observedMax} onChange={setObservedMax} /></Field>
          <Field label="Hits landing (%)"><Numeric value={hitPercent} onChange={setHitPercent} max={100} step={0.1} /></Field>
          <Field label="Seconds per attack"><Numeric value={attackSeconds} onChange={setAttackSeconds} min={0.1} step={0.1} /></Field>
          <Field label={kind === 'wand' ? 'Mana per attack' : 'Average ammunition cost per attack (gp)'}><Numeric value={cost} onChange={setCost} step="any" /></Field>
        </div>
        <div className="stat-grid">
          <Stat label="Midpoint scenario per second" value={scenario ? number(scenario.midpointDPS, 1) : '—'} detail="Assumes landed hits average the entered midpoint" icon={<Crosshair size={17} />} />
          <Stat label={kind === 'wand' ? 'Mana per active hour' : 'Ammo cost per active hour'} value={scenario ? kind === 'wand' ? number(scenario.costPerHour) : gp(scenario.costPerHour) : '—'} detail="Continuous attacks at the entered interval" />
          <Stat label="Attacks per active hour" value={scenario ? number(scenario.attacksPerHour) : '—'} detail="No pauses included" />
        </div>
        {!scenario && <Notice tone="warning">Use a maximum at least as large as the minimum, 0–100% hits, and a positive attack interval.</Notice>}
        <p className="muted">The scenario does not derive hit chance from distance skill or infer ammunition, wand or rod damage. Enter observations from the same target and combat settings; target mitigation already present in those observations is not applied again.</p>
      </>}
    </section>
    <Evidence><p>The melee preview implements floor((5 × skill + 50) × attack × 1.2 / 100), the reference’s full-attack maximum. It is a sourced estimate; no balanced/defensive multiplier or ranged formula is invented.</p>
      <p>Distance and wand/rod scenarios are arithmetic on your own observations. The midpoint is an explicit assumption, not a verified damage distribution or a prediction based on vocation skill.</p>
      <p><External href={SOURCES.damage}>Legacy weapon-model reference</External></p>
    </Evidence>
  </>;
}

function SpellResultRow({ row, level, magicLevel, onInspect }: {
  row: CombatSpellRow; level: number; magicLevel: number; onInspect: (id: string) => void;
}) {
  const { character, state, server } = useApp();
  const requirement = spellRequirementCheck(row.model, row.reference, character, level, magicLevel);
  const edited = row.reference && Boolean(state.spellOverrides?.[spellOverrideKey(server.id, row.reference.id)]);
  const rune = row.model.type === 'rune';
  return <tr>
    <td><div className="combat-action">
      <SpellSprite spell={row.reference} name={row.name} words={row.model.words} size={32} />
      <div><strong>{row.name}</strong><span className="combat-incantation">{rune ? row.model.element : row.reference?.words ?? row.model.words}</span>
        <button className="combat-inspect" onClick={() => onInspect(row.id)}>Inspect & compare <ArrowUpRight size={12} /></button>
      </div>
    </div></td>
    <td><strong className="combat-result">{rangeLabel(row.range)}</strong><span className="combat-result-unit">{row.model.category === 'healing' ? 'HP restored' : row.model.element + ' damage'}{rune ? ' / use' : ''}</span></td>
    <td>{rune ? <>
      <strong>ML {row.reference?.useMagicLevel ?? '?'}</strong>
      <span className="combat-incantation">{row.reference?.useLevel == null ? 'Use level unconfirmed' : `Use level ${row.reference.useLevel}`}</span>
    </> : <>
      <strong>{row.reference?.mana == null ? 'Unknown' : number(row.reference.mana)}{row.reference?.mana == null ? '' : ' mana'}</strong>
      <span className="combat-incantation">Level {row.reference?.level ?? '?'}</span>
    </>}
      <span className="combat-requirement" title={[...requirement.failures, ...requirement.unchecked].join(' ')}>
        <Badge tone={requirement.status === 'blocked' ? 'warning' : requirement.status === 'listed' ? 'success' : 'muted'}>{requirement.title}</Badge>
      </span>
      {edited && <span className="combat-incantation">Server edit</span>}
    </td>
  </tr>;
}

function CombatOverview({ level, magicLevel, skills, onSpellInspect, onWeaponInspect, onScenario }: {
  level: number; magicLevel: number; skills: CombatSkillInputs;
  onSpellInspect: (id: string) => void; onWeaponInspect: (weapon: MeleeOverviewRow) => void; onScenario: () => void;
}) {
  const { state, server } = useApp();
  const [query, setQuery] = useState(''), [weaponType, setWeaponType] = useState('all');
  const groups = spellOverviewGroups(level, magicLevel, effectiveSpells(state, server.id));
  const weapons = meleeOverview(state, server.id, skills);
  const shownWeapons = weapons.filter(weapon => (weaponType === 'all' || weapon.skill === weaponType)
    && weapon.name.toLowerCase().includes(query.toLowerCase().trim()));
  const jump = (id: string) => document.getElementById('combat-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return <div className="combat-overview">
    <Notice><strong>Raw comparison model.</strong> All 21 Legacy spell and rune outputs are shown together. These ranges and the weapon maxima exclude armor, shielding, immunities, PvP reduction and missed attacks. The source calculator is branded 7.4; its formulas remain a labelled comparison model for this 7.7 companion.</Notice>
    <nav className="combat-jump-links" aria-label="Combat result groups">
      <button className="btn btn-secondary" onClick={() => jump('melee')}>Melee · {weapons.length}</button>
      {groups.map(group => <button key={group.id} className="btn btn-secondary" onClick={() => jump(group.id)}>{group.title} · {group.rows.length}</button>)}
    </nav>

    <section className="panel combat-section" id="combat-melee">
      <div className="combat-section-heading"><div><h2><Swords size={19} />Melee</h2><p>Every sourced axe, sword and club weapon, using its matching skill above. Sorted alphabetically.</p></div><Badge>{weapons.length} weapons</Badge></div>
      <div className="combat-weapon-controls">
        <SearchBox value={query} onChange={setQuery} placeholder="Find a weapon…" />
        <select aria-label="Weapon skill filter" value={weaponType} onChange={event => setWeaponType(event.target.value)}>
          <option value="all">All melee weapons</option><option value="axe">Axes</option><option value="sword">Swords</option><option value="club">Clubs</option>
        </select>
        {(query || weaponType !== 'all') && <button className="btn btn-ghost" onClick={() => { setQuery(''); setWeaponType('all'); }}>Show all</button>}
      </div>
      <div className="combat-weapon-scroll">
        <table className="data-table"><thead><tr><th>Weapon</th><th>Matching skill</th><th>Attack</th><th>Raw maximum</th><th>Reference</th><th /></tr></thead>
          <tbody>{shownWeapons.map(weapon => <tr key={weapon.id}>
            <td><div className="combat-action"><ItemSprite itemId={weapon.catalogItemId || weapon.id} name={weapon.name} /><strong>{weapon.name}</strong></div></td>
            <td>{weapon.skill[0].toUpperCase() + weapon.skill.slice(1)} <strong>{number(weapon.inputSkill)}</strong></td>
            <td>{weapon.attack == null ? <span className="muted">Unknown</span> : number(weapon.attack)}{weapon.attackSource !== 'reference' && <span className="combat-incantation">{weapon.attackSource === 'override' ? 'Server edit' : 'Catalog value'}</span>}</td>
            <td><strong className="combat-result">{weapon.rawMaximum == null ? '—' : number(weapon.rawMaximum)}</strong><span className="combat-result-unit">Full attack</span></td>
            <td><External href={weapon.sourceUrl}>7.72 reference</External></td>
            <td><button className="combat-inspect" onClick={() => onWeaponInspect(weapon)}>Compare <ArrowUpRight size={13} /></button></td>
          </tr>)}</tbody>
        </table>
        {!shownWeapons.length && <p className="combat-table-footer">No weapons match. Clear the search or choose another weapon class.</p>}
      </div>
      <p className="combat-table-footer">{shownWeapons.length} of {weapons.length} weapons · Scroll the table for the full list. A maximum is a ceiling in this formula, not an average hit. Weapon attack and class come from Primibia’s 7.72 reconstruction; matching server catalog edits take priority. The list does not assert that every weapon is obtainable.</p>
    </section>

    <div className="combat-spell-grid">
      {groups.map(group => <section key={group.id} className="panel combat-section" id={'combat-' + group.id}>
        <div className="combat-section-heading"><div><h2>{group.id.includes('healing') ? <Heart size={19} /> : <Sparkles size={19} />}{group.title}</h2><p>{group.description}</p></div><Badge>{group.rows.length} actions</Badge></div>
        <div className="table-wrap combat-spell-table"><table className="data-table"><thead><tr><th>Action · A–Z</th><th>{group.id.includes('healing') ? 'Raw healing' : 'Raw damage'}</th><th>{group.id.startsWith('rune-') ? 'Rune use' : 'Casting reference'}</th></tr></thead>
          <tbody>{group.rows.map(row => <SpellResultRow key={row.id} row={row} level={level} magicLevel={magicLevel} onInspect={onSpellInspect} />)}</tbody>
        </table></div>
        <p className="combat-table-footer">{group.id.startsWith('rune-')
          ? 'Rune-use checks are separate from creation vocation, mana and soul. Existing rune charges are being compared here.'
          : 'Listed checks cover known level, vocation and account requirements. Spell learning, current mana and cooldowns are not checked.'}</p>
      </section>)}
    </div>

    <section className="combat-unmodeled">
      <Crosshair size={22} /><div><h3>Distance, shielding and other effects</h3>
        <p>No verified damage or hit-chance formula is applied to distance skill, fist skill, shielding, wands or rods here. Berserk, damage over time and other actions outside the 21 Legacy models have no raw range in this overview. Their absence is not a zero-damage result.</p>
        <button className="btn btn-secondary" onClick={onScenario}>Use observed weapon hits <ArrowRight size={14} /></button>
      </div>
    </section>
    <Evidence>
      <p>Spell and rune output uses power = 2 × character level + 3 × magic level, the action’s coefficients, and its documented minimum-power rule. Melee maximum uses floor((5 × matching weapon skill + 50) × weapon attack × 1.2 / 100).</p>
      <p>The formulas were checked against the linked calculator’s actual script. Its pre-7.6 magic-level-only casting gates are not used. Requirements come from the separate 7.72 spell reference, with your server edits applied. A displayed mathematical result is not a claim that the action can currently be cast.</p>
      <p>The weapon table contains 84 item records with a sourced weapon class and attack attribute. No missing or explicitly cleared attack attribute is converted to zero damage. Per-weapon reference links retain the attribute provenance.</p>
      <p><External href={SOURCES.damage}>Legacy calculator and formulas</External> · <External href={WEAPON_REFERENCE.url}>Primibia weapon properties</External> · <External href={SOURCES.historicalDamage}>2006 combat observations</External> · <External href={SOURCES.update}>Official 7.6 magic update</External></p>
    </Evidence>
  </div>;
}

function profileSkills(character: Character): CombatSkillInputs {
  return Object.fromEntries(COMBAT_SKILLS.map(skill => [skill.id, characterSkill(character, skill.id)])) as CombatSkillInputs;
}

function combatTabFromHash() {
  const tab = window.location.hash.replace(/^#\/?/, '').split('/')[1];
  return ['overview', 'spells', 'weapons'].includes(tab) ? tab : 'overview';
}

export default function Combat() {
  const { character, openProfile, navigate } = useApp();
  const [tab, setTab] = useState(combatTabFromHash);
  const [level, setLevel] = useState(character.level), [magicLevel, setMagicLevel] = useState(character.magicLevel);
  const [skills, setSkills] = useState(() => profileSkills(character));
  const [selectedSpell, setSelectedSpell] = useState<string>();
  const [selectedWeapon, setSelectedWeapon] = useState<MeleeOverviewRow>();
  const [weaponKind, setWeaponKind] = useState<string>();
  useEffect(() => { setLevel(character.level); setMagicLevel(character.magicLevel); }, [character.id, character.level, character.magicLevel]);
  useEffect(() => { setSkills(profileSkills(character)); }, [character.id, character.meleeSkill, character.axeSkill, character.swordSkill, character.clubSkill, character.fistSkill, character.distanceSkill, character.shieldingSkill]);
  useEffect(() => {
    const syncTab = () => setTab(combatTabFromHash());
    window.addEventListener('hashchange', syncTab);
    return () => window.removeEventListener('hashchange', syncTab);
  }, []);
  const changeTab = (selected: string) => { setTab(selected); navigate('combat/' + selected); };
  const inspectSpell = (id: string) => { setSelectedSpell(id); changeTab('spells'); };
  const inspectWeapon = (weapon: MeleeOverviewRow) => { setSelectedWeapon(weapon); setWeaponKind('melee'); changeTab('weapons'); };
  const stats = Number.isInteger(level) && level >= 1 && level <= 2000 ? characterStats(level, character.vocation) : null;
  const validInputs = Number.isInteger(level) && level >= 1 && level <= 2000 && Number.isInteger(magicLevel) && magicLevel >= 0 && magicLevel <= 200
    && Object.values(skills).every(skill => Number.isInteger(skill) && skill >= 0 && skill <= 300);
  return <>
    <PageHeader eyebrow="KNOW YOUR NUMBERS" title="Combat calculator" description="All weapon, spell and rune results together, grouped and alphabetized." actions={<button className="btn" onClick={openProfile}>Character profile</button>} />
    <section className="card">
      <div className="toolbar"><h2>Character preview</h2><Badge>{character.vocation === 'unselected' ? 'Choose a vocation in your profile' : character.name}</Badge></div>
      <div className="combat-profile-grid">
        <Field label="Character level"><Numeric value={level} onChange={setLevel} min={1} max={2000} /></Field>
        <Field label="Magic level"><Numeric value={magicLevel} onChange={setMagicLevel} max={200} /></Field>
        {COMBAT_SKILLS.map(skill => <Field key={skill.id} label={skill.label}><Numeric value={skills[skill.id]} onChange={value => setSkills(previous => ({ ...previous, [skill.id]: value }))} max={300} /></Field>)}
      </div>
      <div className="combat-profile-summary">
        <span><Heart size={15} />Estimated HP <strong>{stats ? number(stats.hp) : '—'}</strong></span>
        <span><Sparkles size={15} />Estimated mana <strong>{stats ? number(stats.mana) : '—'}</strong></span>
        <span><Shield size={15} />Estimated capacity <strong>{stats ? number(stats.capacity) + ' oz' : '—'}</strong></span>
        <button className="combat-inspect" onClick={() => { setLevel(character.level); setMagicLevel(character.magicLevel); setSkills(profileSkills(character)); }}><RotateCcw size={13} />Use profile values</button>
      </div>
      <p className="muted">Temporary inputs leave your character unchanged. Spells use level and magic level; melee weapons use their matching axe, sword or club skill. Distance, shielding and fist values are profile context, with unsupported formulas left unavailable. HP, mana and capacity assume vocation selection at level 8.</p>
    </section>
    {!validInputs && <Notice tone="warning">Use whole character levels from 1–2,000, magic levels from 0–200 and combat skills from 0–300. Invalid inputs leave the affected result unavailable.</Notice>}
    <Tabs value={tab} onChange={changeTab} tabs={[{ id: 'overview', label: 'All results' }, { id: 'spells', label: 'Spell comparison' }, { id: 'weapons', label: 'Weapon scenarios' }]} />
    {tab === 'overview' && <CombatOverview level={level} magicLevel={magicLevel} skills={skills} onSpellInspect={inspectSpell} onWeaponInspect={inspectWeapon} onScenario={() => { setSelectedWeapon(undefined); setWeaponKind('distance'); changeTab('weapons'); }} />}
    {tab === 'spells' && <SpellCalculator key={character.id + (selectedSpell || '')} level={level} magicLevel={magicLevel} initialSelection={selectedSpell} />}
    {tab === 'weapons' && <WeaponCalculator key={character.id + (selectedWeapon?.id || weaponKind || '')} skills={skills} initialWeapon={selectedWeapon} initialKind={weaponKind} />}
  </>;
}
