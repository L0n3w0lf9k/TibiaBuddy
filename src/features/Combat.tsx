import { useEffect, useState } from 'react';
import { ArrowRight, Crosshair, Heart, Shield, Sparkles, Swords } from 'lucide-react';
import { useApp } from '../context';
import { Badge, Evidence, External, Field, Notice, PageHeader, Stat, Tabs, gp, number } from '../shared';
import { spells } from '../data/game';
import { SOURCES, SPELL_MODELS, characterStats, meleePeak, rangedScenario, spellRange } from '../domain/mechanics';

function Numeric({ value, onChange, min = 0, max, step = 1 }: {
  value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number | 'any';
}) {
  return <input type="number" value={Number.isFinite(value) ? value : ''} inputMode="decimal" min={min} max={max} step={step}
    onChange={e => onChange(e.target.value === '' ? NaN : Number(e.target.value))} />;
}
const rangeLabel = (range: ReturnType<typeof spellRange>) => range ? `${number(range.min)}–${number(range.max)}` : '—';

function SpellCalculator({ level, magicLevel }: { level: number; magicLevel: number }) {
  const { character } = useApp();
  const [selected, setSelected] = useState(character.vocation === 'knight' ? 'uh' : 'hmm');
  const [filter, setFilter] = useState('all');
  const [comparisonLevel, setComparisonLevel] = useState(level);
  const [comparisonML, setComparisonML] = useState(magicLevel + 5);
  const [missingHP, setMissingHP] = useState<number | null>(null);
  const model = SPELL_MODELS.find(item => item.id === selected)!;
  const shown = SPELL_MODELS.filter(item => filter === 'all' || item.category === filter);
  const current = spellRange(model, level, magicLevel);
  const comparison = spellRange(model, comparisonLevel, comparisonML);
  const reference = spells.find(item => item.words.trim().toLowerCase() === model.words) ??
    (model.id === 'heal-friend' ? spells.find(item => item.words.toLowerCase().startsWith('exura sio')) : undefined);
  const failed: string[] = [];
  const unchecked: string[] = [];
  if (!reference) unchecked.push('This action’s complete use requirements are not yet in the reference.');
  else if (model.type === 'rune') {
    // Creation vocation, creation level and creation mana must not gate use of an existing rune.
    if (reference.useMagicLevel === null) unchecked.push('Rune-use magic-level requirement is not confirmed.');
    else if (magicLevel < reference.useMagicLevel) failed.push(`Requires magic level ${reference.useMagicLevel} to use this rune.`);
    if (reference.useLevel === null) unchecked.push('The historical rune-use character-level rule still needs confirmation.');
    else if (level < reference.useLevel) failed.push(`Requires character level ${reference.useLevel} to use this rune.`);
  } else {
    if (!reference.vocations || character.vocation === 'unselected') unchecked.push('Select a character vocation to check the vocation requirement.');
    else if (!reference.vocations.includes(character.vocation)) failed.push('This spell is outside the selected vocation’s reference list.');
    if (reference.level === null) unchecked.push('Required character level is not confirmed.');
    else if (level < reference.level) failed.push(`Requires character level ${reference.level}.`);
    if (reference.premium === true && !character.premium) failed.push('The reference requires a premium account.');
    if (reference.promotion === true && !character.promoted) failed.push('The reference requires promotion.');
    if (reference.premium === null || reference.promotion === null) unchecked.push('Some access requirements are not confirmed.');
  }
  const validMissingHP = missingHP !== null && Number.isFinite(missingHP) && missingHP >= 0;
  function changeFilter(value: string) {
    setFilter(value);
    if (value !== 'all' && model.category !== value) setSelected(SPELL_MODELS.find(item => item.category === value)!.id);
  }
  const requirementTitle = failed.length ? 'Requirements not met' : unchecked.length ? 'Partial requirement check' : 'Reference requirements met';
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
            <p>Creating the rune is a separate action: level {reference.level ?? 'unknown'}, {reference.mana ?? 'unknown'} mana, {reference.soulCost ?? 'unknown'} soul.</p>
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
        {shown.map(item => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.type === 'rune' ? 'Rune' : 'Instant'}</td><td>{item.element}</td><td>{rangeLabel(spellRange(item, level, magicLevel))}</td><td><button className="btn" disabled={item.id === selected} onClick={() => setSelected(item.id)}>{item.id === selected ? 'Selected' : 'Inspect'}</button></td></tr>)}
      </tbody></table></div>
    </section>
    <Evidence>
      <p>This independently implemented estimate uses legacy magic power 2 × character level + 3 × magic level. Each action has its own low/high coefficient; some actions use a minimum power of 100. This selected action uses {number(model.low * 100, 2)}–{number(model.high * 100, 2)}% of {model.floorPower ? 'at least 100 power' : 'power'}, rounded down.</p>
      <p>The linked calculator is branded 7.4. Its coefficients are preserved as a transparent comparison model, not certified 7.7 combat. Its old magic-level-only instant-spell eligibility has not been copied. The 2006 observations support the old model family and physical classifications, but exact final combat rules and damage distribution still need corroboration.</p>
      <p><External href={SOURCES.damage}>Legacy calculator reference</External> · <External href={SOURCES.historicalDamage}>2006 damage observations</External> · <External href={SOURCES.update}>7.6 spell-requirement change</External></p>
    </Evidence>
  </>;
}

