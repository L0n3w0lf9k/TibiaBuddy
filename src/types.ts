export type Vocation = 'unselected' | 'knight' | 'paladin' | 'sorcerer' | 'druid';
export interface Character {
  id: string; name: string; serverId: string; vocation: Vocation; promoted: boolean;
  level: number; xp: number; xpEstimated: boolean; percentRemaining: number;
  magicLevel: number; magicPercentRemaining: number; goalML: number;
  meleeSkill: number; distanceSkill: number; shieldingSkill: number; fishingSkill: number;
  /** Named weapon skills; older journals inherit their shared melee value. */
  axeSkill?: number; swordSkill?: number; clubSkill?: number; fistSkill?: number;
  premium: boolean; maxMana?: number; maxHP?: number; capacity?: number;
}
export interface ServerProfile {
  id: string; name: string; xpRate: number; regenerationRate: number; magicRate: number;
  /** Physical skill progress per credited attempt; omitted in older backups means 1×. */
  skillRate?: number;
  ruleset: 'tibia77'; pricePreset: string;
}
export interface Item {
  id: string; name: string; aliases: string[]; category: string; image?: string;
  serverId?: string; weight?: number | null; attack?: number | null; defense?: number | null;
  armor?: number | null; charges?: number | null; packSize?: number | null; source?: string;
}
export interface NPC {
  id: string; name: string; city: string; serverId?: string; x?: number | null; y?: number | null; z?: number | null;
  notes?: string;
}
export interface Offer {
  id: string; itemId: string; npcId: string; direction: 'buy' | 'sell';
  price: number; enabled: boolean; serverId?: string; sourcePresetId?: string | null; notes?: string;
}
export interface OfferOverride { price?: number; enabled?: boolean; notes?: string }
/** Server-specific spell learning and rune creation settings. Null retains an explicitly unknown value. */
export interface SpellOverride {
  mana?: number | null; runeCharges?: number | null; soulCost?: number | null;
  price?: number | null; vocations?: Exclude<Vocation, 'unselected'>[] | null;
}
/** Quantities and personal reserves are always base item counts. */
export interface StockLot {
  id: string; characterId: string; itemId: string; quantity: number; personalReserve: number;
  unit: string; packSize: number; askingPrice: number; locationId?: string; notes: string;
  chargesPerItem?: number | null;
}
export interface Allocation { lotId: string; quantity: number }
/** quantity, delivered and allocation.quantity are base item counts; unitPrice is per selling unit. */
export interface OrderLine {
  id: string; itemId: string; nameSnapshot: string; quantity: number; delivered: number;
  unit: string; packSize: number; unitPrice: number; allocations: Allocation[];
  chargesPerItem?: number | null;
}
export interface Delivery { id: string; date: string; lineId: string; quantity: number; lotId?: string }
export interface Payment { id: string; date: string; amount: number }
export interface Order {
  id: string; characterId: string; buyer: string; city: string; date: string;
  dueDate?: string; notes: string; lines: OrderLine[]; payments: Payment[];
  deliveries: Delivery[]; cancelled: boolean; imported?: boolean;
}
export interface StockMovement {
  id: string; characterId: string; lotId: string; itemId: string; delta: number;
  date: string; reason: string; operationId?: string;
}
export interface Backpack {
  id: string; characterId: string; color: string; city: string; name: string; purpose: string;
}
export interface HuntInterval { start: number; end: number | null }
export interface XPCheckpoint { id: string; at: number; xp: number; activeSeconds: number }
export interface HuntSession {
  id: string; characterId: string; serverId: string; startedAt: number; stoppedAt: number | null;
  startXP: number; endXP: number | null; location: string; notes: string;
  intervals: HuntInterval[]; checkpoints: XPCheckpoint[];
  status: 'running' | 'paused' | 'awaiting_xp' | 'completed'; durationOverride?: number;
}
export interface Bookmark {
  id: string; characterId: string; name: string; x: number; y: number; z: number; zoom: number; notes: string;
}
export type GuideKind = 'article' | 'video' | 'reference';
/** Personal reference links are shared by all characters on this device. */
export interface GuideLink {
  id: string; title: string; url: string; description: string; kind: GuideKind;
  /** An empty list means relevant to every vocation. */
  vocations: Exclude<Vocation, 'unselected'>[];
  versionLabel: string; createdAt: string; updatedAt: string;
}
export interface AppState {
  schemaVersion: 1; revision: number; activeCharacterId: string;
  characters: Character[]; servers: ServerProfile[]; items: Item[]; npcs: NPC[]; offers: Offer[];
  itemOverrides: Record<string, Partial<Item>>; npcOverrides: Record<string, Partial<NPC>>;
  offerOverrides: Record<string, OfferOverride>;
  spellOverrides?: Record<string, SpellOverride>;
  lots: StockLot[]; orders: Order[]; movements: StockMovement[]; backpacks: Backpack[];
  hunts: HuntSession[]; bookmarks: Bookmark[]; favourites: string[];
  guideLinks?: GuideLink[];
  preferences: Record<string, unknown>;
}
export interface AppContextValue {
  state: AppState; character: Character; server: ServerProfile;
  update: (recipe: (draft: AppState) => void) => Promise<void>;
  notify: (message: string, kind?: 'success' | 'error' | 'info') => void;
  navigate: (path: string) => void; openProfile: () => void;
}
