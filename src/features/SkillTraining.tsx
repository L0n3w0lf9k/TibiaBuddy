import { useEffect, useState } from 'react';
import { Clock3, Hand, RotateCcw, Shield, Target, TrendingUp, Users } from 'lucide-react';
import { useApp } from '../context';
import ItemSprite from '../components/ItemSprite';
import { Badge, Evidence, External, Field, Notice, Stat, duration, number } from '../shared';
import { PHYSICAL_SKILLS, SKILL_SOURCES, planSkillTraining, type PhysicalSkill } from '../domain/skills';
import type { Character, Vocation } from '../types';

interface SkillDraft {
  currentLevel: number;
  percentRemaining: number;
  targetLevel: number;
}

const illustrations: Partial<Record<PhysicalSkill, string>> = {
  axe: 'Axe', sword: 'Sword', club: 'Club', distance: 'Bow', shielding: 'Wooden Shield',
};

function profileLevel(character: Character, skill: PhysicalSkill) {
  return skill === 'distance' ? character.distanceSkill
    : skill === 'shielding' ? character.shieldingSkill : character.meleeSkill;
}

function initialDraft(character: Character, skill: PhysicalSkill): SkillDraft {
  const currentLevel = profileLevel(character, skill);
  return { currentLevel, percentRemaining: 100, targetLevel: Math.min(200, currentLevel + 1) };
}

function initialDrafts(character: Character) {
  return Object.fromEntries(PHYSICAL_SKILLS.map(skill => [skill.id, initialDraft(character, skill.id)])) as Record<PhysicalSkill, SkillDraft>;
}

function Numeric({ value, onChange, min, max, step = 1 }: {
  value: number; onChange: (value: number) => void; min: number; max: number; step?: number;
}) {
  return <input type="number" inputMode="decimal" value={Number.isFinite(value) ? value : ''}
    min={min} max={max} step={step}
    onChange={event => onChange(event.target.value === '' ? NaN : Number(event.target.value))} />;
}

function points(value: number) {
  return value >= 1e12 ? value.toExponential(3) : number(value, 2);
}

function trainingTime(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds)) return '—';
  if (seconds >= 365 * 86400) return '≈ ' + points(seconds / (365 * 86400)) + ' years';
  if (seconds >= 3600) {
    const wholeSeconds = Math.ceil(seconds), days = Math.floor(wholeSeconds / 86400);
    const hours = Math.floor(wholeSeconds % 86400 / 3600), minutes = Math.floor(wholeSeconds % 3600 / 60);
    const remainder = wholeSeconds % 60;
    return (days ? number(days) + 'd ' : '') + hours + 'h ' + minutes + 'm' + (remainder ? ' ' + remainder + 's' : '');
  }
  return duration(seconds);
}

