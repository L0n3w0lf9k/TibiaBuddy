import { useEffect, useState } from 'react';
import { Clock3, Hand, RotateCcw, Shield, Swords, Target, Users } from 'lucide-react';
import { useApp } from '../context';
import ItemSprite from '../components/ItemSprite';
import { Badge, Evidence, External, Field, Notice, Stat, duration, number } from '../shared';
import { PHYSICAL_SKILLS, SKILL_SOURCES, type SkillTrainingPlan } from '../domain/skills';
import { characterSkill } from '../domain/characterSkills';
import { simultaneousSkillTraining, type TrainingGoal, type WeaponSkill } from '../domain/trainingPlans';
import type { Character, Vocation } from '../types';

const weaponSkills = PHYSICAL_SKILLS.filter(skill => skill.id !== 'shielding');
const illustrations: Partial<Record<WeaponSkill, string>> = { axe: 'Axe', sword: 'Sword', club: 'Club', distance: 'Bow' };
function initialGoal(character: Character, skill: WeaponSkill | 'shielding'): TrainingGoal {
  const currentLevel = characterSkill(character, skill);
  return { currentLevel, percentRemaining: 100, targetLevel: Math.min(200, currentLevel + 1) };
}
function initialWeaponGoals(character: Character) {
  return Object.fromEntries(weaponSkills.map(skill => [skill.id, initialGoal(character, skill.id as WeaponSkill)])) as Record<WeaponSkill, TrainingGoal>;
}
function Numeric({ value, onChange, min, max, step = 1 }: { value: number; onChange: (value: number) => void; min: number; max: number; step?: number }) {
  return <input type="number" inputMode="decimal" value={Number.isFinite(value) ? value : ''} min={min} max={max} step={step}
    onChange={event => onChange(event.target.value === '' ? NaN : Number(event.target.value))} />;
}
function points(value: number) { return value >= 1e12 ? value.toExponential(3) : number(value, 2); }
function trainingTime(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds)) return '—';
  if (seconds >= 365 * 86400) return '≈ ' + points(seconds / (365 * 86400)) + ' years';
  const whole = Math.ceil(seconds), days = Math.floor(whole / 86400), hours = Math.floor(whole % 86400 / 3600), minutes = Math.floor(whole % 3600 / 60), remainder = whole % 60;
  return whole < 3600 ? duration(whole) : (days ? number(days) + 'd ' : '') + hours + 'h ' + minutes + 'm' + (remainder ? ' ' + remainder + 's' : '');
}
function GoalInputs({ label, goal, onChange }: { label: string; goal: TrainingGoal; onChange: (patch: Partial<TrainingGoal>) => void }) {
  return <div className="form-grid training-goal-fields">
    <Field label={`Current ${label} skill`}><Numeric value={goal.currentLevel} onChange={currentLevel => onChange({ currentLevel })} min={10} max={199} /></Field>
    <Field label={`${label} percent remaining`} hint="The percentage still needed for the next skill."><Numeric value={goal.percentRemaining} onChange={percentRemaining => onChange({ percentRemaining })} min={0} max={100} step={0.1} /></Field>
    <Field label={`Target ${label} skill`}><Numeric value={goal.targetLevel} onChange={targetLevel => onChange({ targetLevel })} min={11} max={200} /></Field>
  </div>;
}
function StepTable({ title, plan }: { title: string; plan: SkillTrainingPlan | null }) {
  return <section className="card"><div className="toolbar"><h2>{title}</h2><Badge>Base points</Badge></div>
    <div className="training-step-scroll"><table className="data-table"><thead><tr><th>Skill</th><th>Full step</th><th>Still needed</th><th>Ideal time</th></tr></thead><tbody>
      {plan?.rows.map(row => <tr key={row.fromLevel}><td>{row.fromLevel} → {row.toLevel}</td><td>{points(row.fullTries)}</td><td>{points(row.remainingTries)}</td><td>{trainingTime(row.idealSeconds)}</td></tr>)}
    </tbody></table></div>{!plan && <p className="muted">Set valid goals and a vocation to see the steps.</p>}
  </section>;
}

