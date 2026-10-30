import { useEffect, useState } from 'react';
import { Crosshair, Hand, Heart, RotateCcw, Sparkles, Swords } from 'lucide-react';
import { useApp } from '../context';
import { Badge, Evidence, External, Field, Notice, PageHeader, SearchBox, number } from '../shared';
import type { Character } from '../types';
import ItemSprite from '../components/ItemSprite';
import SpellSprite from '../components/SpellSprite';
import { COMBAT_SKILLS, characterSkill } from '../domain/characterSkills';
import { effectiveSpells, spellOverrideKey } from '../domain/spellCatalog';
import { ATTACK_MODES, CLASSIC_COMBAT_SOURCES, type AttackMode } from '../domain/classicCombat';
import { closeCombatOverview, distanceOverview, spellOverviewGroups, spellRequirementCheck,
  WEAPON_REFERENCE, type CombatSkillInputs, type CombatSpellRow } from '../domain/combatOverview';
import { SOURCES } from '../domain/mechanics';
import './combat-updates.css';

const attackSkills = COMBAT_SKILLS.filter(skill => skill.id !== 'shielding');
const valueLabel = (value: number | null) => value === null ? '—' : number(value);

function Numeric({ value, onChange, min = 0, max }: {
  value: number; onChange: (value: number) => void; min?: number; max: number;
}) {
  return <input type="number" value={Number.isFinite(value) ? value : ''} inputMode="numeric" min={min} max={max} step={1}
    onChange={event => onChange(event.target.value === '' ? NaN : Number(event.target.value))} />;
}

function profileSkills(character: Character): CombatSkillInputs {
  return Object.fromEntries(COMBAT_SKILLS.map(skill => [skill.id, characterSkill(character, skill.id)])) as CombatSkillInputs;
}

function SourceLink({ href }: { href: string }) {
  return <span className="combat-source-link"><External href={href}>Reference</External></span>;
}

function SpellResultRow({ row, level, magicLevel }: { row: CombatSpellRow; level: number; magicLevel: number }) {
  const { character, state, server } = useApp();
  const requirement = spellRequirementCheck(row.model, row.reference, character, level, magicLevel);
  const edited = row.reference && Boolean(state.spellOverrides?.[spellOverrideKey(server.id, row.reference.id)]);
  const rune = row.model.type === 'rune';
  return <tr>
    <td><div className="combat-action">
      <SpellSprite spell={row.reference} name={row.name} words={row.model.words} size={32} />
      <div><strong>{row.name}</strong><span className="combat-incantation">{rune ? row.model.element : row.reference?.words ?? row.model.words}</span></div>
    </div></td>
    <td className="combat-number"><strong>{valueLabel(row.range?.min ?? null)}</strong></td>
    <td className="combat-number"><strong>{valueLabel(row.range?.max ?? null)}</strong></td>
    <td>{rune ? <>
      <strong>ML {row.reference?.useMagicLevel ?? '?'}</strong>
      <span className="combat-incantation">{row.reference?.useLevel == null ? 'Use level unconfirmed' : `Use level ${row.reference.useLevel}`}</span>
    </> : <>
      <strong>{row.reference?.mana == null ? 'Mana unknown' : `${number(row.reference.mana)} mana`}</strong>
      <span className="combat-incantation">Level {row.reference?.level ?? '?'}</span>
    </>}
      <span className="combat-requirement" title={[...requirement.failures, ...requirement.unchecked].join(' ')}>
        <Badge tone={requirement.status === 'blocked' ? 'warning' : requirement.status === 'listed' ? 'success' : 'muted'}>{requirement.title}</Badge>
      </span>
      {edited && <span className="combat-incantation">Server edit</span>}
    </td>
  </tr>;
}