export default function SkillTraining({ vocation, promoted }: { vocation: Vocation; promoted: boolean }) {
  const { character, server } = useApp();
  const [skill, setSkill] = useState<PhysicalSkill>(character.vocation === 'paladin' ? 'distance' : 'sword');
  const [drafts, setDrafts] = useState(() => initialDrafts(character));
  const [attackers, setAttackers] = useState<1 | 2 | 3>(1);
  const cycleSeconds = 2;
  const [skillRate, setSkillRate] = useState(server.skillRate ?? 1);
  useEffect(() => { setDrafts(initialDrafts(character)); }, [character.id, character.meleeSkill, character.distanceSkill, character.shieldingSkill]);
  useEffect(() => { setSkillRate(server.skillRate ?? 1); }, [server.id, server.skillRate]);

  const draft = drafts[skill];
  const selectedSkill = PHYSICAL_SKILLS.find(candidate => candidate.id === skill)!;
  const profileField = skill === 'distance' ? 'Distance' : skill === 'shielding' ? 'Shielding' : 'Melee';
  const edit = (patch: Partial<SkillDraft>) => setDrafts(previous => ({ ...previous, [skill]: { ...previous[skill], ...patch } }));
  let plan: ReturnType<typeof planSkillTraining> | null = null;
  let error = '';
  if (vocation !== 'unselected') {
    try {
      plan = planSkillTraining({
        vocation, promoted, skill, ...draft, attackers, cycleSeconds, skillRate,
        efficiencyPercent: 100, distancePointsPerShot: 2,
      });
      if (!plan) error = 'Enter whole attained and target skills from 10–200, a higher target, and valid progress and cadence values.';
    } catch (reason) {
      error = reason instanceof Error ? reason.message : 'The selected inputs cannot be calculated. Check the skill levels and training rates.';
    }
  }

  return <>
    <div className="grid-2">
      <section className="card">
        <div className="toolbar">
          <div className="item-with-sprite">
            {illustrations[skill] ? <ItemSprite name={illustrations[skill]} /> : <Hand size={27} />}
            <h2>Plan a skill goal</h2>
          </div>
          <Badge>Temporary preview</Badge>
        </div>
        <p className="muted">Set your attained skill and the percentage still needed for the next level. This classic 7.72 reconstruction gives a conditional best-case time.</p>
        <div className="form-grid">
          <Field label="Skill"><select value={skill} onChange={event => setSkill(event.target.value as PhysicalSkill)}>
            {PHYSICAL_SKILLS.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}
          </select></Field>
          <Field label="Current attained skill">
            <Numeric value={draft.currentLevel} onChange={currentLevel => edit({ currentLevel })} min={10} max={199} />
          </Field>
          <Field label="Percent remaining to next skill" hint="Enter the percentage still needed, rather than the percentage completed.">
            <Numeric value={draft.percentRemaining} onChange={percentRemaining => edit({ percentRemaining })} min={0} max={100} step={0.1} />
          </Field>
          <Field label="Target skill">
            <Numeric value={draft.targetLevel} onChange={targetLevel => edit({ targetLevel })} min={11} max={200} />
          </Field>
        </div>
        <button className="btn btn-ghost" onClick={() => edit(initialDraft(character, skill))}><RotateCcw size={14} />Use profile value: {profileField} {number(profileLevel(character, skill))}</button>
        <p className="muted">{profileField === 'Melee' ? 'Fist, club, sword and axe start from your profile’s shared Melee value. Set the actual skill here.' : 'The starting value comes from your character profile.'} These calculator inputs stay in this preview and do not change your saved skills.</p>
        {draft.percentRemaining === 0 && <Notice>A displayed 0% may be rounded. This preview treats it as zero remaining in the current step and keeps your attained skill unchanged.</Notice>}
      </section>

      <section className="card">
        <div className="toolbar"><h2>Continuous training setup</h2><Users size={20} /></div>
        <div className="form-grid">
          <Field label="Creatures attacking you" hint="Each is assumed to make one eligible melee attack per cycle.">
            <select value={attackers} onChange={event => setAttackers(Number(event.target.value) as 1 | 2 | 3)}>
              <option value={1}>1 creature</option><option value={2}>2 creatures</option><option value={3}>3 creatures</option>
            </select>
          </Field>
          <Field label="Classic attack cycle" hint="One outgoing attack and one melee attempt per selected creature every 2 seconds.">
            <input type="text" value="2 seconds" readOnly />
          </Field>
          <Field label="Server skill rate" hint={`${server.name} uses ×${number(server.skillRate ?? 1, 2)}. Editing here changes only this preview.`}>
            <Numeric value={skillRate} onChange={setSkillRate} min={0.01} max={1000} step={0.01} />
          </Field>
        </div>
        <p className="muted">Your character makes one outgoing attack each cycle. Additional attackers increase the shielding opportunity up to two; they do not speed up your weapon swings.</p>
        {skill === 'distance' && <Notice>Distance best case: every shot lands and grants two training points. Armor can still absorb the damage. Misses can award fewer points, so actual progress may be slower.</Notice>}
      </section>
    </div>

    {vocation === 'unselected' && <Notice>Choose a calculator vocation in the Training profile above to calculate physical skill advancement.</Notice>}
    {error && <Notice tone="warning">{error}</Notice>}

    <Notice><strong>Ideal time assumes active learning.</strong> You must periodically deal HP damage to keep skill progress active. One swing every 2 seconds alone does not guarantee progress, and every swing need not draw blood.</Notice>

    <div className="stat-grid">
      <Stat label="Training points to goal" value={plan ? points(plan.requiredTries) : '—'} detail="Base progress points, before your server multiplier" icon={<Target size={18} />} />
      <Stat label="Ideal continuous time" value={plan ? trainingTime(plan.idealSeconds) : '—'} detail="Every cycle remains eligible for skill progress" icon={<Clock3 size={18} />} tone="blue" />
      <Stat label="Progress ceiling per hour" value={plan ? points(plan.triesPerHour) : '—'} detail={`Credited points at ×${number(skillRate, 2)} skill rate`} icon={<TrendingUp size={18} />} tone="green" />
      <Stat label="Points to next skill" value={plan?.rows[0] ? points(plan.rows[0].remainingTries) : '—'} detail={`${number(draft.percentRemaining, 1)}% of your current step remains`} icon={<Shield size={18} />} />
    </div>

    <section className="card" style={{ marginBottom: 22 }}>
      <div className="toolbar"><h2>One, two or three attackers?</h2><Badge tone="blue">Same {selectedSkill.label.toLowerCase()} goal</Badge></div>
      <p className="muted">{skill === 'shielding'
        ? 'An equipped shield can earn progress from at most two eligible incoming checks per cycle. A third creature adds danger without increasing this ceiling.'
        : 'You still make one outgoing attack per cycle. More creatures attacking you do not shorten this skill’s ideal training time.'}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 12 }}>
        {([1, 2, 3] as const).map(count => {
          const comparison = plan?.attackerComparisons.find(row => row.attackers === count);
          return <section key={count} className="card" style={{ padding: 18, background: count === attackers ? '#f1f6eb' : '#fafbf7', borderColor: count === attackers ? '#a5b891' : undefined }}>
            <div className="toolbar"><h3 style={{ margin: 0 }}>{count} {count === 1 ? 'creature' : 'creatures'}</h3>{count === attackers && <Badge tone="success">Selected</Badge>}</div>
            <strong style={{ display: 'block', fontSize: 23, lineHeight: 1.3, margin: '8px 0', overflowWrap: 'anywhere' }}>{comparison ? trainingTime(comparison.idealSeconds) : '—'}</strong>
            <p className="muted" style={{ fontSize: 11, marginBottom: 12 }}>{comparison ? `${points(comparison.triesPerCycle)} base ${comparison.triesPerCycle === 1 ? 'point' : 'points'} per ${number(cycleSeconds, 2)}s cycle` : 'Choose valid inputs to compare.'}</p>
            {skill === 'shielding' && count >= 2 && <p style={{ fontSize: 11, marginBottom: 12 }}><strong>{count === 2 ? 'Shielding ceiling reached' : 'Same ceiling as two'}</strong></p>}
            <button className={count === attackers ? 'btn btn-secondary' : 'btn btn-ghost'} disabled={count === attackers} onClick={() => setAttackers(count)}>{count === attackers ? 'In this plan' : 'Use this setup'}</button>
          </section>;
        })}
      </div>
    </section>

    <div className="grid-2">
      <section className="card">
        <h2>What keeps attempts eligible?</h2>
        <p>This is a conditional training ceiling. Your outgoing attacks must periodically cause HP damage to refresh the shared learning allowance. A blood hit is not required on every swing or incoming attack.</p>
        <p>For shielding, keep a shield equipped and the creatures in melee range. The incoming hits can be blocked or absorbed without damaging you. Attack timing, positioning, missed shots and interruptions can reduce actual progress.</p>
        <p>When you also use a shield, extra incoming checks consume the learning allowance faster. You may need to cause HP damage more often to keep learning active, even when your weapon’s ideal training time is unchanged.</p>
        <p>For <strong>melee or fist training with a shield</strong>, the shared 30-point allowance covers roughly <strong>15 cycles / 30 seconds with one attacker</strong>, or <strong>10 cycles / 20 seconds with two or three</strong> in this setup. These are illustrative budget windows, not precise hit deadlines; the order of combat checks matters. These examples do not apply unchanged to ranged attacks.</p>
        <p className="muted">Promotion uses the same physical skill advancement curve as the base vocation in this reconstructed model. Regeneration and magic-level rates do not alter this calculation.</p>
      </section>
      <section className="card">
        <div className="toolbar"><h2>Level by level</h2><Badge>Base points</Badge></div>
        <p className="muted">The current step uses your remaining percentage. Later steps use the full requirement. Time includes the selected cadence and server skill rate.</p>
        <div className="table-wrap" style={{ maxHeight: 360, overflow: 'auto' }}>
          <table className="data-table"><thead><tr><th>Skill</th><th>Full step</th><th>Still needed</th><th>Ideal time</th></tr></thead>
            <tbody>{plan?.rows.map(row => <tr key={row.fromLevel}>
              <td>{row.fromLevel} → {row.toLevel}</td><td>{points(row.fullTries)}</td><td>{points(row.remainingTries)}</td><td>{trainingTime(row.idealSeconds)}</td>
            </tr>)}</tbody>
          </table>
        </div>
        {!plan && <p className="muted">Your per-level requirements will appear after you choose a vocation and valid inputs.</p>}
      </section>
    </div>

    <Evidence>
      <p><strong>{plan?.modelLabel || 'Classic 7.72 reconstruction estimate'}</strong>. These calculations use a documented reconstruction and explicit continuous-training assumptions. They do not certify identical behaviour on every 7.7 server.</p>
      {plan && <ul>{plan.assumptions.map(assumption => <li key={assumption}>{assumption}</li>)}</ul>}
      {SKILL_SOURCES.map(source => <p key={source.id}><External href={source.url}>{source.title}</External><br />{source.note}</p>)}
      <p>Fishing is excluded from this combat-cycle planner because its attempts do not follow the same attack cycle.</p>
    </Evidence>
  </>;
}
