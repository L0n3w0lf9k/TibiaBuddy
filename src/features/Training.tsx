import { useEffect, useState } from 'react';
import { Apple, ArrowRight, Clock3, Droplets, Save, Sparkles, Package, Settings2 } from 'lucide-react';
import { useApp } from '../context';
import { Badge, Evidence, External, Field, Notice, PageHeader, Stat, Tabs, duration, gp, number } from '../shared';
import type { Vocation } from '../types';
import { spells } from '../data/game';
import { FOODS, FOOD_SOURCES, SOURCES, VOCATIONS, characterStats, foodPlan, foodPlanSeconds, magicMultiplier, magicPlan,
  manaFluidPlan, regeneration } from '../domain/mechanics';
import { effectiveSpell, spellOverrideKey } from '../domain/spellCatalog';
import { runeBatchFromSpell } from '../domain/runeProduction';
import FoodComparison from '../components/FoodComparison';
import ItemSprite from '../components/ItemSprite';
import SpellEditor from '../components/SpellEditor';
import SpellSprite from '../components/SpellSprite';
import SkillTraining from './SkillTraining';
import './training-updates.css';

function Numeric({ value, onChange, min = 0, max, step = 1 }: {
  value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number | 'any';
}) {
  return <input type="number" inputMode="decimal" value={Number.isFinite(value) ? value : ''}
    onChange={event => onChange(event.target.value === '' ? NaN : Number(event.target.value))} min={min} max={max} step={step} />;
}
function quantity(value: number, digits = 0) {
  return value >= 1e10 ? value.toExponential(2) : number(value, digits);
}
function longDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return '—';
  if (seconds >= 365 * 24 * 3600) return quantity(seconds / (365 * 24 * 3600), 1) + ' years';
  if (seconds >= 24 * 3600) return number(Math.floor(seconds / 86400)) + 'd ' + duration(seconds % 86400);
  return duration(seconds);
}