function WeaponCalculator() {
  const { character, state } = useApp();
  const [kind, setKind] = useState(character.vocation === 'paladin' ? 'distance' : 'melee');
  const [skill, setSkill] = useState(character.meleeSkill);
  const [attack, setAttack] = useState(30);
  const [otherAttack, setOtherAttack] = useState(35);
  const [otherSkill, setOtherSkill] = useState(character.meleeSkill);
  const [observedMin, setObservedMin] = useState(30);
  const [observedMax, setObservedMax] = useState(60);
  const [hitPercent, setHitPercent] = useState(75);
  const [attackSeconds, setAttackSeconds] = useState(2);
  const [cost, setCost] = useState(2);
  const peak = meleePeak(skill, attack);
  const otherPeak = meleePeak(otherSkill, otherAttack);
  const scenario = rangedScenario(observedMin, observedMax, hitPercent, attackSeconds, cost);
  const weapons = state.items.filter(item => item.attack !== null && item.attack !== undefined && item.attack > 0);
  return <>
    <section className="card">
      <h2>Weapon planning</h2>
      <Tabs value={kind} onChange={setKind} tabs={[{ id: 'melee', label: 'Melee peak estimate' }, { id: 'distance', label: 'Distance scenario' }, { id: 'wand', label: 'Wand / rod scenario' }]} />
      {kind === 'melee' ? <>
        <p className="muted">Full-attack raw maximum from the legacy weapon model. Armor, shielding, misses and attack timing are excluded.</p>
        {weapons.length > 0 && <Field label="Use a catalog attack value"><select defaultValue="" onChange={e => { const item = weapons.find(w => w.id === e.target.value); if (item?.attack) setAttack(item.attack); }}><option value="" disabled>Choose a weapon</option>{weapons.map(item => <option key={item.id} value={item.id}>{item.name} · Atk {item.attack}</option>)}</select></Field>}
        <div className="grid-2">
          <div className="panel"><h3>Current setup</h3><div className="form-grid">
            <Field label="Melee skill"><Numeric value={skill} onChange={setSkill} max={300} /></Field>
            <Field label="Weapon attack"><Numeric value={attack} onChange={setAttack} min={1} max={1000} /></Field>
          </div><Stat label="Estimated raw maximum" value={peak === null ? '—' : number(peak)} icon={<Swords size={17} />} /></div>
          <div className="panel"><h3>Compare a setup</h3><div className="form-grid">
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

export default function Combat() {
  const { character, openProfile } = useApp();
  const [tab, setTab] = useState('spells');
  const [level, setLevel] = useState(character.level);
  const [magicLevel, setMagicLevel] = useState(character.magicLevel);
  useEffect(() => { setLevel(character.level); setMagicLevel(character.magicLevel); }, [character.id, character.level, character.magicLevel]);
  const stats = characterStats(level, character.vocation);
  return <>
    <PageHeader eyebrow="KNOW YOUR NUMBERS" title="Combat calculator" description="Explore raw damage, healing and equipment comparisons." actions={<button className="btn" onClick={openProfile}>Character profile</button>} />
    <section className="card">
      <div className="toolbar"><h2>Character preview</h2><Badge>{character.vocation === 'unselected' ? 'Choose a vocation in your profile' : character.name}</Badge></div>
      <div className="form-grid">
        <Field label="Character level"><Numeric value={level} onChange={setLevel} min={1} max={2000} /></Field>
        <Field label="Magic level"><Numeric value={magicLevel} onChange={setMagicLevel} max={200} /></Field>
      </div>
      <div className="stat-grid">
        <Stat label="Level-based HP" value={stats ? number(stats.hp) : '—'} icon={<Heart size={16} />} />
        <Stat label="Level-based mana" value={stats ? number(stats.mana) : '—'} icon={<Sparkles size={16} />} />
        <Stat label="Level-based capacity" value={stats ? number(stats.capacity) + ' oz' : '—'} icon={<Shield size={16} />} />
      </div>
      <p className="muted">Temporary inputs leave your character unchanged. Stat estimates assume vocation selection at level 8; actual profile values may differ.</p>
    </section>
    <Tabs value={tab} onChange={setTab} tabs={[{ id: 'spells', label: 'Spells & runes' }, { id: 'weapons', label: 'Weapons' }]} />
    {tab === 'spells' ? <SpellCalculator key={character.id} level={level} magicLevel={magicLevel} /> : <WeaponCalculator key={character.id} />}
  </>;
}
