import { FOODS, foodPlanSeconds, type FoodRecord } from './mechanics';

export type FoodSort = 'weight' | 'quantity' | 'name';
export interface FoodComparisonRow {
  food: FoodRecord;
  quantity: number;
  totalWeight: number;
  coverageSeconds: number;
  spareSeconds: number;
}

/** The same seconds-based goal is used for fed-time, ML, and rune recovery. */
export function compareFoods(input: {
  requiredSeconds: number;
  alreadyFedSeconds?: number;
  sort?: FoodSort;
  limit?: number;
  foods?: readonly FoodRecord[];
}): FoodComparisonRow[] | null {
  const { requiredSeconds, alreadyFedSeconds = 0, sort = 'weight', limit = 10, foods = FOODS } = input;
  if (!['weight', 'quantity', 'name'].includes(sort) || !Number.isInteger(limit) || limit < 1) return null;
  const rows: FoodComparisonRow[] = [];
  for (const food of foods) {
    const plan = foodPlanSeconds(food, requiredSeconds, alreadyFedSeconds);
    if (!plan) return null;
    rows.push({ food, quantity: plan.quantity, totalWeight: plan.weight,
      coverageSeconds: plan.quantity * food.seconds,
      spareSeconds: Math.max(0, plan.quantity * food.seconds - plan.requiredSeconds) });
  }
  return rows.sort((a, b) => sort === 'name' ? a.food.name.localeCompare(b.food.name)
    : sort === 'quantity' ? a.quantity - b.quantity || a.totalWeight - b.totalWeight || a.food.name.localeCompare(b.food.name)
      : a.totalWeight - b.totalWeight || a.quantity - b.quantity || a.food.name.localeCompare(b.food.name)).slice(0, limit);
}