function FoodView({ vocation, promoted }: { vocation: Vocation; promoted: boolean }) {
  const { server } = useApp();
  const [foodId, setFoodId] = useState('fish');
  const [hours, setHours] = useState(3);
  const [fedMinutes, setFedMinutes] = useState(0);
  const [price, setPrice] = useState<number | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const food = FOODS.find(item => item.id === foodId)!;
  const plan = foodPlan(food, hours, fedMinutes * 60, price);
  const regen = regeneration(vocation, promoted, server.regenerationRate);
  return <>
    <div className="grid-2">
      <section className="card">
        <div className="toolbar"><h2>Pack enough food</h2><Apple size={19} /></div>
        <p className="muted">Choose a food and the time you want to stay fed.</p>
        <div className="form-grid">
          <Field label="Food"><select value={foodId} onChange={e => { setFoodId(e.target.value); setPrice(null); }}>
            {FOODS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select></Field>
          <Field label="Planned time (hours)"><Numeric value={hours} onChange={setHours} max={1000} step={0.25} /></Field>
          <Field label="Already fed for (minutes)" hint="Your estimate of remaining nourishment, up to 20 minutes.">
            <Numeric value={fedMinutes} onChange={setFedMinutes} max={20} step={0.1} />
          </Field>
          <Field label="Your price per food (gp)" hint="Optional. Blank means no price is assumed.">
            <input type="number" min={0} step="any" value={price ?? ''} placeholder="Add a price"
              onChange={e => setPrice(e.target.value === '' ? null : Number(e.target.value))} />
          </Field>
        </div>
        {!plan && <Notice tone="warning">Enter a valid duration and nourishment between 0 and 20 minutes.</Notice>}
        <div className="stat-grid">
          <Stat label="Food to bring" value={plan ? number(plan.quantity) : '—'} detail={food.name} icon={<Package size={17} />} />
          <Stat label="Carried weight" value={plan ? number(plan.weight, 1) + ' oz' : '—'} detail={plan?.cost !== null && plan ? gp(plan.cost) : 'Add a price to calculate cost'} />
        </div>
        {plan && <p className="muted">Eat up to <strong>{number(plan.fillNow)}</strong> now to reach {duration(plan.fedAfterFillingSeconds)} of nourishment. The rest is for refilling as you play.</p>}
        <button className="btn" onClick={() => setCompareOpen(true)} disabled={!plan}><Apple size={16} />Compare food for these hours</button>
      </section>
      <section className="card">
        <div className="toolbar"><h2>While you stay fed</h2><Droplets size={19} /></div>
        <p className="muted">Food duration stays the same across vocations. Your regeneration rate changes.</p>
        <div className="stat-grid">
          <Stat label="Mana per hour" value={regen ? number(regen.manaPerHour) : '—'} detail={regen ? `${regen.manaAmount} mana / ${regen.manaEvery}s at the standard rate` : 'Choose a vocation above'} tone="blue" />
          <Stat label="HP per hour" value={regen ? number(regen.hpPerHour) : '—'} detail={regen ? `${regen.hpAmount} HP / ${regen.hpEvery}s at the standard rate` : 'Choose a vocation above'} tone="green" />
          <Stat label={`Mana from one ${food.name.toLowerCase()}`} value={regen ? '≈ ' + number(food.seconds * regen.manaPerSecond, 1) : '—'} detail={`${duration(food.seconds)} of nourishment`} />
          <Stat label="HP from one food" value={regen ? '≈ ' + number(food.seconds * regen.hpPerSecond, 1) : '—'} detail="Potential recovery before HP/mana caps" />
        </div>
        <p className="muted">These are fed, active-regeneration estimates. Mana at its cap cannot keep accumulating. Server regeneration: ×{number(server.regenerationRate, 2)}.</p>
      </section>
    </div>
    {compareOpen && <FoodComparison title={`${number(hours, 2)} hours of nourishment`} requiredSeconds={hours * 3600} alreadyFedSeconds={fedMinutes * 60} selectedFoodId={foodId}
      onSelect={id => { setFoodId(id); setPrice(null); }} onClose={() => setCompareOpen(false)} />}
    <Evidence><p>Food durations and weights use the early guide and legacy reference candidates. The 20-minute fullness rule and complete regeneration table remain reconstructed baseline values, rather than a claim that every field has an independent 7.7 measurement.</p>
      <p><External href={SOURCES.food}>Early food guide</External> · <External href={SOURCES.knight}>June 2006 knight regeneration fixture</External> · <External href={SOURCES.update}>Official 7.6 magic-system update</External></p>
      <p>No resting-area, stamina or modern reward bonuses are included. Fishing catch probabilities and Dough-to-Bread conversions are not included as verified game rules.</p>
      {FOOD_SOURCES.slice(1).map(source => <p key={source.url}><External href={source.url}>{source.title}</External> · {source.note}</p>)}
    </Evidence>
  </>;
}

function MagicView({ vocation, promoted }: { vocation: Vocation; promoted: boolean }) {
  const { character, server, update, notify } = useApp();
  const [current, setCurrent] = useState(character.magicLevel);
  const [remaining, setRemaining] = useState(character.magicPercentRemaining);
  const [target, setTarget] = useState(character.goalML);
  const [fluidMana, setFluidMana] = useState(100);
  const [fluidPrice, setFluidPrice] = useState(55);
  const [flaskRefund, setFlaskRefund] = useState(5);
  const [busy, setBusy] = useState(false);
  const [foodId, setFoodId] = useState('fish');
  const [compareOpen, setCompareOpen] = useState(false);
  useEffect(() => { setCurrent(character.magicLevel); setRemaining(character.magicPercentRemaining); setTarget(character.goalML); }, [character.id, character.magicLevel, character.magicPercentRemaining, character.goalML]);
  const plan = magicPlan({ current, remainingPercent: remaining, target, vocation, promoted,
    regenerationRate: server.regenerationRate, magicRate: server.magicRate });
  const fluids = plan ? manaFluidPlan(plan.mana, fluidMana, fluidPrice, flaskRefund) : null;
  const food = FOODS.find(item => item.id === foodId)!;
  const foodRecovery = plan ? foodPlanSeconds(food, plan.seconds) : null;
  async function save() {
    if (!plan || target <= current || busy) return;
    setBusy(true);
    try { await update(draft => {
      const saved = draft.characters.find(item => item.id === character.id);
      if (saved) { saved.magicLevel = current; saved.magicPercentRemaining = remaining; saved.goalML = target; }
    }); notify('Magic-level goal saved.'); }
    catch { notify('Could not save the goal. Please try again.', 'error'); }
    finally { setBusy(false); }
  }
  return <>
    <div className="grid-2">
      <section className="card">
        <div className="toolbar"><h2>Your next magic level</h2><Badge tone="blue">Estimate</Badge></div>
        <div className="form-grid">
          <Field label="Current attained magic level" hint="The magic level you already have, before your next advancement."><Numeric value={current} onChange={setCurrent} max={200} /></Field>
          <Field label="Percent remaining to next ML" hint="Use the percentage still needed, not the percentage completed."><Numeric value={remaining} onChange={setRemaining} max={100} step={0.1} /></Field>
          <Field label="Target magic level"><Numeric value={target} onChange={setTarget} max={200} /></Field>
        </div>
        {!plan && <Notice tone="warning">Choose a vocation and enter whole magic levels from 0–200, with 0–100% remaining.</Notice>}
        {plan && target <= current && <Notice>The target is already reached. Choose a higher target to save a new goal.</Notice>}
        {remaining === 0 && <p className="muted">A displayed 0% can be rounded. This preview treats it as zero remaining without advancing your saved ML.</p>}
        <button className="btn btn-primary" onClick={save} disabled={!plan || target <= current || busy}><Save size={16} />{busy ? 'Saving…' : 'Save ML goal'}</button>
        <p className="muted">Saving records the ML inputs. Calculator vocation and promotion are temporary previews.</p>
      </section>
      <section className="card">
        <h2>Training estimate</h2>
        <div className="stat-grid">
          <Stat label="Mana to target" value={plan ? '≈ ' + quantity(plan.mana) : '—'} detail="Mana actually spent at your server’s ML rate" icon={<Sparkles size={17} />} />
          <Stat label="Fed regeneration time" value={plan ? longDuration(plan.seconds) : '—'} detail="Assumes continuous spending and feeding" icon={<Clock3 size={17} />} />
          <Stat label={plan ? `Mana for ML ${number(current)} → ${number(current + 1)}` : 'Mana to the next ML'} value={plan ? '≈ ' + quantity(plan.remainingNextStepMana) : '—'} detail={plan ? `${number(remaining, 1)}% of ≈ ${quantity(plan.nextStepMana)} mana for the full step` : `${number(remaining, 1)}% remaining in the current step`} />
          <Stat label="Vocation growth factor" value={magicMultiplier(vocation) === null ? '—' : '×' + magicMultiplier(vocation)} detail={`Server magic progress ×${number(server.magicRate, 2)}`} />
        </div>
        <p className="muted">Promotion changes the regeneration time, not the vocation’s mana requirement. Food alone does not raise magic level.</p>
      </section>
    </div>
    <section className="card training-food-goal">
      <div><div className="item-with-sprite"><ItemSprite name={food.name} /><h2>Food for this magic-level goal</h2></div>
        <p className="muted">Cover the natural mana recovery needed for {number(current)} → {number(target)}. This assumes continuous feeding and mana spending; fluids are a separate budget.</p></div>
      <div className="training-food-selection"><Field label="Food for ML recovery"><select value={foodId} onChange={event => setFoodId(event.target.value)}>{FOODS.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></Field>
        <strong>{foodRecovery ? `${number(foodRecovery.quantity)} × ${food.name} · ${number(foodRecovery.weight, 2)} oz` : 'Choose a valid goal'}</strong>
        <button className="btn" onClick={() => setCompareOpen(true)} disabled={!foodRecovery || target <= current}><Apple size={16} />Compare food for ML recovery</button></div>
    </section>
    {compareOpen && plan && <FoodComparison title={`Magic level ${current} → ${target}: mana recovery`} requiredSeconds={plan.seconds} selectedFoodId={foodId} onSelect={setFoodId} onClose={() => setCompareOpen(false)} />}
    <div className="grid-2">
      <section className="card">
        <h2>Mana-fluid budget</h2>
        <p className="muted">Editable mana-fluid budget assumptions. Restoration is variable, so the count is a budget estimate.</p>
        <div className="form-grid">
          <Field label="Average mana per fluid"><Numeric value={fluidMana} onChange={setFluidMana} min={1} step="any" /></Field>
          <Field label="Purchase price (gp)"><Numeric value={fluidPrice} onChange={setFluidPrice} step="any" /></Field>
          <Field label="Flask refund (gp)"><Numeric value={flaskRefund} onChange={setFlaskRefund} step="any" /></Field>
        </div>
        <div className="stat-grid"><Stat label="Estimated fluids" value={fluids ? '≈ ' + quantity(fluids.count) : '—'} detail="No allowance for mana wasted at cap" />
          <Stat label="Net cost after refunds" value={fluids ? gp(fluids.net) : '—'} detail={fluids ? `${gp(fluids.gross)} paid; ${gp(fluids.refund)} returned` : 'Use a positive average and refund ≤ price'} /></div>
      </section>
      <section className="card">
        <h2>Step by step</h2>
        <div style={{ overflow: 'auto', maxHeight: 330 }}><table className="data-table"><thead><tr><th>Magic level</th><th>Still needed</th><th>Mana to spend</th></tr></thead>
          <tbody>{plan?.steps.map(step => <tr key={step.from}><td>{step.from} → {step.to}</td><td>{number(step.fraction * 100, 1)}%</td><td>≈ {quantity(step.mana)}</td></tr>)}</tbody></table></div>
        {plan?.steps.length === 0 && <p className="muted">No additional steps for this target.</p>}
      </section>
    </div>
    <Evidence>
      <p>The model uses 1,600 × vocation factor<sup>current attained ML</sup>, summing the remaining part of the current step and the full later steps. Your current ML is the level already attained: ML43 advances to ML44, using exponent 43. A table labelled by the level being reached puts that advancement on row 44.</p>
      <p>The formula is evaluated directly. Repeatedly rounding earlier spreadsheet rows accumulates a different total. Results remain estimates because client percentages can be rounded and classic server implementations can differ slightly in integer rounding. The June 2006 fixture is Knight ML3 → 4: 43,200 mana, or 36 fed hours at 2 mana / 6 seconds.</p>
      <p><External href={SOURCES.knight}>Contemporary knight fixture</External> · <External href={SOURCES.magic}>2006 formula discussion</External> · <External href={SOURCES.rounding}>Rounding uncertainty</External></p>
    </Evidence>
  </>;
}

const runeSpells = spells.filter(spell => spell.type === 'rune').sort((a, b) => a.name.localeCompare(b.name));

function RuneView({ vocation, promoted }: { vocation: Vocation; promoted: boolean }) {
  const { state, character, server, navigate } = useApp();
  const [recipeId, setRecipeId] = useState(character.vocation === 'sorcerer' ? 'heavy-magic-missile' : 'ultimate-healing-rune');
  const baseRecipe = runeSpells.find(spell => spell.id === recipeId) ?? runeSpells[0];
  const recipe = effectiveSpell(state, server.id, baseRecipe);
  const hasOverrides = Boolean(Object.keys(state.spellOverrides?.[spellOverrideKey(server.id, recipe.id)] ?? {}).length);
  const [editOpen, setEditOpen] = useState(false);
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState('backpacks');
  const [packSize, setPackSize] = useState(20);
  const [blanks, setBlanks] = useState(20);
  const [currentMana, setCurrentMana] = useState(0);
  const [maximumManaOverride, setMaximumManaOverride] = useState<number | null>(null);
  const [currentSoul, setCurrentSoul] = useState(promoted ? 200 : 100);
  const [foodId, setFoodId] = useState('fish');
  const [compareOpen, setCompareOpen] = useState(false);
  const [blankPrice, setBlankPrice] = useState<number | null>(null);
  const [foodPrice, setFoodPrice] = useState<number | null>(null);
  const [salePrice, setSalePrice] = useState<number | null>(null);
  const regen = regeneration(vocation, promoted, server.regenerationRate);
  const derived = characterStats(character.level, vocation);
  const maximumMana = maximumManaOverride ?? (vocation === character.vocation ? character.maxMana : undefined) ?? derived?.mana ?? 0;
  const objects = amount * (unit === 'backpacks' ? packSize : 1);
  const soulValid = Number.isFinite(currentSoul) && currentSoul >= 0 && currentSoul <= (promoted ? 200 : 100);
  const unitsValid = Number.isSafeInteger(amount) && amount >= 0 && amount <= 1000000 &&
    (unit !== 'backpacks' || Number.isSafeInteger(packSize) && packSize >= 1 && packSize <= 1000);
  const plan = regen && soulValid && unitsValid ? runeBatchFromSpell(recipe, {
    objects, currentMana, maximumMana, blankRunes: blanks, currentSoul, manaPerSecond: regen.manaPerSecond,
  }) : null;
  const food = FOODS.find(item => item.id === foodId)!;
  const foodRecovery = plan?.regenerationSeconds != null ? foodPlanSeconds(food, plan.regenerationSeconds) : null;
  const vocationFits = recipe.vocations === null ? null : vocation !== 'unselected' && recipe.vocations.includes(vocation);
  const levelFits = recipe.level === null ? null : character.level >= recipe.level;
  const vocationsText = recipe.vocations === null ? 'Vocation availability is unknown' : recipe.vocations.length
    ? recipe.vocations.map(v => VOCATIONS.find(item => item.id === v)?.name ?? v).join(', ') : 'Unavailable for creation';
  const materialBudget = plan && foodRecovery && blankPrice !== null && foodPrice !== null &&
    Number.isFinite(blankPrice) && Number.isFinite(foodPrice) && blankPrice >= 0 && foodPrice >= 0
    ? plan.objects * blankPrice + foodRecovery.quantity * foodPrice : null;
  const saleValue = plan && salePrice !== null && Number.isFinite(salePrice) && salePrice >= 0 ? plan.objects * salePrice : null;
  const soulLabel = recipe.soulCost === null ? 'Soul cost unknown' : recipe.soulCost === 0 ? 'No soul cost' : `${number(recipe.soulCost)} soul per cast`;
  return <>
    <div className="grid-2">
      <section className="card">
        <div className="toolbar"><h2>Plan a rune batch</h2><Badge tone={hasOverrides ? 'gold' : 'blue'}>{hasOverrides ? 'Server settings' : 'Reference estimate'}</Badge></div>
        <div className="form-grid">
          <Field label="Creation spell"><select value={baseRecipe.id} onChange={event => { setRecipeId(event.target.value); setSalePrice(null); }}>
            {runeSpells.map(spell => <option key={spell.id} value={spell.id}>{spell.name}</option>)}
          </select></Field>
          <Field label="Quantity"><Numeric value={amount} onChange={setAmount} max={1000000} /></Field>
          <Field label="Unit"><select value={unit} onChange={event => setUnit(event.target.value)}><option value="backpacks">Backpacks of rune items</option><option value="items">Individual rune items</option></select></Field>
          {unit === 'backpacks' && <Field label="Rune items per backpack"><Numeric value={packSize} onChange={setPackSize} min={1} max={1000} /></Field>}
        </div>
        <div className="rune-settings-summary"><div className="item-with-sprite"><SpellSprite spell={recipe} size={38} /><div><strong>{recipe.words}</strong>
          <p>{recipe.mana === null ? 'Mana unknown' : `${number(recipe.mana)} mana per cast`} · {recipe.runeCharges === null ? 'Charges unknown' : `${number(recipe.runeCharges)} charge${recipe.runeCharges === 1 ? '' : 's'} per rune`}<br />{soulLabel}</p></div></div>
          <button className="btn" onClick={() => setEditOpen(true)}><Settings2 size={15} />Edit rune settings</button></div>
        <p className="muted">Mana, charges and soul are shared with the spellbook and saved for <strong>{server.name}</strong>. They stay with this rune when you change selections.</p>
        <p className="muted">Creation reference: {recipe.level === null ? 'level unknown' : `level ${recipe.level}+`}; {vocationsText}. The spell must be learned{recipe.premium === true ? ' and requires premium' : ''}{recipe.promotion === true ? ' and promotion' : ''}.</p>
        {vocation !== 'unselected' && vocationFits === false && <Notice>This creation spell is outside the selected vocation’s settings. You can still inspect the batch or track these runes in stock.</Notice>}
        {levelFits === false && <Notice>Character level {character.level} is below this creation reference’s level {recipe.level}.</Notice>}
        {recipe.promotion === true && !promoted && <Notice>This spell’s reference requires promotion.</Notice>}
        {recipe.mana === null || recipe.runeCharges === null ? <Notice>Set this rune’s mana and charges in “Edit rune settings” to calculate a batch. Unknown values are kept unknown.</Notice> : null}
      </section>
      <section className="card">
        <h2>Available resources</h2>
        <div className="form-grid">
          <Field label="Blank rune items"><Numeric value={blanks} onChange={setBlanks} /></Field>
          <Field label="Mana currently available"><Numeric value={currentMana} onChange={setCurrentMana} max={maximumMana} /></Field>
          <Field label="Your maximum mana" hint="Blank uses your profile, or the level/vocation estimate for this preview."><input type="number" min={0} value={maximumManaOverride ?? ''} placeholder={String(maximumMana)} onChange={event => setMaximumManaOverride(event.target.value === '' ? null : Number(event.target.value))} /></Field>
          <Field label="Soul points currently available" hint={`Standard capacity: ${promoted ? 200 : 100}. A rune with 0 soul cost has no soul limit.`}><Numeric value={currentSoul} onChange={setCurrentSoul} max={promoted ? 200 : 100} /></Field>
        </div>
        {vocation === 'unselected' && <Notice>Choose a calculator vocation above to calculate recovery time.</Notice>}
        {!soulValid && <Notice tone="warning">Enter current soul from 0 to {promoted ? 200 : 100}.</Notice>}
        {!unitsValid && <Notice tone="warning">Use a whole quantity from 0–1,000,000 and a backpack size from 1–1,000.</Notice>}
        {regen && soulValid && unitsValid && recipe.mana !== null && recipe.runeCharges !== null && !plan && <Notice tone="warning">Check the resource inputs. Current mana cannot exceed maximum mana; totals must fit the calculator’s safe range.</Notice>}
        <p className="muted">The recovery estimate subtracts your current mana once. You must spend mana and refill food as you go to avoid losing regeneration at the mana cap.</p>
      </section>
    </div>
    {plan && <>
      <div className="stat-grid rune-production-stats">
        <Stat label="Rune items / casts" value={number(plan.objects)} detail={unit === 'backpacks' ? `${number(amount)} backpacks × ${number(packSize)} items` : 'One cast creates one rune item'} icon={<Package size={17} />} />
        <Stat label="Total charges" value={number(plan.charges)} detail={`${number(recipe.runeCharges!)} charges per rune item`} />
        <Stat label="Total mana spent" value={quantity(plan.mana)} detail={`${number(plan.casts)} casts × ${number(recipe.mana!)} mana`} icon={<Sparkles size={17} />} />
        <Stat label="Mana recovery time" value={longDuration(plan.regenerationSeconds)} detail={plan.capacityFits ? 'Fed regeneration; current mana deducted' : 'Maximum mana is too low for one cast'} icon={<Clock3 size={17} />} />
      </div>
      <section className="card training-food-goal">
        <div><div className="item-with-sprite"><ItemSprite name={food.name} /><h2>Food for this rune batch</h2></div><p className="muted">Cover this batch’s natural mana recovery at the selected vocation, promotion and server rate. Soul recovery and casting delays are separate.</p></div>
        <div className="training-food-selection"><Field label="Food for rune recovery"><select value={foodId} onChange={event => { setFoodId(event.target.value); setFoodPrice(null); }}>{FOODS.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></Field>
          <strong>{foodRecovery ? `${number(foodRecovery.quantity)} × ${food.name} · ${number(foodRecovery.weight, 2)} oz` : 'Maximum mana must cover one cast'}</strong>
          <button className="btn" disabled={!foodRecovery} onClick={() => setCompareOpen(true)}><Apple size={16} />Compare food for rune recovery</button></div>
      </section>
      <div className="grid-2">
        <section className="card">
          <h2>Resource coverage</h2>
          <div className="rune-resources-table"><table className="data-table"><thead><tr><th>Resource</th><th>Needed</th><th>Available</th><th>Result</th></tr></thead><tbody>
            <tr><td>Blank runes</td><td>{number(plan.objects)}</td><td>{number(blanks)}</td><td>{plan.blankShortfall ? `${number(plan.blankShortfall)} more needed` : 'Covered'}</td></tr>
            <tr><td>Mana for one cast</td><td>{number(recipe.mana!)}</td><td>{number(maximumMana)} maximum</td><td>{plan.capacityFits ? 'Fits maximum' : 'Maximum mana too low'}</td></tr>
            <tr><td>Soul points</td><td>{plan.soulNeeded === null ? 'Unknown' : number(plan.soulNeeded)}</td><td>{number(currentSoul)}</td><td>{recipe.soulCost === 0 ? 'No soul required' : plan.soulShortfall === null ? 'Set soul cost to check' : plan.soulShortfall ? `${number(plan.soulShortfall)} more needed` : 'Covered'}</td></tr>
          </tbody></table></div>
          <p className="muted">{recipe.soulCost === 0 ? 'This rune has no soul cost in the selected server settings.' : plan.availableSoulCasts === null ? 'Soul cost is unknown. Set it in rune settings to check coverage.' : `Your current soul covers ${number(plan.availableSoulCasts)} casts. Further soul requires qualifying activity.`} Planning never adds finished runes to stock.</p>
          <button className="btn" onClick={() => navigate('supplies')}>Record actual production in stock <ArrowRight size={16} /></button>
        </section>
        <section className="card">
          <h2>Optional batch budget</h2>
          <p className="muted">Use your own prices for blank runes and food during natural mana recovery.</p>
          <div className="form-grid">
            <Field label="Blank rune price (gp each)"><input type="number" min={0} step="any" placeholder="Enter a price" value={blankPrice ?? ''} onChange={event => setBlankPrice(event.target.value === '' ? null : Number(event.target.value))} /></Field>
            <Field label={`${food.name} price (gp each)`}><input type="number" min={0} step="any" placeholder="Enter a price" value={foodPrice ?? ''} onChange={event => setFoodPrice(event.target.value === '' ? null : Number(event.target.value))} /></Field>
            <Field label="Selling price per rune item (gp)" hint="Price for one rune item with all its charges, not one use."><input type="number" min={0} step="any" placeholder="Optional" value={salePrice ?? ''} onChange={event => setSalePrice(event.target.value === '' ? null : Number(event.target.value))} /></Field>
          </div>
          <div className="stat-grid">
            <Stat label="Materials budget" value={materialBudget === null ? '—' : gp(materialBudget)} detail="Blank runes + food; add both prices to calculate" />
            <Stat label="Planned sale value" value={saleValue === null ? '—' : gp(saleValue)} detail={`${number(plan.objects)} rune items`} />
            <Stat label="Margin over materials" value={materialBudget === null || saleValue === null ? '—' : gp(saleValue - materialBudget)} detail="Before fluids, learning fees, travel or other costs" />
          </div>
        </section>
      </div>
    </>}
    {compareOpen && plan?.regenerationSeconds != null && <FoodComparison title={`${number(plan.objects)} ${recipe.name} items: mana recovery`} requiredSeconds={plan.regenerationSeconds} selectedFoodId={foodId}
      onSelect={id => { setFoodId(id); setFoodPrice(null); }} onClose={() => setCompareOpen(false)} />}
    {editOpen && <SpellEditor spell={baseRecipe} onClose={() => setEditOpen(false)} />}
    <Evidence>
      <p>Creation requirements and charge counts use the labelled 7.72 reconstruction catalogue. Ultimate Healing starts at the requested 420-mana baseline; the linked reconstruction lists 400. Your server-specific settings take precedence in every batch result.</p>
      <p>Rune items, charges, casts and backpack capacity remain separate. One cast is modelled as one rune item. Maximum mana is estimated assuming vocation selection at level 8 unless you enter an actual value.</p>
      <p>The mana recovery time is a resource estimate, not a complete production timer: spell delays, interruptions and qualifying soul recovery can add time. A known soul cost of zero removes the soul constraint; an unknown cost does not.</p>
      <p><External href={baseRecipe.sourceUrl}>Selected rune reference</External> · <External href={SOURCES.soul}>Soul mechanics reference</External></p>
    </Evidence>
  </>;
}

function trainingTabFromHash() {
  const section = window.location.hash.replace(/^#\/?/, '').split('/')[1];
  return ['food', 'skills', 'magic', 'runes'].includes(section) ? section : 'food';
}

export default function Training() {
  const { character, server, openProfile, navigate } = useApp();
  const [tab, setTab] = useState(trainingTabFromHash);
  const [vocation, setVocation] = useState<Vocation>(character.vocation);
  const [promoted, setPromoted] = useState(character.promoted);
  useEffect(() => { setVocation(character.vocation); setPromoted(character.promoted); }, [character.id, character.vocation, character.promoted]);
  useEffect(() => {
    const syncTab = () => setTab(trainingTabFromHash());
    window.addEventListener('hashchange', syncTab);
    return () => window.removeEventListener('hashchange', syncTab);
  }, []);
  const preview = vocation !== character.vocation || promoted !== character.promoted;
  const mage = vocation === 'sorcerer' || vocation === 'druid';
  return <>
    <PageHeader eyebrow="PROGRESS & PREPARATION" title="Training" description="Plan physical skills, food, magic levels and rune supplies." actions={<button className="btn" onClick={openProfile}>Character profile</button>} />
    <section className="card">
      <div className="toolbar"><h2>Training profile</h2><Badge tone={preview ? 'blue' : 'muted'}>{preview ? 'Temporary preview' : character.name}</Badge></div>
      <div className="form-grid">
        <Field label="Calculator vocation"><select value={vocation} onChange={e => setVocation(e.target.value as Vocation)}>
          <option value="unselected">Choose vocation</option>{VOCATIONS.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}
        </select></Field>
        <Field label="Promotion"><select value={promoted ? 'yes' : 'no'} onChange={e => setPromoted(e.target.value === 'yes')}><option value="no">Not promoted</option><option value="yes">Promoted</option></select></Field>
      </div>
      <p className="muted">{server.name} · Regeneration ×{number(server.regenerationRate, 2)} · Magic progress ×{number(server.magicRate, 2)} · Skill progress ×{number(server.skillRate ?? 1, 2)}{preview ? ' · Preview changes do not alter your saved character.' : ''}</p>
    </section>
    <Tabs tabs={[{ id: 'food', label: 'Food & regeneration' }, { id: 'skills', label: 'Physical skills' }, { id: 'magic', label: 'Magic level' }, { id: 'runes', label: mage ? 'Rune production' : 'Rune production · optional' }]} value={tab} onChange={selected => { setTab(selected); navigate('training/' + selected); }} />
    {tab === 'food' && <FoodView key={character.id} vocation={vocation} promoted={promoted} />}
    {tab === 'skills' && <SkillTraining key={character.id} vocation={vocation} promoted={promoted} />}
    {tab === 'magic' && <MagicView key={character.id} vocation={vocation} promoted={promoted} />}
    {tab === 'runes' && <RuneView key={character.id} vocation={vocation} promoted={promoted} />}
  </>;
}
