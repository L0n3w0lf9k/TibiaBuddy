import { useState } from 'react';
import { Apple, Check } from 'lucide-react';
import ItemSprite from './ItemSprite';
import { Badge, Evidence, External, Field, Modal, Notice, duration, number } from '../shared';
import { FOODS, FOOD_SOURCES } from '../domain/mechanics';
import { compareFoods, type FoodSort } from '../domain/foodComparison';

export default function FoodComparison({ title, requiredSeconds, alreadyFedSeconds = 0, selectedFoodId, onSelect, onClose }: {
  title: string;
  requiredSeconds: number;
  alreadyFedSeconds?: number;
  selectedFoodId: string;
  onSelect: (foodId: string) => void;
  onClose: () => void;
}) {
  const [sort, setSort] = useState<FoodSort>('weight');
  const [showAll, setShowAll] = useState(false);
  const rows = compareFoods({ requiredSeconds, alreadyFedSeconds, sort, limit: showAll ? FOODS.length : 10 });
  const remainingSeconds = Math.max(0, requiredSeconds - alreadyFedSeconds);
  return <Modal title="Compare food for this goal" onClose={onClose} wide>
    <div className="food-comparison-summary">
      <span className="food-comparison-icon"><Apple size={25} /></span>
      <div><strong>{title}</strong><p>{duration(requiredSeconds)} goal{alreadyFedSeconds > 0 ? ` · ${duration(alreadyFedSeconds)} already fed` : ''} · <strong>{duration(remainingSeconds)} to cover</strong></p></div>
    </div>
    <div className="food-comparison-controls">
      <Field label="Sort food"><select value={sort} onChange={event => setSort(event.target.value as FoodSort)}>
        <option value="weight">Lowest total carried weight</option><option value="quantity">Fewest food items</option><option value="name">Food name</option>
      </select></Field>
      <label className="food-show-all"><input type="checkbox" checked={showAll} onChange={event => setShowAll(event.target.checked)} />Show all {FOODS.length} foods</label>
      <Badge>{showAll ? 'All foods' : 'Top 10'}</Badge>
    </div>
    <p className="muted">Quantities round up to cover the whole goal. Weight includes food only; containers, price, and availability are separate.</p>
    {!rows ? <Notice tone="warning">Enter a valid training goal to compare food.</Notice> : <div className="food-comparison-scroll">
      <table className="data-table food-comparison-table"><thead><tr><th>Food</th><th>Each lasts</th><th>Bring</th><th>Total weight</th><th>Food coverage</th><th></th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.food.id} className={selectedFoodId === row.food.id ? 'food-row-selected' : ''}>
          <td><div className="item-with-sprite"><ItemSprite name={row.food.name} /><span><strong>{row.food.name}</strong><small className="food-unit-weight">{number(row.food.weight, 2)} oz each</small></span></div></td>
          <td>{duration(row.food.seconds)}</td><td><strong>{number(row.quantity)}</strong></td><td><strong>{number(row.totalWeight, 2)} oz</strong></td>
          <td>{duration(row.coverageSeconds)}<small className="food-unit-weight">{duration(row.spareSeconds)} spare</small></td>
          <td><button className={selectedFoodId === row.food.id ? 'btn btn-secondary' : 'btn'} onClick={() => { onSelect(row.food.id); onClose(); }}>
            {selectedFoodId === row.food.id ? <><Check size={14} />Use selected</> : 'Use food'}
          </button></td>
        </tr>)}</tbody>
      </table>
    </div>}
    {remainingSeconds === 0 && <Notice>Your existing nourishment covers this goal; no extra food is needed.</Notice>}
    <p className="muted">Selecting a food updates this plan’s food choice and keeps the goal, progress, and recovery assumptions.</p>
    <Evidence>{FOOD_SOURCES.map(source => <p key={source.url}><External href={source.url}>{source.title}</External><br />{source.note}</p>)}</Evidence>
  </Modal>;
}