export default function SkillTraining({ vocation, promoted }: { vocation: Vocation; promoted: boolean }) {
  const { character, server } = useApp();
  const [skill, setSkill] = useState<WeaponSkill>(character.vocation === 'paladin' ? 'distance' : 'sword');
  const [weaponGoals, setWeaponGoals] = useState(() => initialWeaponGoals(character));
  const [shieldGoal, setShieldGoal] = useState(() => initialGoal(character, 'shielding'));
  const [attackers, setAttackers] = useState<1 | 2 | 3>(2);
  const [skillRate, setSkillRate] = useState(server.skillRate ?? 1);
  useEffect(() => { setWeaponGoals(initialWeaponGoals(character)); setShieldGoal(initialGoal(character, 'shielding')); },
    [character.id, character.meleeSkill, character.axeSkill, character.swordSkill, character.clubSkill, character.fistSkill, character.distanceSkill, character.shieldingSkill]);
  useEffect(() => setSkillRate(server.skillRate ?? 1), [server.id, server.skillRate]);
  const weaponGoal = weaponGoals[skill];
  const selected = weaponSkills.find(item => item.id === skill)!;
  const editWeapon = (patch: Partial<TrainingGoal>) => setWeaponGoals(previous => ({ ...previous, [skill]: { ...previous[skill], ...patch } }));
  let combined: ReturnType<typeof simultaneousSkillTraining> | null = null;
  let error = '';
  if (vocation !== 'unselected') {
    try { combined = simultaneousSkillTraining({ vocation, promoted, skill, weapon: weaponGoal, shielding: shieldGoal, attackers, skillRate }); }
    catch (reason) { error = reason instanceof Error ? reason.message : 'Check both skill goals and the server rate.'; }
  }
  const weapon = combined?.weapon ?? null, shielding = combined?.shielding ?? null;
  return <div className="training-updates">
    <div className="training-intro"><div><h2>Train your weapon and shield together</h2><p className="muted">Two independent goals, one session. Outgoing attacks train your combat skill while incoming melee attacks train shielding.</p></div><Badge>Temporary preview</Badge></div>
    <div className="grid-2">
      <section className="card training-goal-card">
        <div className="toolbar"><div className="item-with-sprite">{illustrations[skill] ? <ItemSprite name={illustrations[skill]} /> : <Hand size={26} />}<h2>Outgoing combat skill</h2></div><Swords size={19} /></div>
        <Field label="Weapon skill"><select value={skill} onChange={event => setSkill(event.target.value as WeaponSkill)}>{weaponSkills.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</select></Field>
        <GoalInputs label={selected.label.replace(' fighting', '').toLowerCase()} goal={weaponGoal} onChange={editWeapon} />
        <button className="btn btn-ghost" onClick={() => editWeapon(initialGoal(character, skill))}><RotateCcw size={14} />Use profile: {number(characterSkill(character, skill))}</button>
        <p className="muted">Each weapon keeps its own preview inputs. The starting value comes from that skill in your character profile.</p>
        <div className="training-goal-result"><span>{selected.label} goal</span><strong>{trainingTime(weapon?.idealSeconds)}</strong><small>{weapon ? `${points(weapon.requiredTries)} points · ${points(weapon.triesPerHour)} points/hour` : 'Choose valid goals to calculate.'}</small></div>
      </section>
      <section className="card training-goal-card">
        <div className="toolbar"><div className="item-with-sprite"><ItemSprite name="Wooden Shield" /><h2>Shielding alongside it</h2></div><Shield size={19} /></div>
        <p className="muted">Set your actual shielding progress and target separately from your weapon skill. Keep a shield equipped.</p>
        <GoalInputs label="shielding" goal={shieldGoal} onChange={patch => setShieldGoal(previous => ({ ...previous, ...patch }))} />
        <button className="btn btn-ghost" onClick={() => setShieldGoal(initialGoal(character, 'shielding'))}><RotateCcw size={14} />Use profile: {number(character.shieldingSkill)}</button>
        <div className="training-goal-result"><span>Shielding goal</span><strong>{trainingTime(shielding?.idealSeconds)}</strong><small>{shielding ? `${points(shielding.requiredTries)} points · ${points(shielding.triesPerHour)} points/hour` : 'Choose valid goals to calculate.'}</small></div>
      </section>
    </div>
    <section className="card"><div className="toolbar"><h2>Shared training session</h2><Users size={20} /></div>
      <div className="form-grid">
        <Field label="Creatures attacking you" hint="Changes shielding opportunities; your outgoing attack rate stays the same."><select value={attackers} onChange={event => setAttackers(Number(event.target.value) as 1 | 2 | 3)}><option value={1}>1 creature</option><option value={2}>2 creatures</option><option value={3}>3 creatures</option></select></Field>
        <Field label="Classic attack cycle" hint="One outgoing attack every 2 seconds; each creature makes one melee attempt in that cycle."><input type="text" value="2 seconds" readOnly /></Field>
        <Field label="Server skill rate" hint={`${server.name}: ×${number(server.skillRate ?? 1, 2)}. Changes here are a temporary preview.`}><Numeric value={skillRate} onChange={setSkillRate} min={0.01} max={1000} step={0.01} /></Field>
      </div>
      <Notice><strong>Active learning is required.</strong> Periodically deal HP damage to refresh the shared learning allowance. Every swing need not draw blood. Shielding counts at most two eligible defenses per cycle, so a third creature does not speed up shielding.</Notice>
      {skill === 'distance' && <p className="muted">Distance assumes every shot lands, granting two training points while learning is active. Armor may absorb HP damage; misses can award fewer points. Use a shield-compatible setup to train shielding alongside it.</p>}
      {(weaponGoal.percentRemaining === 0 || shieldGoal.percentRemaining === 0) && <p className="muted">A displayed 0% may be rounded. This preview treats it as zero remaining in that interval without changing the attained skill.</p>}
    </section>
    {vocation === 'unselected' && <Notice>Choose a calculator vocation above to calculate both goals.</Notice>}
    {error && <Notice tone="warning">{error}</Notice>}
    <div className="stat-grid training-combined-stats">
      <Stat label={`${selected.label} target`} value={trainingTime(weapon?.idealSeconds)} detail={`${number(weaponGoal.currentLevel)} → ${number(weaponGoal.targetLevel)} · one outgoing attack per cycle`} icon={<Target size={18} />} />
      <Stat label="Shielding target" value={trainingTime(shielding?.idealSeconds)} detail={`${number(shieldGoal.currentLevel)} → ${number(shieldGoal.targetLevel)} · ${Math.min(attackers, 2)} eligible shield checks per cycle`} icon={<Shield size={18} />} />
      <Stat label="Time until both goals" value={trainingTime(combined?.bothGoalsSeconds)} detail="The longer goal determines the session; these times are not added." icon={<Clock3 size={18} />} tone="green" />
    </div>
    <section className="card"><div className="toolbar"><h2>Compare incoming attackers</h2><Badge>Same two goals</Badge></div>
      <p className="muted">Your weapon goal keeps the same time in all three setups. Shielding can progress twice as fast with two attackers, then reaches its defense ceiling.</p>
      <div className="training-attacker-grid">{([1, 2, 3] as const).map(count => {
        const comparison = combined?.attackers.find(item => item.attackers === count);
        return <section className={'training-attacker-card ' + (count === attackers ? 'selected' : '')} key={count}>
          <div className="toolbar"><h3>{count} {count === 1 ? 'creature' : 'creatures'}</h3>{count === attackers && <Badge>Selected</Badge>}</div>
          <dl><div><dt>{selected.label}</dt><dd>{trainingTime(comparison?.weaponSeconds)}</dd></div><div><dt>Shielding</dt><dd>{trainingTime(comparison?.shieldingSeconds)}</dd></div><div className="training-combined-line"><dt>Both goals</dt><dd>{trainingTime(comparison?.bothGoalsSeconds)}</dd></div></dl>
          <p className="muted">{count === 1 ? 'One eligible shield check per cycle.' : count === 2 ? 'Two eligible checks: shielding ceiling.' : 'Same shielding ceiling as two creatures.'}</p>
          <button className="btn" disabled={count === attackers} onClick={() => setAttackers(count)}>{count === attackers ? 'In this plan' : 'Use this setup'}</button>
        </section>;
      })}</div>
    </section>
    <div className="grid-2"><StepTable title={`${selected.label} steps`} plan={weapon} /><StepTable title="Shielding steps" plan={shielding} /></div>
    <p className="muted">Promotion keeps the same physical advancement curves. These are continuous-training estimates; positioning, interruptions, and an exhausted learning allowance can increase actual time. Calculator changes do not overwrite your saved skills.</p>
    <Evidence>
      <p><strong>{weapon?.modelLabel || 'Classic 7.72 reconstruction estimate'}</strong>. Both goals use the same vocation and server skill rate. Full attack cycles are counted, with remaining progress applied separately to each goal.</p>
      <p>The learning budget has 30 points and is refreshed by outgoing HP damage. Weapon probes and eligible shield probes consume it. More incoming checks can require more frequent HP-damaging hits even though weapon swing speed remains unchanged.</p>
      {SKILL_SOURCES.map(source => <p key={source.id}><External href={source.url}>{source.title}</External><br />{source.note}</p>)}
      <p>Fishing is not part of this combat-cycle planner. Exact behavior on a particular server can differ from the reconstruction.</p>
    </Evidence>
  </div>;
}