export default function Combat() {
  const { character, state, server, openProfile } = useApp();
  const [level, setLevel] = useState(character.level), [magicLevel, setMagicLevel] = useState(character.magicLevel);
  const [skills, setSkills] = useState(() => profileSkills(character));
  const [mode, setMode] = useState<AttackMode>('offensive');
  const [tiles, setTiles] = useState(2);
  const [weaponQuery, setWeaponQuery] = useState(''), [weaponType, setWeaponType] = useState('all');
  useEffect(() => { setLevel(character.level); setMagicLevel(character.magicLevel); }, [character.id, character.level, character.magicLevel]);
  useEffect(() => { setSkills(profileSkills(character)); }, [character.id, character.meleeSkill, character.axeSkill,
    character.swordSkill, character.clubSkill, character.fistSkill, character.distanceSkill, character.shieldingSkill]);
  const groups = spellOverviewGroups(level, magicLevel, effectiveSpells(state, server.id));
  const melee = closeCombatOverview(state, server.id, skills, mode);
  const shownMelee = melee.filter(weapon => (weaponType === 'all' || weapon.skill === weaponType)
    && weapon.name.toLowerCase().includes(weaponQuery.trim().toLowerCase()));
  const distance = distanceOverview(state, server.id, skills.distance, tiles, mode, { level, magicLevel });
  const validInputs = Number.isInteger(level) && level >= 1 && level <= 2000
    && Number.isInteger(magicLevel) && magicLevel >= 0 && magicLevel <= 200
    && attackSkills.every(({ id }) => Number.isInteger(skills[id]) && skills[id] >= 0 && skills[id] <= 300);
  const jump = (id: string) => document.getElementById('combat-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return <>
    <PageHeader eyebrow="KNOW YOUR NUMBERS" title="Combat calculator" description="Every result in one view. Weapons, spells and runes, sorted A–Z within each group."
      actions={<button className="btn" onClick={openProfile}>Character profile</button>} />
    <section className="card combat-preview">
      <div className="toolbar"><h2>Character preview</h2><button className="btn btn-ghost" onClick={() => {
        setLevel(character.level); setMagicLevel(character.magicLevel); setSkills(profileSkills(character));
      }}><RotateCcw size={14} />Use profile values</button></div>
      <div className="combat-profile-grid">
        <Field label="Character level"><Numeric value={level} onChange={setLevel} min={1} max={2000} /></Field>
        <Field label="Magic level"><Numeric value={magicLevel} onChange={setMagicLevel} max={200} /></Field>
        {attackSkills.map(skill => <Field key={skill.id} label={skill.label}><Numeric value={skills[skill.id]}
          onChange={value => setSkills(previous => ({ ...previous, [skill.id]: value }))} max={300} /></Field>)}
      </div>
      <p className="combat-preview-hint">Temporary inputs leave your saved profile unchanged. Enter base skills; equipment bonuses are not included. Shielding is defensive and does not increase these attack results.</p>
    </section>
    {!validInputs && <Notice tone="warning">Use whole character levels from 1–2,000, magic levels from 0–200 and combat skills from 0–300. Invalid inputs leave the affected result unavailable.</Notice>}

    <div className="combat-overview">
      <Notice><strong>Raw values, before the target’s defenses.</strong> Weapon ranges and projectile accuracy use a labelled 7.72 reconstruction. Spells retain the requested Legacy calculator model. A landed attack can still deal no HP damage.</Notice>
      <nav className="combat-jump-links" aria-label="Combat result groups">
        <button className="btn btn-secondary" onClick={() => jump('melee')}>Melee & fist</button>
        <button className="btn btn-secondary" onClick={() => jump('distance')}>Distance</button>
        {groups.map(group => <button key={group.id} className="btn btn-secondary" onClick={() => jump(group.id)}>{group.title}</button>)}
      </nav>

      <div className="combat-weapon-settings">
        <Field label="Weapon attack mode" hint="Changes physical damage; does not change projectile accuracy.">
          <select value={mode} onChange={event => setMode(event.target.value as AttackMode)}>
            {ATTACK_MODES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </Field>
        <Field label="Distance to target" hint="Adjacent = 1. One empty tile between you = 2. Diagonals count as one tile.">
          <select value={tiles} onChange={event => setTiles(Number(event.target.value))}>
            {[1, 2, 3, 4, 5, 6, 7].map(value => <option key={value} value={value}>{value} {value === 1 ? 'tile · adjacent' : 'tiles'}</option>)}
          </select>
        </Field>
      </div>

      <section className="panel combat-section" id="combat-melee">
        <div className="combat-section-heading"><div><h2><Swords size={19} />Melee & fist</h2>
          <p>Each weapon uses its matching skill. Bare hands use fist fighting.</p></div><Badge>{melee.length} results</Badge></div>
        <div className="combat-weapon-controls">
          <SearchBox value={weaponQuery} onChange={setWeaponQuery} placeholder="Find a weapon…" />
          <select aria-label="Weapon skill filter" value={weaponType} onChange={event => setWeaponType(event.target.value)}>
            <option value="all">All weapons</option><option value="axe">Axes</option><option value="sword">Swords</option>
            <option value="club">Clubs</option><option value="fist">Fist / bare hands</option>
          </select>
          {(weaponQuery || weaponType !== 'all') && <button className="btn btn-ghost" onClick={() => { setWeaponQuery(''); setWeaponType('all'); }}>Show all</button>}
        </div>
        <div className="combat-weapon-scroll">
          <table className="data-table"><thead><tr><th>Weapon · A–Z</th><th>Skill</th><th>Attack</th><th className="combat-number">Raw min</th><th className="combat-number">Raw max</th></tr></thead>
            <tbody>{shownMelee.map(weapon => <tr key={weapon.id}>
              <td><div className="combat-action">{weapon.skill === 'fist'
                ? <span className="combat-fist-icon" aria-hidden="true"><Hand size={22} /></span>
                : <ItemSprite itemId={weapon.catalogItemId || weapon.id} name={weapon.name} />}
                <div><strong>{weapon.name}</strong><SourceLink href={weapon.sourceUrl} /></div>
              </div></td>
              <td>{weapon.skill[0].toUpperCase() + weapon.skill.slice(1)} <strong>{number(weapon.inputSkill)}</strong></td>
              <td>{weapon.attack == null ? <span className="muted">Unknown</span> : number(weapon.attack)}
                {weapon.attackSource !== 'reference' && <span className="combat-incantation">{weapon.attackSource === 'override' ? 'Server edit' : 'Catalog value'}</span>}</td>
              <td className="combat-number"><strong>{valueLabel(weapon.rawMinimum)}</strong></td>
              <td className="combat-number"><strong>{valueLabel(weapon.rawMaximum)}</strong></td>
            </tr>)}</tbody>
          </table>
          {!shownMelee.length && <p className="combat-table-footer">No weapons match. Clear the search or choose another skill.</p>}
        </div>
        <p className="combat-table-footer">{shownMelee.length} of {melee.length} results · Scroll for more. A raw minimum of 0 is possible in the damage roll itself, before target defense or armor. A maximum is a ceiling, not a typical hit. This reference list does not guarantee item availability on your server.</p>
      </section>

      <section className="panel combat-section" id="combat-distance">
        <div className="combat-section-heading"><div><h2><Crosshair size={19} />Distance weapons & ammunition</h2>
          <p>Distance fighting {number(skills.distance)} · {tiles} {tiles === 1 ? 'tile' : 'tiles'} to target · Burst explosion uses level + magic level.</p></div><Badge>{distance.length} results</Badge></div>
        <div className="table-wrap combat-distance-table">
          <table className="data-table"><thead><tr><th>Projectile · A–Z</th><th>Attack</th><th className="combat-number">Raw min</th><th className="combat-number">Raw max</th><th className="combat-number">Hit chance</th></tr></thead>
            <tbody>{distance.map(weapon => <tr key={weapon.id}>
              <td><div className="combat-action"><ItemSprite itemId={weapon.catalogItemId || weapon.id} name={weapon.name} />
                <div><strong>{weapon.name}</strong>
                  <span className="combat-incantation">{weapon.launcher ? `With ${weapon.launcher}` : 'Thrown weapon'} · range {weapon.maxRange}</span>
                  {weapon.effect === 'burst' && <span className="combat-effect-note">Explosion · level {number(level)}, ML {number(magicLevel)} · classic estimate</span>}
                  {weapon.effect === 'poison' && <span className="combat-effect-note">Physical range only; poison excluded</span>}
                  <SourceLink href={weapon.sourceUrl} />
                </div></div></td>
              <td>{weapon.effect === 'burst' ? <span className="muted">Magic-based</span> : valueLabel(weapon.attack)}
                {weapon.attackSource !== 'reference' && <span className="combat-incantation">{weapon.attackSource === 'override' ? 'Server edit' : 'Catalog value'}</span>}</td>
              <td className="combat-number"><strong>{valueLabel(weapon.rawMinimum)}</strong></td>
              <td className="combat-number"><strong>{valueLabel(weapon.rawMaximum)}</strong></td>
              <td className="combat-number" title={weapon.effect === 'burst'
                ? 'Projectile accuracy check only. The burst explosion can also occur after that check fails; this is not splash damage probability.'
                : 'Projectile accuracy before armor, immunities and other target mitigation. This is not the chance of causing HP damage.'}>
                {weapon.outOfRange ? <Badge tone="warning">Out of range</Badge>
                  : <strong>{weapon.accuracy === null ? '—' : `${number(weapon.accuracy * 100, 1)}%`}</strong>}
                <span className="combat-incantation">{weapon.effect === 'burst' ? 'Projectile check only' : 'Before target mitigation'}</span>
              </td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="combat-table-footer combat-distance-notes">
          <p><strong>Accuracy is not HP damage chance.</strong> A shot that lands can roll 0 or be absorbed by armor. The reconstruction does not subtract shielding from player projectile damage. Range and a clear line of sight are required; wall and viewport geometry are not simulated.</p>
          <p><strong>Fire / burst arrows:</strong> the classic <em>exevo con flam</em> reference is Explosive Arrow, which produces Burst Arrow. Its reconstructed explosion range is <strong>0–floor(0.6 × (2 × level + 3 × magic level))</strong>; distance skill and attack mode do not increase it. A separate elemental Fire Arrow is not established in this 7.72 item catalog. Projectile accuracy is not the explosion’s chance of affecting a target: the explosion also occurs after a miss. Poison damage over time is excluded.</p>
          <p>Accuracy follows the pinned source’s inclusive comparisons: up to 91% with a bow or crossbow and 76% with thrown weapons. These are literal reconstruction estimates; conventional 90% / 75% descriptions and custom servers can differ. Ordinary weapon damage has no character-level bonus in this model.</p>
        </div>
      </section>

      <div className="combat-spell-grid">
        {groups.map(group => <section key={group.id} className="panel combat-section" id={'combat-' + group.id}>
          <div className="combat-section-heading"><div><h2>{group.id.includes('healing') ? <Heart size={19} /> : <Sparkles size={19} />}{group.title}</h2>
            <p>{group.description}</p></div><Badge>{group.rows.length} actions</Badge></div>
          <div className="table-wrap combat-spell-table"><table className="data-table"><thead><tr><th>Action · A–Z</th><th className="combat-number">Raw min</th><th className="combat-number">Raw max</th><th>{group.id.startsWith('rune-') ? 'Rune use' : 'Casting'}</th></tr></thead>
            <tbody>{group.rows.map(row => <SpellResultRow key={row.id} row={row} level={level} magicLevel={magicLevel} />)}</tbody>
          </table></div>
          <p className="combat-table-footer">{group.id.startsWith('rune-')
            ? 'Per existing rune charge. Use requirements are separate from creation vocation, mana and soul.'
            : 'Known level, vocation and account requirements are checked. Learning, current mana and cooldowns are not checked.'}
            {group.id.includes('healing') ? ' Actual healing is limited by missing HP.' : ' Target mitigation and PvP adjustments are excluded.'}</p>
        </section>)}
      </div>

      <Evidence>
        <p><strong>Weapon model.</strong> The 7.72 reconstruction adjusts integer weapon attack first: full attack adds floor(20% of attack); full defense subtracts floor(40%); balanced leaves it unchanged. It then rolls floor((U + V) / 2), with U and V each in 0–99. Raw damage is floor(roll × adjusted attack × (5 × skill + 50) / 10,000). The endpoints shown are 0 and the result with roll 99. They are not the previous Legacy calculator’s approximate weapon ceiling.</p>
        <p><strong>Distance accuracy.</strong> The model uses base distance skill S and tile distance d = max(|dx|, |dy|). Difficulty is 15d, except adjacent targets use 75. The source tests S ≥ rand()%difficulty, then rand()%100 ≤ 90 for launchers or ≤ 75 for throws. Assuming uniform modulo outcomes gives min((S + 1) / difficulty, 1) × 0.91 or 0.76. Attack mode does not affect this check. Platform-specific RNG bias is not simulated.</p>
        <p><strong>Source limits.</strong> This is a community reconstruction with a stated decompilation uncertainty around the random factor, not official 7.7 certification. Bare hands use attack 7 from the linked investigator’s human-race data excerpt. Item attack/range values come from Primibia’s 7.72 property tables; matching server attack edits take priority for ordinary weapons. Bows and crossbows supply range and ammunition compatibility; they do not add a modern attack bonus.</p>
        <p><strong>Burst Arrow.</strong> The pinned classic script calls ComputeDamage(30, 30), giving base damage 0…60. The old engine scales that by (2 × level + 3 × ML) / 100 with no minimum-power floor. This table shows that explosion alone, before armor and PvP reductions; the item’s physical attack attribute is 0. The exact coefficient is a classic reconstruction baseline, while CipSoft’s June 2007 announcement confirms that burst arrows changed to distance-skill-based damage in the later update. Damage distribution, splash coverage, obstacles and custom server modifications are not simulated.</p>
        <p><strong>Spell and rune model.</strong> All 21 outputs retain the requested Legacy calculator coefficients, using power = 2 × level + 3 × magic level and each action’s minimum-power rule. That calculator is branded 7.4. Its old casting gates are not copied; effective per-server spell requirements are shown instead. Other effects such as Berserk, wands and rods are not estimated here.</p>
        <p className="combat-evidence-links"><External href={CLASSIC_COMBAT_SOURCES.combat}>Attack modes & projectiles</External>
          <External href={CLASSIC_COMBAT_SOURCES.skills}>Damage rolls & accuracy</External>
          <External href={CLASSIC_COMBAT_SOURCES.mitigation}>Target armor stage</External>
          <External href={CLASSIC_COMBAT_SOURCES.magic}>Classic arrow conjuration</External>
          <External href={CLASSIC_COMBAT_SOURCES.burst}>Burst Arrow coefficient</External>
          <External href={CLASSIC_COMBAT_SOURCES.fist}>Human base attack</External>
          <External href={WEAPON_REFERENCE.url}>Weapon properties</External>
          <External href={SOURCES.damage}>Legacy spell calculator</External>
          <External href={CLASSIC_COMBAT_SOURCES.laterChanges}>Official 2007 combat changes</External>
          <External href={CLASSIC_COMBAT_SOURCES.decompilation}>Reconstruction author’s notes</External></p>
      </Evidence>
    </div>
  </>;
}
