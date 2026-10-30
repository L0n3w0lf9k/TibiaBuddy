import { useEffect, useState } from 'react';
import { Apple, ArrowRight, Clock3, Droplets, Save, Sparkles, Package } from 'lucide-react';
import { useApp } from '../context';
import { Badge, Evidence, External, Field, Notice, PageHeader, Stat, Tabs, duration, gp, number } from '../shared';
import type { Vocation } from '../types';
import { spells } from '../data/game';
import { FOODS, RUNE_RECIPES, SOURCES, VOCATIONS, characterStats, foodPlan, magicMultiplier, magicPlan,
  manaFluidPlan, regeneration, runePlan } from '../domain/mechanics';

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
    <section className="card">
      <h2>Compare food</h2>
      <div style={{ overflowX: 'auto' }}><table className="data-table"><thead><tr>
        <th>Food</th><th>Lasts</th><th>Weight</th><th>Minutes / oz</th><th>Potential mana</th><th></th>
      </tr></thead><tbody>{FOODS.map(item => <tr key={item.id}>
        <td><strong>{item.name}</strong></td><td>{duration(item.seconds)}</td><td>{number(item.weight, 1)} oz</td>
        <td>{number(item.seconds / 60 / item.weight, 1)}</td><td>{regen ? '≈ ' + number(item.seconds * regen.manaPerSecond, 1) : '—'}</td>
        <td><button className="btn" onClick={() => { setFoodId(item.id); setPrice(null); }} disabled={foodId === item.id}>{foodId === item.id ? 'Selected' : 'Use food'}</button></td>
      </tr>)}</tbody></table></div>
    </section>
    <Evidence><p>Food durations and weights use the early guide and legacy reference candidates. The 20-minute fullness rule and complete regeneration table remain reconstructed baseline values, rather than a claim that every field has an independent 7.7 measurement.</p>
      <p><External href={SOURCES.food}>Early food guide</External> · <External href={SOURCES.knight}>June 2006 knight regeneration fixture</External> · <External href={SOURCES.update}>Official 7.6 magic-system update</External></p>
      <p>No resting-area, stamina or modern reward bonuses are included. Fishing catch probabilities and Dough-to-Bread conversions are not included as verified game rules.</p>
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
  useEffect(() => { setCurrent(character.magicLevel); setRemaining(character.magicPercentRemaining); setTarget(character.goalML); }, [character.id, character.magicLevel, character.magicPercentRemaining, character.goalML]);
  const plan = magicPlan({ current, remainingPercent: remaining, target, vocation, promoted,
    regenerationRate: server.regenerationRate, magicRate: server.magicRate });
  const fluids = plan ? manaFluidPlan(plan.mana, fluidMana, fluidPrice, flaskRefund) : null;
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
          <Field label="Current attained magic level"><Numeric value={current} onChange={setCurrent} max={200} /></Field>
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
          <Stat label="Mana to the next ML" value={plan ? '≈ ' + quantity(plan.remainingNextStepMana) : '—'} detail={`${number(remaining, 1)}% remaining in the current step`} />
          <Stat label="Vocation growth factor" value={magicMultiplier(vocation) === null ? '—' : '×' + magicMultiplier(vocation)} detail={`Server magic progress ×${number(server.magicRate, 2)}`} />
        </div>
        <p className="muted">Promotion changes the regeneration time, not the vocation’s mana requirement. Food alone does not raise magic level.</p>
      </section>
    </div>
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
      <p>The model uses 1,600 × vocation factor<sup>current attained ML</sup>, summing the remaining part of the current step and the full later steps. It evaluates the formula directly; it does not repeatedly round earlier spreadsheet rows.</p>
      <p>Historic integer rounding remains unresolved. Results are estimates, including when the displayed answer rounds to a whole mana point. The June 2006 fixture is Knight ML3 → 4: 43,200 mana, or 36 fed hours at 2 mana / 6 seconds.</p>
      <p><External href={SOURCES.knight}>Contemporary knight fixture</External> · <External href={SOURCES.magic}>2006 formula discussion</External> · <External href={SOURCES.rounding}>Rounding uncertainty</External></p>
    </Evidence>
  </>;
}

function recipeWithSoul(id: string) {
  const recipe = RUNE_RECIPES.find(item => item.id === id)!;
  const reference = spells.find(spell => spell.words.toLowerCase() === recipe.words);
  return { ...recipe, soul: reference?.soulCost ?? recipe.soul };
}

