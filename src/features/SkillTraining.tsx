import { useEffect, useState } from 'react';
import { Clock3, Hand, RotateCcw, Settings2, Shield, Swords } from 'lucide-react';
import { useApp } from '../context';
import ItemSprite from '../components/ItemSprite';
import { Badge, Evidence, External, Field, Notice, duration, number } from '../shared';
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
  const { character, server, navigate } = useApp();
  const [skill, setSkill] = useState<WeaponSkill>(character.vocation === 'paladin' ? 'distance' : 'sword');
  const [weaponGoals, setWeaponGoals] = useState(() => initialWeaponGoals(character));
  const [shieldGoal, setShieldGoal] = useState(() => initialGoal(character, 'shielding'));
  const [attackers, setAttackers] = useState<1 | 2>(2);
  const skillRate = server.skillRate ?? 1;
  useEffect(() => { setWeaponGoals(initialWeaponGoals(character)); setShieldGoal(initialGoal(character, 'shielding')); },
    [character.id, character.meleeSkill, character.axeSkill, character.swordSkill, character.clubSkill, character.fistSkill, character.distanceSkill, character.shieldingSkill]);
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
    <div className="training-intro"><div><h2>Train your weapon and shield together</h2><p className="muted">Set a goal for each skill. Both train during the same session.</p></div><div className="training-intro-tools"><Badge>Temporary preview</Badge><button className="text-button" onClick={() => navigate('settings')}><Settings2 size={14} />Server settings</button></div></div>
    <div className="grid-2">
      <section className="card training-goal-card">
        <div className="toolbar"><div className="item-with-sprite">{illustrations[skill] ? <ItemSprite name={illustrations[skill]} /> : <Hand size={26} />}<h2>Outgoing combat skill</h2></div><Swords size={19} /></div>
        <Field label="Weapon skill"><select value={skill} onChange={event => setSkill(event.target.value as WeaponSkill)}>{weaponSkills.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</select></Field>
        <p className="training-inline-note"><Clock3 size={14} /><span>One outgoing attack every <strong>2 seconds</strong>.</span></p>
        <GoalInputs label={selected.label.replace(' fighting', '').toLowerCase()} goal={weaponGoal} onChange={editWeapon} />
        <button className="btn btn-ghost" onClick={() => editWeapon(initialGoal(character, skill))}><RotateCcw size={14} />Use profile: {number(characterSkill(character, skill))}</button>
        <div className="training-goal-result"><span>{selected.label} goal</span><strong>{trainingTime(weapon?.idealSeconds)}</strong><small>{weapon ? `${points(weapon.requiredTries)} points · ${points(weapon.triesPerHour)} points/hour` : 'Choose valid goals to calculate.'}</small></div>
      </section>
      <section className="card training-goal-card">
        <div className="toolbar"><div className="item-with-sprite"><ItemSprite name="Wooden Shield" /><h2>Shielding alongside it</h2></div><Shield size={19} /></div>
        <Field label="Creatures attacking you" hint="Incoming melee attacks affect shielding only."><select value={attackers} onChange={event => setAttackers(Number(event.target.value) as 1 | 2)}><option value={1}>1 creature</option><option value={2}>2 creatures</option></select></Field>
        <p className="training-inline-note"><Shield size={14} /><span>Keep a shield equipped. Up to two eligible defenses per 2-second cycle.</span></p>
        <GoalInputs label="shielding" goal={shieldGoal} onChange={patch => setShieldGoal(previous => ({ ...previous, ...patch }))} />
        <button className="btn btn-ghost" onClick={() => setShieldGoal(initialGoal(character, 'shielding'))}><RotateCcw size={14} />Use profile: {number(character.shieldingSkill)}</button>
        <div className="training-goal-result"><span>Shielding goal</span><strong>{trainingTime(shielding?.idealSeconds)}</strong><small>{shielding ? `${points(shielding.requiredTries)} points · ${points(shielding.triesPerHour)} points/hour` : 'Choose valid goals to calculate.'}</small></div>
      </section>
    </div>
    {vocation === 'unselected' && <Notice>Choose a calculator vocation above to calculate both goals.</Notice>}
    {error && <Notice tone="warning">{error}</Notice>}
    <div className="training-assumptions">
      <p className="muted">Ideal times assume continuous training and periodic outgoing HP damage to keep learning active. Every swing need not draw blood.</p>
      {skill === 'distance' && <p className="muted">Distance assumes landed shots for two points per shot; misses can earn fewer. Train shielding with a shield-compatible setup.</p>}
      {(weaponGoal.percentRemaining === 0 || shieldGoal.percentRemaining === 0) && <p className="muted">A displayed 0% may be rounded. This preview treats it as zero remaining in that interval.</p>}
    </div>
    <div className="grid-2"><StepTable title={`${selected.label} steps`} plan={weapon} /><StepTable title="Shielding steps" plan={shielding} /></div>
    <Evidence>
      <p><strong>{weapon?.modelLabel || 'Classic 7.72 reconstruction estimate'}</strong>. Both goals use the same vocation and the saved server skill rate (×{number(skillRate, 2)}). Full two-second cycles are counted, with remaining progress applied separately to each goal. Promotion keeps the same physical advancement curves.</p>
      <p>The learning budget has 30 points and is refreshed by outgoing HP damage. Weapon probes and eligible shield probes consume it. More incoming checks can require more frequent HP-damaging hits even though weapon swing speed remains unchanged.</p>
      {SKILL_SOURCES.map(source => <p key={source.id}><External href={source.url}>{source.title}</External><br />{source.id === 'skill-cadence' ? 'The reconstruction defaults attack and defense intervals to 2,000 ms. This page uses that fixed cadence and assumes one incoming melee attempt per creature per cycle.' : source.note}</p>)}
      <p>Interruptions, positioning, and exhausted learning points can increase actual time. Preview changes do not overwrite saved skills. Fishing is separate, and individual servers can differ from this reconstruction.</p>
    </Evidence>
  </div>;
}