function RuneView({ vocation, promoted }: { vocation: Vocation; promoted: boolean }) {
  const { character, server, navigate } = useApp();
  const [recipeId, setRecipeId] = useState(character.vocation === 'sorcerer' ? 'hmm' : 'uh');
  const recipe = recipeWithSoul(recipeId);
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState('backpacks');
  const [packSize, setPackSize] = useState(20);
  const [blanks, setBlanks] = useState(20);
  const [currentMana, setCurrentMana] = useState(0);
  const [manaOverride, setManaOverride] = useState<number | null>(null);
  const [currentSoul, setCurrentSoul] = useState(promoted ? 200 : 100);
  const [soulOverride, setSoulOverride] = useState<number | null>(null);
  const [foodId, setFoodId] = useState('fish');
  const [blankPrice, setBlankPrice] = useState<number | null>(null);
  const [foodPrice, setFoodPrice] = useState<number | null>(null);
  const [salePrice, setSalePrice] = useState<number | null>(null);
  const regen = regeneration(vocation, promoted, server.regenerationRate);
  const derived = characterStats(character.level, vocation);
  const maximumMana = manaOverride ?? (vocation === character.vocation ? character.maxMana : undefined) ?? derived?.mana ?? 0;
  const soulCost = soulOverride ?? recipe.soul;
  const objects = amount * (unit === 'backpacks' ? packSize : 1);
  const plan = regen ? runePlan({ objects, manaPerCast: recipe.mana, chargesPerObject: recipe.charges,
    currentMana, maximumMana, blankRunes: blanks, soulPerCast: soulCost, currentSoul,
    manaPerSecond: regen.manaPerSecond }) : null;
  const food = FOODS.find(item => item.id === foodId)!;
  const foodNeeded = plan?.regenerationSeconds !== null && plan?.regenerationSeconds !== undefined ? Math.ceil(plan.regenerationSeconds / food.seconds) : null;
  const vocationFits = vocation !== 'unselected' && recipe.vocations.includes(vocation);
  const levelFits = character.level >= recipe.level;
  const soulValid = Number.isFinite(currentSoul) && currentSoul >= 0 && currentSoul <= (promoted ? 200 : 100);
  const unitsValid = Number.isInteger(amount) && amount >= 0 && Number.isInteger(packSize) && packSize >= 1;
  const materialBudget = plan && foodNeeded !== null && blankPrice !== null && foodPrice !== null &&
    Number.isFinite(blankPrice) && Number.isFinite(foodPrice) && blankPrice >= 0 && foodPrice >= 0
    ? plan.objects * blankPrice + foodNeeded * foodPrice : null;
  const saleValue = plan && salePrice !== null && Number.isFinite(salePrice) && salePrice >= 0 ? plan.objects * salePrice : null;
  return <>
    <div className="grid-2">
      <section className="card">
        <div className="toolbar"><h2>Plan a rune batch</h2><Badge tone="blue">Reference estimate</Badge></div>
        <div className="form-grid">
          <Field label="Creation spell"><select value={recipeId} onChange={e => { setRecipeId(e.target.value); setSoulOverride(null); setSalePrice(null); }}>
            {RUNE_RECIPES.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select></Field>
          <Field label="Quantity"><Numeric value={amount} onChange={setAmount} max={1000000} /></Field>
          <Field label="Unit"><select value={unit} onChange={e => setUnit(e.target.value)}><option value="backpacks">Backpacks of rune items</option><option value="items">Individual rune items</option></select></Field>
          {unit === 'backpacks' && <Field label="Rune items per backpack"><Numeric value={packSize} onChange={setPackSize} min={1} max={1000} /></Field>}
        </div>
        <p><strong>{recipe.words}</strong> · {recipe.mana} mana per cast · {recipe.charges} charge{recipe.charges === 1 ? '' : 's'} per rune item</p>
        <p className="muted">Creation reference: level {recipe.level}+; {recipe.vocations.map(v => VOCATIONS.find(item => item.id === v)?.name).join(', ')}. Spell learning must also be satisfied.</p>
        {vocation !== 'unselected' && !vocationFits && <Notice>This creation spell is outside the selected vocation’s reference list. You can still inspect the batch or track these runes in stock.</Notice>}
        {!levelFits && <Notice>Character level {character.level} is below this creation reference’s level {recipe.level}.</Notice>}
      </section>
      <section className="card">
        <h2>Available resources</h2>
        <div className="form-grid">
          <Field label="Blank rune items"><Numeric value={blanks} onChange={setBlanks} /></Field>
          <Field label="Current mana"><Numeric value={currentMana} onChange={setCurrentMana} max={maximumMana || undefined} /></Field>
          <Field label="Maximum mana" hint={manaOverride === null && !character.maxMana ? 'Estimated from level and vocation; adjust if your actual maximum differs.' : 'The maximum must cover one complete cast.'}>
            <Numeric value={maximumMana} onChange={setManaOverride} min={1} />
          </Field>
          <Field label="Current soul"><Numeric value={currentSoul} onChange={setCurrentSoul} max={promoted ? 200 : 100} /></Field>
          <Field label="Soul per cast" hint={recipe.soul === null ? 'Unknown in the reference. Enter your server’s value to finish the resource check.' : 'Reference value; edit for your server.'}>
            <input type="number" value={soulCost ?? ''} min={1} step={1} placeholder="Enter soul cost"
              onChange={e => setSoulOverride(e.target.value === '' ? null : Number(e.target.value))} />
          </Field>
          <Field label="Food for mana recovery"><select value={foodId} onChange={e => { setFoodId(e.target.value); setFoodPrice(null); }}>{FOODS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        </div>
      </section>
    </div>
    {(!plan || !soulValid || !unitsValid) && <Notice tone="warning">Choose a vocation and valid whole quantities. Current mana must fit your maximum; soul must be between 0 and {promoted ? 200 : 100}.</Notice>}
    {plan && soulValid && unitsValid && <>
      <div className="stat-grid">
        <Stat label="Rune items" value={number(plan.objects)} detail={`${number(plan.charges)} total charges / uses`} icon={<Package size={17} />} />
        <Stat label="Mana to spend" value={number(plan.mana)} detail={`${number(plan.casts)} casts × ${number(recipe.mana)} mana`} icon={<Droplets size={17} />} />
        <Stat label="Mana recovery time" value={longDuration(plan.regenerationSeconds)} detail="Excludes casting, travel and future soul recovery" icon={<Clock3 size={17} />} />
        <Stat label="Food for that recovery" value={foodNeeded === null ? '—' : number(foodNeeded)} detail={food.name} icon={<Apple size={17} />} />
      </div>
      <section className="card">
        <div className="toolbar"><h2>Resource check</h2><Badge tone={plan.resourcesSufficient && vocationFits && levelFits ? 'green' : 'muted'}>
          {plan.resourcesSufficient && vocationFits && levelFits ? 'Listed resources covered' : 'Review requirements'}
        </Badge></div>
        <div style={{ overflowX: 'auto' }}><table className="data-table"><thead><tr><th>Resource</th><th>Needed</th><th>Available</th><th>Result</th></tr></thead><tbody>
          <tr><td>Blank runes</td><td>{number(plan.objects)}</td><td>{number(blanks)}</td><td>{plan.blankShortfall ? `${number(plan.blankShortfall)} more needed` : 'Covered'}</td></tr>
          <tr><td>Mana for one cast</td><td>{number(recipe.mana)}</td><td>{number(maximumMana)} maximum</td><td>{plan.capacityFits ? 'Fits maximum' : 'Maximum mana too low'}</td></tr>
          <tr><td>Soul points</td><td>{plan.soulNeeded === null ? 'Add soul cost' : number(plan.soulNeeded)}</td><td>{number(currentSoul)}</td><td>{plan.soulShortfall === null ? 'Not yet checked' : plan.soulShortfall ? `${number(plan.soulShortfall)} more needed` : 'Covered'}</td></tr>
        </tbody></table></div>
        <p className="muted">Soul only recovers after qualifying activity. This batch never assumes unlimited passive soul regeneration, and planning does not add stock.</p>
        <button className="btn" onClick={() => navigate('supplies')}>Record actual production in stock <ArrowRight size={16} /></button>
      </section>
      <section className="card">
        <h2>Optional batch budget</h2>
        <p className="muted">Use your own prices. This estimates replacement cost for blank runes and food during natural mana recovery.</p>
        <div className="form-grid">
          <Field label="Blank rune price (gp each)"><input type="number" min={0} step="any" placeholder="Enter a price" value={blankPrice ?? ''} onChange={e => setBlankPrice(e.target.value === '' ? null : Number(e.target.value))} /></Field>
          <Field label={`${food.name} price (gp each)`}><input type="number" min={0} step="any" placeholder="Enter a price" value={foodPrice ?? ''} onChange={e => setFoodPrice(e.target.value === '' ? null : Number(e.target.value))} /></Field>
          <Field label="Selling price per rune item (gp)" hint="Price for one rune object with all its charges, not one use."><input type="number" min={0} step="any" placeholder="Optional" value={salePrice ?? ''} onChange={e => setSalePrice(e.target.value === '' ? null : Number(e.target.value))} /></Field>
        </div>
        <div className="stat-grid">
          <Stat label="Materials budget" value={materialBudget === null ? '—' : gp(materialBudget)} detail="Blank runes + food; add both prices to calculate" />
          <Stat label="Planned sale value" value={saleValue === null ? '—' : gp(saleValue)} detail={`${number(plan.objects)} rune items`} />
          <Stat label="Margin over materials" value={materialBudget === null || saleValue === null ? '—' : gp(saleValue - materialBudget)} detail="Before any fluids, travel or other costs" />
        </div>
      </section>
    </>}
    <Evidence>
      <p>UH 400 mana at level 24 and HMM 280 mana at level 25 have contemporary 7.6-period support. Other creation requirements and charge counts use labelled 7.72 reconstruction references; check your server’s spell book. Soul costs shown here come from the spell reference when available and can be edited.</p>
      <p>Rune objects, charges, casts and backpack capacity remain separate. One cast is modelled as one rune object. Maximum mana is estimated assuming vocation selection at level 8 unless you enter an actual value.</p>
      <p><External href={SOURCES.runes}>Legacy rune reconstruction</External> · <External href={SOURCES.soul}>Soul mechanics reference</External></p>
    </Evidence>
  </>;
}

export default function Training() {
  const { character, server, openProfile } = useApp();
  const [tab, setTab] = useState('food');
  const [vocation, setVocation] = useState<Vocation>(character.vocation);
  const [promoted, setPromoted] = useState(character.promoted);
  useEffect(() => { setVocation(character.vocation); setPromoted(character.promoted); }, [character.id, character.vocation, character.promoted]);
  const preview = vocation !== character.vocation || promoted !== character.promoted;
  const mage = vocation === 'sorcerer' || vocation === 'druid';
  return <>
    <PageHeader eyebrow="PROGRESS & PREPARATION" title="Training" description="Plan your food, magic-level goals and rune supplies." actions={<button className="btn" onClick={openProfile}>Character profile</button>} />
    <section className="card">
      <div className="toolbar"><h2>Training profile</h2><Badge tone={preview ? 'blue' : 'muted'}>{preview ? 'Temporary preview' : character.name}</Badge></div>
      <div className="form-grid">
        <Field label="Calculator vocation"><select value={vocation} onChange={e => setVocation(e.target.value as Vocation)}>
          <option value="unselected">Choose vocation</option>{VOCATIONS.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}
        </select></Field>
        <Field label="Promotion"><select value={promoted ? 'yes' : 'no'} onChange={e => setPromoted(e.target.value === 'yes')}><option value="no">Not promoted</option><option value="yes">Promoted</option></select></Field>
      </div>
      <p className="muted">{server.name} · Regeneration ×{number(server.regenerationRate, 2)} · Magic progress ×{number(server.magicRate, 2)}{preview ? ' · Preview changes do not alter your saved character.' : ''}</p>
    </section>
    <Tabs tabs={[{ id: 'food', label: 'Food & regeneration' }, { id: 'magic', label: 'Magic level' }, { id: 'runes', label: mage ? 'Rune production' : 'Rune production · optional' }]} value={tab} onChange={setTab} />
    {tab === 'food' && <FoodView key={character.id} vocation={vocation} promoted={promoted} />}
    {tab === 'magic' && <MagicView key={character.id} vocation={vocation} promoted={promoted} />}
    {tab === 'runes' && <RuneView key={character.id} vocation={vocation} promoted={promoted} />}
  </>;
}
