import type { Vocation } from '../types';

/** Immutable, versioned reference catalogue. Server-specific facts must be stored as overrides. */
export const CATALOG_VERSION = 'tibia77-reference-2026-10-30';
export type EvidenceStatus = 'reconstructed' | 'period-observation' | 'official' | 'unknown' | 'disputed';
export interface FieldEvidence { status: EvidenceStatus; url: string | null; note?: string }
export interface ReferenceSource { id: string; title: string; url: string; kind: EvidenceStatus; version: string; date: string | null; note: string }
export interface CreatureAttack { name: string; effect: string; target: string }
export interface CreatureRecord {
 id: string; name: string; experience: number | null; hp: number | null; armor: number | null;
 attack: number | null; defense: number | null; speed: number | null;
 summonable: boolean | null; summonMana: number | null; convincible: boolean | null; convinceMana: number | null;
 seesInvisible: boolean | null; canTurnInvisible: boolean | null;
 immunities: string[] | null; behavior: string[] | null; attacks: CreatureAttack[]; loot: string[];
 notes: string[]; sourceUrl: string; sourceIds: string[]; evidence: Record<string, FieldEvidence>;
}
export interface SpellRecord {
 id: string; name: string; words: string; type: 'instant' | 'rune'; category: string;
 vocations: Vocation[] | null; level: number | null; mana: number | null; runeCharges: number | null;
 soulCost: number | null; useLevel: number | null; useMagicLevel: number | null;
 premium: boolean | null; promotion: boolean | null; price: number | null;
 teachers: string[]; notes: string[]; sourceUrl: string; sourceIds: string[]; evidence: Record<string, FieldEvidence>;
}
export interface SpellTeacher {
 id: string; name: string; x: number; y: number; z: number; floor: number | null;
 location: string; description: string; sourceUrl: string;
}
export const referenceSources: ReferenceSource[] = [
 {id:'primibia',title:'Primibia · 7.72 reference',url:'https://primibia.com/wiki',kind:'reconstructed',version:'7.72',date:null,note:'Community reconstruction claiming original 7.72 data. These values are source-checked, not certified official 7.7 values. Each detail links to its own source. Automatic area labels and disputed promotion permissions are not imported.'},
 {id:'edron-2005',title:'Edron trainer observations · January 2005',url:'https://forum.tibia.pl/showthread.php?t=22662',kind:'period-observation',version:'Before 7.6',date:'2005-01-09',note:'Contemporary NPC dialogue corroborates the four tower allocations. It predates the 7.6 magic rebalance and does not establish 7.7 mana or level requirements.'},
 {id:'cipsoft-76',title:'CipSoft · 7.6 magic rebalance',url:'https://www.tibia.com/news/?id=355&subtopic=newsarchive',kind:'official',version:'7.6',date:'2005-12-12',note:'Establishes the change to experience-level spell requirements and faster mana regeneration.'},
 {id:'cipsoft-77',title:'CipSoft · technical update 7.7',url:'https://www.tibia.com/news/?id=379&subtopic=newsarchive',kind:'official',version:'7.7',date:'2006-05-17',note:'The historical baseline is the post-7.6 magic system.'},
 {id:'cipsoft-elements',title:'CipSoft · later element expansion',url:'https://www.tibia.com/news/?id=614&subtopic=newsarchive',kind:'official',version:'8.1 preview',date:'2007-11-14',note:'Earth, ice, holy and death belong to a later damage system. They are not imported into this 7.7 creature reference.'}
];

function evidenceFor(record: Record<string, unknown>, url: string, fields: string[]): Record<string, FieldEvidence> {
 return Object.fromEntries(fields.map(field => [field, {status: record[field] == null ? 'unknown' : 'reconstructed', url: record[field] == null ? null : url} as FieldEvidence]));
}

const rawCreatures: Omit<CreatureRecord,'sourceIds'|'evidence'>[] = [
 {
  "id": "amazon",
  "name": "Amazon",
  "experience": 60,
  "hp": 110,
  "armor": 11,
  "attack": 16,
  "defense": 11,
  "speed": 46,
  "summonable": true,
  "summonMana": 390,
  "convincible": true,
  "convinceMana": 390,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Pushes objects",
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Physical Damage",
    "effect": "20–30 physical damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Dagger",
   "Skull",
   "Leather Armor",
   "Gold Coin",
   "Brown Bread",
   "Sabre",
   "Studded Shield",
   "Torch",
   "Crystal Necklace",
   "Small Ruby"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/amazon"
 },
 {
  "id": "ancient-scarab",
  "name": "Ancient Scarab",
  "experience": 720,
  "hp": 1000,
  "armor": 36,
  "attack": 50,
  "defense": 33,
  "speed": 69,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Haste",
    "effect": "haste (+80–90 speed, 9s)",
    "target": "on itself"
   },
   {
    "name": "Poison Damage",
    "effect": "15–135 poison damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Paralysis",
    "effect": "paralysis (0 to -80 speed, 25s)",
    "target": "on target (range 7)"
   },
   {
    "name": "Poison (condition) Damage",
    "effect": "400–500 poison (condition) damage",
    "target": "area around itself (radius 4)"
   },
   {
    "name": "Poison (condition) Damage",
    "effect": "400–500 poison (condition) damage",
    "target": "area around itself (radius 4)"
   },
   {
    "name": "Paralysis",
    "effect": "paralysis (0 to -60 speed, 20s)",
    "target": "area around itself (radius 4)"
   },
   {
    "name": "Summon",
    "effect": "summons up to 3 Larva",
    "target": "area around itself (radius 0)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Magic Light Wand",
   "Plate Armor",
   "Scarab Coin",
   "Small Amethyst",
   "Ancient Amulet",
   "Small Emerald",
   "Scarab Amulet",
   "Scarab Shield",
   "Daramanian Waraxe"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/ancient-scarab"
 },
 {
  "id": "assassin",
  "name": "Assassin",
  "experience": 105,
  "hp": 175,
  "armor": 17,
  "attack": 45,
  "defense": 40,
  "speed": 72,
  "summonable": false,
  "summonMana": null,
  "convincible": true,
  "convinceMana": 450,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Haste",
    "effect": "haste (+55–65 speed, 3s)",
    "target": "on itself"
   },
   {
    "name": "Shapeshift",
    "effect": "changes outfit (looktype 0)",
    "target": "on itself"
   },
   {
    "name": "Physical Damage",
    "effect": "28–38 physical damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Drunkenness",
    "effect": "makes you drunk",
    "target": "on target (range 6)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Torch",
   "Knife",
   "Combat Knife",
   "Steel Helmet",
   "Plate Shield",
   "Battle Shield",
   "Steel Shield",
   "Leopard Armor",
   "Horseman Helmet",
   "Small Diamond"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/assassin"
 },
 {
  "id": "badger",
  "name": "Badger",
  "experience": 5,
  "hp": 23,
  "armor": 1,
  "attack": 10,
  "defense": 3,
  "speed": 30,
  "summonable": true,
  "summonMana": 200,
  "convincible": true,
  "convinceMana": 200,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Meat",
   "Worm"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/badger"
 },
 {
  "id": "bandit",
  "name": "Bandit",
  "experience": 65,
  "hp": 245,
  "armor": 11,
  "attack": 20,
  "defense": 17,
  "speed": 50,
  "summonable": true,
  "summonMana": 450,
  "convincible": true,
  "convinceMana": 450,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Pushes objects"
  ],
  "attacks": [],
  "loot": [
   "Gold Coin",
   "Axe",
   "Brass Shield",
   "Leather Legs",
   "Mace",
   "Meat",
   "Chain Helmet",
   "Brass Armor",
   "Iron Helmet",
   "War Hammer"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/bandit"
 },
 {
  "id": "banshee",
  "name": "Banshee",
  "experience": 900,
  "hp": 1000,
  "armor": 25,
  "attack": 30,
  "defense": 65,
  "speed": 70,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 113–187",
    "target": "on itself"
   },
   {
    "name": "Life Drain Damage",
    "effect": "50–350 life drain damage",
    "target": "on target"
   },
   {
    "name": "Paralysis",
    "effect": "paralysis (0 to -60 speed, 20s)",
    "target": "on target (range 7)"
   },
   {
    "name": "Life Drain Damage",
    "effect": "120–200 life drain damage",
    "target": "area around itself (radius 3)"
   }
  ],
  "loot": [
   "Candlestick",
   "Simple Dress",
   "Gold Coin",
   "Dirty Cape",
   "Silver Amulet",
   "Mirror",
   "Black Pearl",
   "Poison Dagger",
   "Silver Brooch",
   "Lyre",
   "White Pearl",
   "Ring of Healing",
   "Stone Skin Amulet",
   "Blue Robe",
   "Spellbook",
   "Wedding Ring",
   "Crystal Ring",
   "Life Crystal",
   "Red Robe"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/banshee"
 },
 {
  "id": "bat",
  "name": "Bat",
  "experience": 10,
  "hp": 30,
  "armor": 1,
  "attack": 8,
  "defense": 6,
  "speed": 60,
  "summonable": true,
  "summonMana": 250,
  "convincible": true,
  "convinceMana": 250,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/bat"
 },
 {
  "id": "bear",
  "name": "Bear",
  "experience": 23,
  "hp": 80,
  "armor": 6,
  "attack": 17,
  "defense": 6,
  "speed": 38,
  "summonable": true,
  "summonMana": 300,
  "convincible": true,
  "convinceMana": 300,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Meat",
   "Ham",
   "Worm"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/bear"
 },
 {
  "id": "behemoth",
  "name": "Behemoth",
  "experience": 2500,
  "hp": 4000,
  "armor": 50,
  "attack": 75,
  "defense": 65,
  "speed": 130,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison",
   "Energy",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Haste",
    "effect": "haste (+40–50 speed, 8s)",
    "target": "on itself"
   },
   {
    "name": "Physical Damage",
    "effect": "125–185 physical damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Meat",
   "Crowbar",
   "Amphora",
   "Double Axe",
   "Big Bone",
   "Pick",
   "Small Amethyst",
   "Two Handed Sword",
   "Dark Armor",
   "Plate Armor",
   "Giant Sword",
   "Strange Symbol",
   "Steel Boots",
   "Crystal Necklace"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/behemoth"
 },
 {
  "id": "beholder",
  "name": "Beholder",
  "experience": 170,
  "hp": 260,
  "armor": 5,
  "attack": 12,
  "defense": 20,
  "speed": 35,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Life Drain"
  ],
  "behavior": [
   "Pushes objects",
   "Sees invisible",
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Energy Damage",
    "effect": "15–45 energy damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Fire Damage",
    "effect": "25–45 fire damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Physical Damage",
    "effect": "30–50 physical damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Poison Damage",
    "effect": "5–45 poison damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Life Drain Damage",
    "effect": "35–45 life drain damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Mana Drain Damage",
    "effect": "5–25 mana drain damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Summon",
    "effect": "summons up to 6 Skeleton",
    "target": "area around itself (radius 0)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Longsword",
   "Morning Star",
   "Spellbook",
   "Steel Shield",
   "Two Handed Sword",
   "Wooden Shield",
   "Quagmire Rod",
   "Beholder Shield"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/beholder"
 },
 {
  "id": "black-knight",
  "name": "Black Knight",
  "experience": 1600,
  "hp": 1800,
  "armor": 42,
  "attack": 60,
  "defense": 60,
  "speed": 155,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison",
   "Energy",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Physical Damage",
    "effect": "145–185 physical damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Spear",
   "Brown Bread",
   "Rope",
   "Brass Legs",
   "Halberd",
   "Plate Armor",
   "Steel Helmet",
   "Two Handed Sword",
   "Battle Hammer",
   "Warrior Helmet",
   "Knight Axe",
   "Dark Armor",
   "Dark Helmet",
   "Knight Armor",
   "Knight Legs",
   "Ruby Necklace",
   "Boots of Haste",
   "Dragon Lance"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/black-knight"
 },
 {
  "id": "black-sheep",
  "name": "Black Sheep",
  "experience": 0,
  "hp": 20,
  "armor": 1,
  "attack": 0,
  "defense": 2,
  "speed": 18,
  "summonable": true,
  "summonMana": 250,
  "convincible": true,
  "convinceMana": 250,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Meat"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/black-sheep"
 },
 {
  "id": "blue-djinn",
  "name": "Blue Djinn",
  "experience": 190,
  "hp": 330,
  "armor": 20,
  "attack": 30,
  "defense": 30,
  "speed": 70,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison",
   "Energy",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Fire Damage",
    "effect": "45–75 fire damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Energy (condition) Damage",
    "effect": "50–90 energy (condition) damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Life Drain Damage",
    "effect": "55–105 life drain damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Drunkenness",
    "effect": "makes you drunk",
    "target": "on target (range 7)"
   },
   {
    "name": "Shapeshift",
    "effect": "changes outfit (looktype 74)",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Carrot",
   "Small Oil Lamp",
   "Book",
   "Small Sapphire",
   "Blue Rose",
   "Mystic Turban"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/blue-djinn"
 },
 {
  "id": "bonebeast",
  "name": "Bonebeast",
  "experience": 580,
  "hp": 515,
  "armor": 40,
  "attack": 47,
  "defense": 45,
  "speed": 69,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 30–60",
    "target": "on itself"
   },
   {
    "name": "Poison Damage",
    "effect": "25–65 poison damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Life Drain Damage",
    "effect": "30–50 life drain damage",
    "target": "area around itself (radius 2)"
   },
   {
    "name": "Poison (condition) Damage",
    "effect": "60–80 poison (condition) damage",
    "target": "area around itself (radius 2)"
   }
  ],
  "loot": [
   "Bone",
   "Gold Coin",
   "Skull",
   "Big Bone",
   "Plate Armor",
   "Bone Club",
   "Bone Shield",
   "Green Mushroom"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/bonebeast"
 },
 {
  "id": "bug",
  "name": "Bug",
  "experience": 18,
  "hp": 29,
  "armor": 2,
  "attack": 9,
  "defense": 3,
  "speed": 40,
  "summonable": true,
  "summonMana": 250,
  "convincible": true,
  "convinceMana": 250,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Gold Coin",
   "Cherry"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/bug"
 },
 {
  "id": "carniphila",
  "name": "Carniphila",
  "experience": 150,
  "hp": 255,
  "armor": 26,
  "attack": 40,
  "defense": 20,
  "speed": 15,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Life Drain"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Poison Damage",
    "effect": "60–90 poison damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Paralysis",
    "effect": "paralysis (0 to -110 speed, 30s)",
    "target": "on target (range 7)"
   },
   {
    "name": "Poison Damage",
    "effect": "40–130 poison damage",
    "target": "area around itself (radius 2)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Meat",
   "Ham",
   "Dark Mushroom",
   "Shadow Herb",
   "Grave Flower",
   "Sling Herb"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/carniphila"
 },
 {
  "id": "cave-rat",
  "name": "Cave Rat",
  "experience": 10,
  "hp": 30,
  "armor": 1,
  "attack": 8,
  "defense": 4,
  "speed": 35,
  "summonable": true,
  "summonMana": 250,
  "convincible": true,
  "convinceMana": 250,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Gold Coin",
   "Worm",
   "Cheese",
   "Cookie"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/cave-rat"
 },
 {
  "id": "centipede",
  "name": "Centipede",
  "experience": 30,
  "hp": 70,
  "armor": 8,
  "attack": 24,
  "defense": 9,
  "speed": 43,
  "summonable": true,
  "summonMana": 335,
  "convincible": true,
  "convinceMana": 335,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [
   "Pushes objects"
  ],
  "attacks": [],
  "loot": [
   "Gold Coin",
   "Mace",
   "Sword"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/centipede"
 },
 {
  "id": "chicken",
  "name": "Chicken",
  "experience": 0,
  "hp": 15,
  "armor": 1,
  "attack": 0,
  "defense": 2,
  "speed": 24,
  "summonable": true,
  "summonMana": 220,
  "convincible": true,
  "convinceMana": 220,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Worm",
   "Meat",
   "Egg"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/chicken"
 },
 {
  "id": "cobra",
  "name": "Cobra",
  "experience": 30,
  "hp": 65,
  "armor": 1,
  "attack": 15,
  "defense": 6,
  "speed": 20,
  "summonable": true,
  "summonMana": 275,
  "convincible": true,
  "convinceMana": 275,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [],
  "attacks": [
   {
    "name": "Poison (condition) Damage",
    "effect": "14–26 poison (condition) damage",
    "target": "on target (range 5)"
   }
  ],
  "loot": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/cobra"
 },
 {
  "id": "crab",
  "name": "Crab",
  "experience": 30,
  "hp": 55,
  "armor": 28,
  "attack": 15,
  "defense": 30,
  "speed": 60,
  "summonable": true,
  "summonMana": 305,
  "convincible": true,
  "convinceMana": 305,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Gold Coin",
   "Fish"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/crab"
 },
 {
  "id": "crocodile",
  "name": "Crocodile",
  "experience": 40,
  "hp": 105,
  "armor": 13,
  "attack": 32,
  "defense": 5,
  "speed": 38,
  "summonable": true,
  "summonMana": 350,
  "convincible": true,
  "convinceMana": 350,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Pushes objects",
   "Pushes creatures"
  ],
  "attacks": [],
  "loot": [
   "Meat",
   "Gold Coin",
   "Ham",
   "Leather Helmet",
   "Leather Legs",
   "Crocodile Boots"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/crocodile"
 },
 {
  "id": "crypt-shambler",
  "name": "Crypt Shambler",
  "experience": 195,
  "hp": 330,
  "armor": 30,
  "attack": 39,
  "defense": 25,
  "speed": 30,
  "summonable": false,
  "summonMana": null,
  "convincible": true,
  "convinceMana": 580,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures"
  ],
  "attacks": [
   {
    "name": "Life Drain Damage",
    "effect": "25–55 life drain damage",
    "target": "on target"
   }
  ],
  "loot": [
   "Worm",
   "Bone",
   "Gold Coin",
   "Rotten Meat",
   "Iron Helmet",
   "Two Handed Sword",
   "Bone Shield",
   "Bone Sword",
   "Throwing Star",
   "Small Diamond"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/crypt-shambler"
 },
 {
  "id": "cyclops",
  "name": "Cyclops",
  "experience": 150,
  "hp": 260,
  "armor": 17,
  "attack": 30,
  "defense": 24,
  "speed": 55,
  "summonable": true,
  "summonMana": 490,
  "convincible": true,
  "convinceMana": 490,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Pushes objects",
   "Pushes creatures"
  ],
  "attacks": [],
  "loot": [
   "Gold Coin",
   "Meat",
   "Ham",
   "Short Sword",
   "Plate Shield",
   "Battle Shield",
   "Halberd",
   "Dark Helmet",
   "Wolf Tooth Chain",
   "Club Ring"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/cyclops"
 },
 {
  "id": "dark-monk",
  "name": "Dark Monk",
  "experience": 145,
  "hp": 190,
  "armor": 22,
  "attack": 37,
  "defense": 43,
  "speed": 75,
  "summonable": false,
  "summonMana": null,
  "convincible": true,
  "convinceMana": 480,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 25–49",
    "target": "on itself"
   },
   {
    "name": "Haste",
    "effect": "haste (+50–60 speed, 2s)",
    "target": "on itself"
   },
   {
    "name": "Life Drain Damage",
    "effect": "25–49 life drain damage",
    "target": "on target"
   }
  ],
  "loot": [
   "Bread",
   "Scroll",
   "Gold Coin",
   "Bag",
   "Staff",
   "Lamp",
   "Brown Flask",
   "Sandals",
   "Leather Armor",
   "Life Crystal",
   "Ankh",
   "Power Ring"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/dark-monk"
 },
 {
  "id": "deer",
  "name": "Deer",
  "experience": 0,
  "hp": 25,
  "armor": 2,
  "attack": 2,
  "defense": 2,
  "speed": 58,
  "summonable": true,
  "summonMana": 260,
  "convincible": true,
  "convinceMana": 260,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Meat",
   "Ham"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/deer"
 },
 {
  "id": "demon",
  "name": "Demon",
  "experience": 6000,
  "hp": 8200,
  "armor": 40,
  "attack": 80,
  "defense": 65,
  "speed": 80,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison",
   "Energy",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 90–150",
    "target": "on itself"
   },
   {
    "name": "Mana Drain Damage",
    "effect": "40–100 mana drain damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Summon",
    "effect": "summons up to 1 Fire Elemental",
    "target": "area around itself (radius 0)"
   },
   {
    "name": "Fire Damage",
    "effect": "110–200 fire damage",
    "target": "area at target (range 7, radius 6)"
   },
   {
    "name": "Field",
    "effect": "creates a fire field",
    "target": "area at target (range 7, radius 0)"
   },
   {
    "name": "Energy Damage",
    "effect": "300–420 energy damage",
    "target": "wave (0°, range 8)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Double Axe",
   "Fire Mushroom",
   "Small Emerald",
   "Fire Axe",
   "Talon",
   "Orb",
   "Giant Sword",
   "Golden Sickle",
   "Stealth Ring",
   "Purple Tome",
   "Devil Helmet",
   "Gold Ring",
   "Demon Shield",
   "Platinum Amulet",
   "Ice Rapier",
   "Mastermind Shield",
   "Ring of Healing",
   "Golden Legs",
   "Might Ring",
   "Magic Plate Armor"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/demon"
 },
 {
  "id": "demon-skeleton",
  "name": "Demon Skeleton",
  "experience": 240,
  "hp": 400,
  "armor": 25,
  "attack": 45,
  "defense": 35,
  "speed": 50,
  "summonable": true,
  "summonMana": 620,
  "convincible": true,
  "convinceMana": 620,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures"
  ],
  "attacks": [
   {
    "name": "Life Drain Damage",
    "effect": "30–50 life drain damage",
    "target": "on target"
   }
  ],
  "loot": [
   "Torch",
   "Gold Coin",
   "Throwing Star",
   "Battle Hammer",
   "Iron Helmet",
   "Battle Shield",
   "Mysterious Fetish",
   "Mind Stone",
   "Guardian Shield"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/demon-skeleton"
 },
 {
  "id": "dog",
  "name": "Dog",
  "experience": 0,
  "hp": 20,
  "armor": 1,
  "attack": 0,
  "defense": 2,
  "speed": 22,
  "summonable": true,
  "summonMana": 220,
  "convincible": true,
  "convinceMana": 220,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/dog"
 },
 {
  "id": "dragon",
  "name": "Dragon",
  "experience": 700,
  "hp": 1000,
  "armor": 25,
  "attack": 42,
  "defense": 38,
  "speed": 45,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 34–56",
    "target": "on itself"
   },
   {
    "name": "Fire Damage",
    "effect": "55–105 fire damage",
    "target": "area at target (range 7, radius 3)"
   },
   {
    "name": "Fire Damage",
    "effect": "100–160 fire damage",
    "target": "wave (30°, range 8)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Dragon Ham",
   "Short Sword",
   "Mace",
   "Steel Shield",
   "Crossbow",
   "Burst Arrow",
   "Longsword",
   "Steel Helmet",
   "Broadsword",
   "Plate Legs",
   "Double Axe",
   "Wand of Inferno",
   "Dragon Hammer",
   "Serpent Sword",
   "Small Diamond",
   "Dragon Shield",
   "Life Crystal"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/dragon"
 },
 {
  "id": "dragon-lord",
  "name": "Dragon Lord",
  "experience": 2100,
  "hp": 1900,
  "armor": 32,
  "attack": 55,
  "defense": 48,
  "speed": 60,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 57–93",
    "target": "on itself"
   },
   {
    "name": "Fire Damage",
    "effect": "120–180 fire damage",
    "target": "area at target (range 7, radius 3)"
   },
   {
    "name": "Field",
    "effect": "creates a fire field",
    "target": "area at target (range 7, radius 3)"
   },
   {
    "name": "Fire Damage",
    "effect": "150–250 fire damage",
    "target": "wave (30°, range 8)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Dragon Ham",
   "Green Mushroom",
   "Book",
   "Power Bolt",
   "Energy Ring",
   "Small Sapphire",
   "Golden Mug",
   "Life Crystal",
   "Strange Helmet",
   "Fire Sword",
   "Tower Shield",
   "Royal Helmet",
   "Dragon Scale Mail"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/dragon-lord"
 },
 {
  "id": "dwarf",
  "name": "Dwarf",
  "experience": 45,
  "hp": 90,
  "armor": 8,
  "attack": 14,
  "defense": 14,
  "speed": 45,
  "summonable": true,
  "summonMana": 320,
  "convincible": true,
  "convinceMana": 320,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [],
  "attacks": [],
  "loot": [
   "White Mushroom",
   "Gold Coin",
   "Hatchet",
   "Axe",
   "Copper Shield",
   "Leather Legs",
   "Pick",
   "Letter",
   "Studded Armor",
   "Dwarven Ring"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/dwarf"
 },
 {
  "id": "dwarf-geomancer",
  "name": "Dwarf Geomancer",
  "experience": 245,
  "hp": 380,
  "armor": 15,
  "attack": 30,
  "defense": 35,
  "speed": 60,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible",
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 75–125",
    "target": "on itself"
   },
   {
    "name": "Physical Damage",
    "effect": "55–105 physical damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Mana Drain Damage",
    "effect": "50–80 mana drain damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Gold Coin",
   "White Mushroom",
   "Bag",
   "Leather Boots",
   "Studded Legs",
   "Pear",
   "Magic Light Wand",
   "Blank Rune",
   "Soldier Helmet",
   "Clerical Mace",
   "Spellbook",
   "Dwarven Ring",
   "Small Sapphire"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/dwarf-geomancer"
 },
 {
  "id": "dwarf-guard",
  "name": "Dwarf Guard",
  "experience": 165,
  "hp": 245,
  "armor": 15,
  "attack": 39,
  "defense": 37,
  "speed": 63,
  "summonable": true,
  "summonMana": 650,
  "convincible": true,
  "convinceMana": 650,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [],
  "loot": [
   "White Mushroom",
   "Gold Coin",
   "Leather Boots",
   "Scale Armor",
   "Battle Shield",
   "Battle Hammer",
   "Steel Helmet",
   "Double Axe",
   "Axe Ring",
   "Small Amethyst"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/dwarf-guard"
 },
 {
  "id": "dwarf-soldier",
  "name": "Dwarf Soldier",
  "experience": 70,
  "hp": 135,
  "armor": 9,
  "attack": 21,
  "defense": 20,
  "speed": 48,
  "summonable": true,
  "summonMana": 360,
  "convincible": true,
  "convinceMana": 360,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [
   "Pushes objects"
  ],
  "attacks": [
   {
    "name": "Physical Damage",
    "effect": "20–40 physical damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Bolt",
   "White Mushroom",
   "Gold Coin",
   "Soldier Helmet",
   "Shovel",
   "Chain Armor",
   "Dwarven Shield",
   "Crossbow",
   "Battle Axe",
   "Axe Ring"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/dwarf-soldier"
 },
 {
  "id": "dworc-fleshhunter",
  "name": "Dworc Fleshhunter",
  "experience": 35,
  "hp": 85,
  "armor": 3,
  "attack": 17,
  "defense": 8,
  "speed": 34,
  "summonable": false,
  "summonMana": null,
  "convincible": true,
  "convinceMana": 300,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [],
  "attacks": [
   {
    "name": "Physical Damage",
    "effect": "5–15 physical damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Leather Armor",
   "Cleaver",
   "Torch",
   "Skull",
   "Poison Dagger",
   "Bone Shield",
   "Hunting Spear",
   "Tribal Mask",
   "Ripper Lance"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/dworc-fleshhunter"
 },
 {
  "id": "dworc-venomsniper",
  "name": "Dworc Venomsniper",
  "experience": 30,
  "hp": 80,
  "armor": 3,
  "attack": 10,
  "defense": 15,
  "speed": 36,
  "summonable": false,
  "summonMana": null,
  "convincible": true,
  "convinceMana": 300,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Poison (condition) Damage",
    "effect": "14–26 poison (condition) damage",
    "target": "on target (range 5)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Leather Armor",
   "Throwing Knife",
   "Torch",
   "Poison Arrow",
   "Poison Dagger",
   "Skull",
   "Tribal Mask",
   "Bast Skirt",
   "Bronze Amulet"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/dworc-venomsniper"
 },
 {
  "id": "dworc-voodoomaster",
  "name": "Dworc Voodoomaster",
  "experience": 50,
  "hp": 80,
  "armor": 3,
  "attack": 13,
  "defense": 8,
  "speed": 35,
  "summonable": false,
  "summonMana": null,
  "convincible": true,
  "convinceMana": 300,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 3–9",
    "target": "on itself"
   },
   {
    "name": "Haste",
    "effect": "haste (+170–200 speed, 4s)",
    "target": "on itself"
   },
   {
    "name": "Shapeshift",
    "effect": "changes outfit (looktype 0)",
    "target": "on itself"
   },
   {
    "name": "Life Drain Damage",
    "effect": "1–39 life drain damage",
    "target": "on target"
   },
   {
    "name": "Paralysis",
    "effect": "paralysis (0 to -70 speed, 5s)",
    "target": "on target (range 7)"
   },
   {
    "name": "Drunkenness",
    "effect": "makes you drunk",
    "target": "on target (range 7)"
   },
   {
    "name": "Shapeshift",
    "effect": "changes outfit (looktype 111)",
    "target": "on target (range 7)"
   },
   {
    "name": "Poison Damage",
    "effect": "6–18 poison damage",
    "target": "area around itself (radius 5)"
   },
   {
    "name": "Field",
    "effect": "creates a poison field",
    "target": "area at target (range 7, radius 0)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Bone",
   "Leather Armor",
   "Big Bone",
   "Torch",
   "Skull",
   "Poison Dagger",
   "Strange Symbol",
   "Tribal Mask",
   "Voodoo Doll"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/dworc-voodoomaster"
 },
 {
  "id": "efreet",
  "name": "Efreet",
  "experience": 300,
  "hp": 550,
  "armor": 24,
  "attack": 35,
  "defense": 35,
  "speed": 77,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison",
   "Energy",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 50–80",
    "target": "on itself"
   },
   {
    "name": "Fire Damage",
    "effect": "40–110 fire damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Energy Damage",
    "effect": "65–115 energy damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Life Drain Damage",
    "effect": "60–120 life drain damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Paralysis",
    "effect": "paralysis (0 to -50 speed, 15s)",
    "target": "on target (range 7)"
   },
   {
    "name": "Drunkenness",
    "effect": "makes you drunk",
    "target": "on target (range 7)"
   },
   {
    "name": "Shapeshift",
    "effect": "changes outfit (looktype 21)",
    "target": "on target (range 7)"
   },
   {
    "name": "Energy (condition) Damage",
    "effect": "60–100 energy (condition) damage",
    "target": "area around itself (radius 2)"
   },
   {
    "name": "Summon",
    "effect": "summons up to 2 Green Djinn",
    "target": "area around itself (radius 0)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Pear",
   "Heavy Machete",
   "Small Oil Lamp",
   "Small Emerald",
   "Green Tapestry",
   "Wand of Inferno",
   "Mystic Turban",
   "Green Gem"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/efreet"
 },
 {
  "id": "elder-beholder",
  "name": "Elder Beholder",
  "experience": 280,
  "hp": 500,
  "armor": 13,
  "attack": 16,
  "defense": 26,
  "speed": 45,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Life Drain"
  ],
  "behavior": [
   "Pushes objects",
   "Sees invisible",
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Energy Damage",
    "effect": "45–75 energy damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Fire Damage",
    "effect": "60–80 fire damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Physical Damage",
    "effect": "70–90 physical damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Poison Damage",
    "effect": "30–70 poison damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Life Drain Damage",
    "effect": "75–85 life drain damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Life Drain Damage",
    "effect": "75–85 life drain damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Mana Drain Damage",
    "effect": "20–40 mana drain damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Paralysis",
    "effect": "paralysis (0 to -70 speed, 20s)",
    "target": "on target (range 7)"
   },
   {
    "name": "Summon",
    "effect": "summons up to 6 Gazer",
    "target": "area around itself (radius 0)"
   },
   {
    "name": "Summon",
    "effect": "summons up to 6 Crypt Shambler",
    "target": "area around itself (radius 0)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Longsword",
   "Morning Star",
   "Steel Shield",
   "Two Handed Sword",
   "Spellbook",
   "Beholder Helmet",
   "Beholder Shield"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/elder-beholder"
 },
 {
  "id": "elephant",
  "name": "Elephant",
  "experience": 160,
  "hp": 320,
  "armor": 20,
  "attack": 41,
  "defense": 16,
  "speed": 55,
  "summonable": true,
  "summonMana": 500,
  "convincible": true,
  "convinceMana": 500,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Pushes objects",
   "Pushes creatures"
  ],
  "attacks": [],
  "loot": [
   "Meat",
   "Ham",
   "Elephant Tusk",
   "Tusk Shield"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/elephant"
 },
 {
  "id": "elf",
  "name": "Elf",
  "experience": 42,
  "hp": 100,
  "armor": 6,
  "attack": 12,
  "defense": 12,
  "speed": 55,
  "summonable": true,
  "summonMana": 320,
  "convincible": true,
  "convinceMana": 320,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Physical Damage",
    "effect": "15–35 physical damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Red Apple",
   "Studded Helmet",
   "Brass Shield",
   "Leather Boots",
   "Studded Armor",
   "Longsword",
   "Arrow"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/elf"
 },
 {
  "id": "elf-arcanist",
  "name": "Elf Arcanist",
  "experience": 175,
  "hp": 220,
  "armor": 15,
  "attack": 20,
  "defense": 20,
  "speed": 70,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison",
   "Energy"
  ],
  "behavior": [
   "Pushes objects",
   "Sees invisible",
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 42–68",
    "target": "on itself"
   },
   {
    "name": "Physical Damage",
    "effect": "15–45 physical damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Energy Damage",
    "effect": "30–50 energy damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Physical Damage",
    "effect": "60–80 physical damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Scroll",
   "Candlestick",
   "Melon",
   "Blank Rune",
   "Bread",
   "Sandals",
   "Staff",
   "Inkwell",
   "Grave Flower",
   "Green Tunic",
   "Arrow",
   "Bowl",
   "Sling Herb",
   "Elven Amulet",
   "Life Crystal",
   "Wand of Cosmic Energy",
   "Yellow Gem"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/elf-arcanist"
 },
 {
  "id": "elf-scout",
  "name": "Elf Scout",
  "experience": 75,
  "hp": 160,
  "armor": 7,
  "attack": 18,
  "defense": 18,
  "speed": 70,
  "summonable": true,
  "summonMana": 360,
  "convincible": true,
  "convinceMana": 360,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Pushes objects",
   "Sees invisible",
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Physical Damage",
    "effect": "30–60 physical damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Arrow",
   "Gold Coin",
   "Grapes",
   "Poison Arrow",
   "Waterskin",
   "Studded Armor",
   "Sandals",
   "Studded Helmet",
   "Longsword",
   "Bow"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/elf-scout"
 },
 {
  "id": "fire-devil",
  "name": "Fire Devil",
  "experience": 110,
  "hp": 200,
  "armor": 13,
  "attack": 22,
  "defense": 15,
  "speed": 50,
  "summonable": true,
  "summonMana": 530,
  "convincible": true,
  "convinceMana": 530,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Fire"
  ],
  "behavior": [
   "Pushes objects",
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Fire Damage",
    "effect": "60–90 fire damage",
    "target": "area at target (range 7, radius 3)"
   },
   {
    "name": "Fire Damage",
    "effect": "20–50 fire damage",
    "target": "area at target (range 7, radius 1)"
   }
  ],
  "loot": [
   "Pitchfork",
   "Torch",
   "Blank Rune",
   "Cleaver",
   "Scimitar",
   "Double Axe",
   "Volcanic Rod",
   "Small Amethyst",
   "Guardian Shield"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/fire-devil"
 },
 {
  "id": "fire-elemental",
  "name": "Fire Elemental",
  "experience": 220,
  "hp": 280,
  "armor": 18,
  "attack": 38,
  "defense": 20,
  "speed": 55,
  "summonable": true,
  "summonMana": 690,
  "convincible": true,
  "convinceMana": 690,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Fire Damage",
    "effect": "55–155 fire damage",
    "target": "area at target (range 7, radius 1)"
   },
   {
    "name": "Field",
    "effect": "creates a fire field",
    "target": "area at target (range 7, radius 0)"
   }
  ],
  "loot": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/fire-elemental"
 },
 {
  "id": "flamingo",
  "name": "Flamingo",
  "experience": 0,
  "hp": 25,
  "armor": 1,
  "attack": 4,
  "defense": 6,
  "speed": 44,
  "summonable": true,
  "summonMana": 250,
  "convincible": true,
  "convinceMana": 250,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/flamingo"
 },
 {
  "id": "frost-troll",
  "name": "Frost Troll",
  "experience": 23,
  "hp": 55,
  "armor": 7,
  "attack": 11,
  "defense": 9,
  "speed": 30,
  "summonable": true,
  "summonMana": 300,
  "convincible": true,
  "convinceMana": 300,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Gold Coin",
   "Spear",
   "Fish",
   "Rapier",
   "Wooden Shield",
   "Coat",
   "Club",
   "Twigs"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/frost-troll"
 },
 {
  "id": "gargoyle",
  "name": "Gargoyle",
  "experience": 150,
  "hp": 250,
  "armor": 26,
  "attack": 24,
  "defense": 30,
  "speed": 60,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison",
   "Life Drain"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 5–15",
    "target": "on itself"
   }
  ],
  "loot": [
   "Gold Coin",
   "Meat",
   "Ham",
   "Small Stone",
   "Studded Club",
   "Battle Shield",
   "Morning Star",
   "Dark Armor",
   "Steel Helmet",
   "Wolf Tooth Chain",
   "Club Ring"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/gargoyle"
 },
 {
  "id": "gazer",
  "name": "Gazer",
  "experience": 90,
  "hp": 120,
  "armor": 4,
  "attack": 9,
  "defense": 15,
  "speed": 30,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Life Drain"
  ],
  "behavior": [
   "Pushes objects",
   "Sees invisible",
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Haste",
    "effect": "haste (+98–100 speed, 4s)",
    "target": "on itself"
   },
   {
    "name": "Life Drain Damage",
    "effect": "25–35 life drain damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Mana Drain Damage",
    "effect": "5–15 mana drain damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Wooden Shield"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/gazer"
 },
 {
  "id": "ghost",
  "name": "Ghost",
  "experience": 120,
  "hp": 150,
  "armor": 10,
  "attack": 28,
  "defense": 20,
  "speed": 40,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Physical",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects"
  ],
  "attacks": [
   {
    "name": "Life Drain Damage",
    "effect": "25–45 life drain damage",
    "target": "on target"
   }
  ],
  "loot": [
   "Sandals",
   "Shadow Herb",
   "Morning Star",
   "Cape",
   "Combat Knife",
   "Book",
   "Ancient Shield",
   "Stealth Ring"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/ghost"
 },
 {
  "id": "ghoul",
  "name": "Ghoul",
  "experience": 85,
  "hp": 100,
  "armor": 8,
  "attack": 26,
  "defense": 17,
  "speed": 32,
  "summonable": true,
  "summonMana": 450,
  "convincible": true,
  "convinceMana": 450,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 9–15",
    "target": "on itself"
   },
   {
    "name": "Life Drain Damage",
    "effect": "15–25 life drain damage",
    "target": "on target"
   }
  ],
  "loot": [
   "Worm",
   "Gold Coin",
   "Torch",
   "Brass Helmet",
   "Knife",
   "Viking Helmet",
   "Scale Armor",
   "Skull",
   "Life Ring"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/ghoul"
 },
 {
  "id": "giant-spider",
  "name": "Giant Spider",
  "experience": 900,
  "hp": 1300,
  "armor": 30,
  "attack": 65,
  "defense": 40,
  "speed": 80,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison",
   "Life Drain"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Haste",
    "effect": "haste (+60–70 speed, 20s)",
    "target": "on itself"
   },
   {
    "name": "Summon",
    "effect": "summons up to 2 Poison Spider",
    "target": "area around itself (radius 0)"
   },
   {
    "name": "Field",
    "effect": "creates a poison field",
    "target": "area at target (range 7, radius 0)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Plate Armor",
   "Brass Legs",
   "Steel Helmet",
   "Time Ring",
   "Knight Armor",
   "Knight Legs",
   "Platinum Amulet"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/giant-spider"
 },
 {
  "id": "goblin",
  "name": "Goblin",
  "experience": 25,
  "hp": 50,
  "armor": 6,
  "attack": 10,
  "defense": 8,
  "speed": 20,
  "summonable": true,
  "summonMana": 290,
  "convincible": true,
  "convinceMana": 290,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [
   {
    "name": "Physical Damage",
    "effect": "15–25 physical damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Small Stone",
   "Dagger",
   "Fish",
   "Bone",
   "Leather Helmet",
   "Small Axe",
   "Short Sword",
   "Leather Armor",
   "Moldy Cheese",
   "Bone Club"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/goblin"
 },
 {
  "id": "green-djinn",
  "name": "Green Djinn",
  "experience": 190,
  "hp": 330,
  "armor": 20,
  "attack": 30,
  "defense": 30,
  "speed": 70,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison",
   "Energy",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Fire Damage",
    "effect": "45–75 fire damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Energy (condition) Damage",
    "effect": "50–90 energy (condition) damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Life Drain Damage",
    "effect": "55–105 life drain damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Drunkenness",
    "effect": "makes you drunk",
    "target": "on target (range 7)"
   },
   {
    "name": "Shapeshift",
    "effect": "changes outfit (looktype 21)",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Cheese",
   "Grave Flower",
   "Small Oil Lamp",
   "Small Emerald",
   "Book",
   "Mystic Turban"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/green-djinn"
 },
 {
  "id": "hero",
  "name": "Hero",
  "experience": 1200,
  "hp": 1400,
  "armor": 35,
  "attack": 58,
  "defense": 50,
  "speed": 100,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison",
   "Energy",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 200–250",
    "target": "on itself"
   },
   {
    "name": "Physical Damage",
    "effect": "75–125 physical damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Scroll",
   "Arrow",
   "Grapes",
   "Red Rose",
   "Rope",
   "Meat",
   "Lyre",
   "Bow",
   "Scarf",
   "Green Tunic",
   "Wedding Ring",
   "Two Handed Sword",
   "War Hammer",
   "Crown Armor",
   "Crown Helmet",
   "Crown Legs",
   "Fire Sword",
   "Might Ring",
   "Crown Shield"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/hero"
 },
 {
  "id": "hunter",
  "name": "Hunter",
  "experience": 150,
  "hp": 150,
  "armor": 8,
  "attack": 13,
  "defense": 10,
  "speed": 65,
  "summonable": false,
  "summonMana": null,
  "convincible": true,
  "convinceMana": 530,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Pushes objects",
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Physical Damage",
    "effect": "50–100 physical damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Arrow",
   "Bow",
   "Orange",
   "Leather Legs",
   "Roll",
   "Leather Helmet",
   "Brass Armor",
   "Brass Helmet",
   "Burst Arrow",
   "Torch",
   "Dragon Necklace",
   "Small Ruby"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/hunter"
 },
 {
  "id": "hyaena",
  "name": "Hyaena",
  "experience": 20,
  "hp": 60,
  "armor": 1,
  "attack": 11,
  "defense": 5,
  "speed": 58,
  "summonable": true,
  "summonMana": 275,
  "convincible": true,
  "convinceMana": 275,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Meat",
   "Worm"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/hyaena"
 },
 {
  "id": "hydra",
  "name": "Hydra",
  "experience": 2100,
  "hp": 2250,
  "armor": 27,
  "attack": 56,
  "defense": 45,
  "speed": 60,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 200–400",
    "target": "on itself"
   },
   {
    "name": "Paralysis",
    "effect": "paralysis (0 to -40 speed, 15s)",
    "target": "area at target (range 7, radius 3)"
   },
   {
    "name": "Physical Damage",
    "effect": "100–200 physical damage",
    "target": "wave (30°, range 8)"
   },
   {
    "name": "Poison Damage",
    "effect": "60–300 poison damage",
    "target": "wave (30°, range 8)"
   }
  ],
  "loot": [
   "Meat",
   "Gold Coin",
   "Ham",
   "Small Sapphire",
   "Ring of Healing",
   "Knight Armor",
   "Warrior Helmet",
   "Hydra Egg",
   "Stone Skin Amulet",
   "Life Crystal",
   "Royal Helmet",
   "Boots of Haste",
   "Medusa Shield"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/hydra"
 },
 {
  "id": "kongra",
  "name": "Kongra",
  "experience": 110,
  "hp": 340,
  "armor": 18,
  "attack": 30,
  "defense": 14,
  "speed": 52,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Pushes objects"
  ],
  "attacks": [
   {
    "name": "Haste",
    "effect": "haste (+45–55 speed, 3s)",
    "target": "on itself"
   }
  ],
  "loot": [
   "Gold Coin",
   "Banana",
   "Plate Armor",
   "Protection Amulet",
   "Power Ring",
   "Club Ring"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/kongra"
 },
 {
  "id": "larva",
  "name": "Larva",
  "experience": 44,
  "hp": 70,
  "armor": 5,
  "attack": 20,
  "defense": 11,
  "speed": 22,
  "summonable": true,
  "summonMana": 355,
  "convincible": true,
  "convinceMana": 355,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Paralysis"
  ],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Gold Coin",
   "Meat"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/larva"
 },
 {
  "id": "lich",
  "name": "Lich",
  "experience": 900,
  "hp": 880,
  "armor": 50,
  "attack": 40,
  "defense": 60,
  "speed": 65,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 50–150",
    "target": "on itself"
   },
   {
    "name": "Life Drain Damage",
    "effect": "50–250 life drain damage",
    "target": "on target"
   },
   {
    "name": "Paralysis",
    "effect": "paralysis (0 to -75 speed, 30s)",
    "target": "on target (range 7)"
   },
   {
    "name": "Life Drain Damage",
    "effect": "120–200 life drain damage",
    "target": "area around itself (radius 2)"
   },
   {
    "name": "Summon",
    "effect": "summons up to 4 Bonebeast",
    "target": "area around itself (radius 0)"
   },
   {
    "name": "Life Drain Damage",
    "effect": "100–200 life drain damage",
    "target": "wave (0°, range 8)"
   },
   {
    "name": "Poison (condition) Damage",
    "effect": "300–400 poison (condition) damage",
    "target": "wave (0°, range 8)"
   }
  ],
  "loot": [
   "Staff",
   "Gold Coin",
   "Dirty Cape",
   "Spellbook",
   "Black Pearl",
   "White Pearl",
   "Ring of Healing",
   "Mind Stone",
   "Strange Helmet",
   "Castle Shield",
   "Blue Robe",
   "Platinum Amulet"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/lich"
 },
 {
  "id": "lion",
  "name": "Lion",
  "experience": 30,
  "hp": 80,
  "armor": 6,
  "attack": 20,
  "defense": 13,
  "speed": 55,
  "summonable": true,
  "summonMana": 320,
  "convincible": true,
  "convinceMana": 320,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Meat",
   "Ham"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/lion"
 },
 {
  "id": "lizard-sentinel",
  "name": "Lizard Sentinel",
  "experience": 105,
  "hp": 265,
  "armor": 17,
  "attack": 26,
  "defense": 24,
  "speed": 50,
  "summonable": false,
  "summonMana": null,
  "convincible": true,
  "convinceMana": 560,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [
   "Pushes objects",
   "Sees invisible",
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Physical Damage",
    "effect": "40–70 physical damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Spear",
   "Chain Armor",
   "Scale Armor",
   "Obsidian Lance",
   "Halberd",
   "Sentinel Shield",
   "Small Diamond"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/lizard-sentinel"
 },
 {
  "id": "lizard-snakecharmer",
  "name": "Lizard Snakecharmer",
  "experience": 200,
  "hp": 325,
  "armor": 22,
  "attack": 18,
  "defense": 15,
  "speed": 52,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [
   "Pushes objects",
   "Sees invisible",
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 50–100",
    "target": "on itself"
   },
   {
    "name": "Poison (condition) Damage",
    "effect": "140–200 poison (condition) damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Summon",
    "effect": "summons up to 6 Cobra",
    "target": "area around itself (radius 0)"
   },
   {
    "name": "Poison Damage",
    "effect": "50–100 poison damage",
    "target": "area at target (range 7, radius 0)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Dirty Cape",
   "Cape",
   "Life Crystal",
   "Quagmire Rod",
   "Small Amethyst",
   "Life Ring",
   "Yellow Gem",
   "Charmer'S Tiara",
   "Snakebite Rod"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/lizard-snakecharmer"
 },
 {
  "id": "lizard-templar",
  "name": "Lizard Templar",
  "experience": 145,
  "hp": 410,
  "armor": 26,
  "attack": 30,
  "defense": 20,
  "speed": 47,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [
   "Pushes objects"
  ],
  "attacks": [],
  "loot": [
   "Gold Coin",
   "Short Sword",
   "Sword",
   "Steel Helmet",
   "Plate Armor",
   "Morning Star",
   "Templar Scytheblade",
   "Small Emerald",
   "Salamander Shield"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/lizard-templar"
 },
 {
  "id": "marid",
  "name": "Marid",
  "experience": 300,
  "hp": 550,
  "armor": 24,
  "attack": 35,
  "defense": 35,
  "speed": 77,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison",
   "Energy",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 50–80",
    "target": "on itself"
   },
   {
    "name": "Fire Damage",
    "effect": "40–110 fire damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Energy Damage",
    "effect": "65–115 energy damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Life Drain Damage",
    "effect": "60–120 life drain damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Paralysis",
    "effect": "paralysis (0 to -50 speed, 15s)",
    "target": "on target (range 7)"
   },
   {
    "name": "Drunkenness",
    "effect": "makes you drunk",
    "target": "on target (range 7)"
   },
   {
    "name": "Shapeshift",
    "effect": "changes outfit (looktype 74)",
    "target": "on target (range 7)"
   },
   {
    "name": "Energy (condition) Damage",
    "effect": "60–100 energy (condition) damage",
    "target": "area around itself (radius 2)"
   },
   {
    "name": "Summon",
    "effect": "summons up to 2 Blue Djinn",
    "target": "area around itself (radius 0)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Blueberry",
   "Heavy Machete",
   "Small Oil Lamp",
   "Small Sapphire",
   "Blue Tapestry",
   "Tempest Rod",
   "Wooden Flute",
   "Mystic Turban",
   "Blue Gem"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/marid"
 },
 {
  "id": "merlkin",
  "name": "Merlkin",
  "experience": 135,
  "hp": 230,
  "armor": 16,
  "attack": 15,
  "defense": 40,
  "speed": 57,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Energy"
  ],
  "behavior": [
   "Pushes objects",
   "Sees invisible",
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 10–40",
    "target": "on itself"
   },
   {
    "name": "Fire Damage",
    "effect": "30–90 fire damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Energy Damage",
    "effect": "15–45 energy damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Field",
    "effect": "creates a poison field",
    "target": "area at target (range 7, radius 0)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Banana",
   "Magic Light Wand",
   "Orange",
   "Wand of Plague",
   "Small Amethyst",
   "Banana Staff"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/merlkin"
 },
 {
  "id": "minotaur",
  "name": "Minotaur",
  "experience": 50,
  "hp": 100,
  "armor": 11,
  "attack": 15,
  "defense": 11,
  "speed": 44,
  "summonable": true,
  "summonMana": 330,
  "convincible": true,
  "convinceMana": 330,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Gold Coin",
   "Plate Shield",
   "Leather Legs",
   "Mace",
   "Chain Armor",
   "Meat",
   "Sword",
   "Brass Helmet",
   "Chain Helmet",
   "Axe",
   "Shovel",
   "Bronze Amulet"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/minotaur"
 },
 {
  "id": "minotaur-archer",
  "name": "Minotaur Archer",
  "experience": 65,
  "hp": 100,
  "armor": 7,
  "attack": 15,
  "defense": 8,
  "speed": 40,
  "summonable": true,
  "summonMana": 390,
  "convincible": true,
  "convinceMana": 390,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Physical Damage",
    "effect": "45–85 physical damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Bolt",
   "Gold Coin",
   "Crossbow",
   "Meat",
   "Leather Helmet",
   "Leather Legs",
   "Brass Armor",
   "Soldier Helmet",
   "Scale Armor"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/minotaur-archer"
 },
 {
  "id": "minotaur-guard",
  "name": "Minotaur Guard",
  "experience": 160,
  "hp": 185,
  "armor": 15,
  "attack": 35,
  "defense": 32,
  "speed": 55,
  "summonable": true,
  "summonMana": 550,
  "convincible": true,
  "convinceMana": 550,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Pushes objects",
   "Pushes creatures"
  ],
  "attacks": [],
  "loot": [
   "Gold Coin",
   "Leather Legs",
   "Hatchet",
   "Meat",
   "Fishing Rod",
   "Brass Armor",
   "Chain Armor",
   "Battle Shield",
   "Chain Legs",
   "Double Axe"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/minotaur-guard"
 },
 {
  "id": "minotaur-mage",
  "name": "Minotaur Mage",
  "experience": 150,
  "hp": 155,
  "armor": 18,
  "attack": 15,
  "defense": 40,
  "speed": 45,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Energy"
  ],
  "behavior": [
   "Pushes objects",
   "Sees invisible",
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Energy Damage",
    "effect": "15–45 energy damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Fire Damage",
    "effect": "35–95 fire damage",
    "target": "area at target (range 7, radius 0)"
   },
   {
    "name": "Field",
    "effect": "creates a energy field",
    "target": "area at target (range 7, radius 0)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Torch",
   "Leather Legs",
   "Carrot",
   "Knife",
   "Leather Helmet",
   "Brass Armor",
   "Combat Knife",
   "Chain Legs",
   "Wand of Cosmic Energy"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/minotaur-mage"
 },
 {
  "id": "monk",
  "name": "Monk",
  "experience": 200,
  "hp": 240,
  "armor": 25,
  "attack": 42,
  "defense": 52,
  "speed": 80,
  "summonable": true,
  "summonMana": 600,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 30–50",
    "target": "on itself"
   },
   {
    "name": "Haste",
    "effect": "haste (+50–60 speed, 2s)",
    "target": "on itself"
   }
  ],
  "loot": [
   "Bread",
   "Scroll",
   "Gold Coin",
   "Bag",
   "Staff",
   "Lamp",
   "Brown Flask",
   "Sandals",
   "Leather Armor",
   "Life Crystal",
   "Ankh",
   "Power Ring"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/monk"
 },
 {
  "id": "mummy",
  "name": "Mummy",
  "experience": 150,
  "hp": 240,
  "armor": 14,
  "attack": 32,
  "defense": 23,
  "speed": 35,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Life Drain Damage",
    "effect": "30–40 life drain damage",
    "target": "on target"
   },
   {
    "name": "Paralysis",
    "effect": "paralysis (0 to -40 speed, 10s)",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Worm",
   "Gold Coin",
   "Magic Light Wand",
   "Short Sword",
   "Strange Talisman",
   "Silver Brooch",
   "Poison Dagger",
   "Crystal Ring",
   "Black Pearl",
   "Black Shield",
   "Silver Amulet"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/mummy"
 },
 {
  "id": "necromancer",
  "name": "Necromancer",
  "experience": 580,
  "hp": 580,
  "armor": 50,
  "attack": 40,
  "defense": 40,
  "speed": 54,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Life Drain"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible",
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 42–68",
    "target": "on itself"
   },
   {
    "name": "Life Drain Damage",
    "effect": "60–100 life drain damage",
    "target": "on target"
   },
   {
    "name": "Poison Damage",
    "effect": "35–95 poison damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Summon",
    "effect": "summons up to 2 Ghoul",
    "target": "area around itself (radius 0)"
   },
   {
    "name": "Summon",
    "effect": "summons up to 1 Ghost",
    "target": "area around itself (radius 0)"
   },
   {
    "name": "Summon",
    "effect": "summons up to 1 Mummy",
    "target": "area around itself (radius 0)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Short Sword",
   "Scale Armor",
   "Green Mushroom",
   "Clerical Mace",
   "Mystic Turban",
   "Boots of Haste",
   "Skull Staff"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/necromancer"
 },
 {
  "id": "orc",
  "name": "Orc",
  "experience": 25,
  "hp": 70,
  "armor": 4,
  "attack": 13,
  "defense": 8,
  "speed": 35,
  "summonable": true,
  "summonMana": 300,
  "convincible": true,
  "convinceMana": 300,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Gold Coin",
   "Meat",
   "Studded Armor",
   "Studded Shield",
   "Studded Helmet",
   "Axe",
   "Sabre"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/orc"
 },
 {
  "id": "orc-berserker",
  "name": "Orc Berserker",
  "experience": 195,
  "hp": 210,
  "armor": 12,
  "attack": 65,
  "defense": 12,
  "speed": 85,
  "summonable": true,
  "summonMana": 590,
  "convincible": true,
  "convinceMana": 590,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures"
  ],
  "attacks": [
   {
    "name": "Haste",
    "effect": "haste (+45–55 speed, 6s)",
    "target": "on itself"
   }
  ],
  "loot": [
   "Gold Coin",
   "Ham",
   "Chain Helmet",
   "Chain Armor",
   "Lamp",
   "Halberd",
   "Battle Axe"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/orc-berserker"
 },
 {
  "id": "orc-leader",
  "name": "Orc Leader",
  "experience": 270,
  "hp": 450,
  "armor": 20,
  "attack": 48,
  "defense": 45,
  "speed": 75,
  "summonable": true,
  "summonMana": 640,
  "convincible": true,
  "convinceMana": 640,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Physical Damage",
    "effect": "50–70 physical damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Fish",
   "Gold Coin",
   "Dagger",
   "Backpack",
   "Meat",
   "Scimitar",
   "Plate Shield",
   "Throwing Knife",
   "Longsword",
   "Sword Ring",
   "Brass Legs",
   "Plate Armor",
   "Broadsword",
   "Plate Legs",
   "Warrior Helmet"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/orc-leader"
 },
 {
  "id": "orc-rider",
  "name": "Orc Rider",
  "experience": 110,
  "hp": 180,
  "armor": 9,
  "attack": 41,
  "defense": 20,
  "speed": 90,
  "summonable": false,
  "summonMana": null,
  "convincible": true,
  "convinceMana": 490,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Pushes objects",
   "Pushes creatures"
  ],
  "attacks": [
   {
    "name": "Haste",
    "effect": "haste (+40–50 speed, 6s)",
    "target": "on itself"
   }
  ],
  "loot": [
   "Gold Coin",
   "Backpack",
   "Meat",
   "Orcish Axe",
   "Studded Helmet",
   "Wolf Tooth Chain",
   "Torch",
   "Battle Shield",
   "Obsidian Lance",
   "Scale Armor"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/orc-rider"
 },
 {
  "id": "orc-shaman",
  "name": "Orc Shaman",
  "experience": 110,
  "hp": 115,
  "armor": 8,
  "attack": 13,
  "defense": 10,
  "speed": 30,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Energy"
  ],
  "behavior": [
   "Sees invisible",
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 27–43",
    "target": "on itself"
   },
   {
    "name": "Energy Damage",
    "effect": "20–30 energy damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Summon",
    "effect": "summons up to 4 Snake",
    "target": "area around itself (radius 0)"
   },
   {
    "name": "Fire Damage",
    "effect": "5–45 fire damage",
    "target": "area at target (range 7, radius 0)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Bag",
   "Corncob",
   "Spear",
   "Chain Armor",
   "Chain Helmet",
   "Staff",
   "Book",
   "Wand of Plague"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/orc-shaman"
 },
 {
  "id": "orc-spearman",
  "name": "Orc Spearman",
  "experience": 38,
  "hp": 105,
  "armor": 6,
  "attack": 17,
  "defense": 12,
  "speed": 48,
  "summonable": true,
  "summonMana": 310,
  "convincible": true,
  "convinceMana": 310,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Physical Damage",
    "effect": "16–40 physical damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Meat",
   "Spear",
   "Gold Coin",
   "Machete",
   "Studded Legs",
   "Studded Helmet",
   "Dirty Fur"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/orc-spearman"
 },
 {
  "id": "orc-warlord",
  "name": "Orc Warlord",
  "experience": 670,
  "hp": 950,
  "armor": 28,
  "attack": 68,
  "defense": 55,
  "speed": 77,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Shapeshift",
    "effect": "changes outfit (looktype 0)",
    "target": "on itself"
   },
   {
    "name": "Physical Damage",
    "effect": "100–120 physical damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Throwing Star",
   "Meat",
   "Gold Coin",
   "Orcish Axe",
   "Scimitar",
   "Brass Legs",
   "Fish",
   "Plate Armor",
   "Plate Legs",
   "Protection Amulet",
   "Two Handed Sword",
   "Dark Helmet",
   "Brass Armor",
   "Crusader Helmet",
   "Dragon Hammer",
   "Stealth Ring"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/orc-warlord"
 },
 {
  "id": "orc-warrior",
  "name": "Orc Warrior",
  "experience": 50,
  "hp": 125,
  "armor": 8,
  "attack": 19,
  "defense": 14,
  "speed": 55,
  "summonable": true,
  "summonMana": 360,
  "convincible": true,
  "convinceMana": 360,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Gold Coin",
   "Sabre",
   "Wooden Shield",
   "Meat",
   "Chain Armor",
   "Bottle",
   "Copper Shield",
   "Poison Dagger"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/orc-warrior"
 },
 {
  "id": "panda",
  "name": "Panda",
  "experience": 23,
  "hp": 80,
  "armor": 8,
  "attack": 15,
  "defense": 8,
  "speed": 38,
  "summonable": true,
  "summonMana": 300,
  "convincible": true,
  "convinceMana": 300,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Meat",
   "Ham"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/panda"
 },
 {
  "id": "parrot",
  "name": "Parrot",
  "experience": 0,
  "hp": 25,
  "armor": 2,
  "attack": 6,
  "defense": 6,
  "speed": 120,
  "summonable": true,
  "summonMana": 250,
  "convincible": true,
  "convinceMana": 250,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/parrot"
 },
 {
  "id": "pig",
  "name": "Pig",
  "experience": 0,
  "hp": 25,
  "armor": 2,
  "attack": 0,
  "defense": 2,
  "speed": 17,
  "summonable": true,
  "summonMana": 255,
  "convincible": true,
  "convinceMana": 255,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Meat"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/pig"
 },
 {
  "id": "poison-spider",
  "name": "Poison Spider",
  "experience": 22,
  "hp": 26,
  "armor": 2,
  "attack": 12,
  "defense": 6,
  "speed": 40,
  "summonable": true,
  "summonMana": 270,
  "convincible": true,
  "convinceMana": 270,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Gold Coin"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/poison-spider"
 },
 {
  "id": "polar-bear",
  "name": "Polar Bear",
  "experience": 28,
  "hp": 85,
  "armor": 7,
  "attack": 18,
  "defense": 10,
  "speed": 38,
  "summonable": true,
  "summonMana": 315,
  "convincible": true,
  "convinceMana": 315,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Meat",
   "Ham"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/polar-bear"
 },
 {
  "id": "priestess",
  "name": "Priestess",
  "experience": 420,
  "hp": 390,
  "armor": 30,
  "attack": 20,
  "defense": 50,
  "speed": 45,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison",
   "Energy"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible",
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 34–56",
    "target": "on itself"
   },
   {
    "name": "Physical Damage",
    "effect": "55–95 physical damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Mana Drain Damage",
    "effect": "60–120 mana drain damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Summon",
    "effect": "summons up to 2 Ghoul",
    "target": "area around itself (radius 0)"
   }
  ],
  "loot": [
   "Dagger",
   "Bowl",
   "Sling Herb",
   "Goat Grass",
   "Red Apple",
   "Book",
   "Powder Herb",
   "Wood Mushroom",
   "Clerical Mace",
   "Wooden Flute",
   "Crystal Ball",
   "Tempest Rod",
   "Talon",
   "Crystal Necklace",
   "Black Shield"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/priestess"
 },
 {
  "id": "rabbit",
  "name": "Rabbit",
  "experience": 0,
  "hp": 15,
  "armor": 1,
  "attack": 0,
  "defense": 2,
  "speed": 50,
  "summonable": true,
  "summonMana": 220,
  "convincible": true,
  "convinceMana": 220,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Meat",
   "Carrot"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/rabbit"
 },
 {
  "id": "rat",
  "name": "Rat",
  "experience": 5,
  "hp": 20,
  "armor": 1,
  "attack": 7,
  "defense": 3,
  "speed": 27,
  "summonable": true,
  "summonMana": 200,
  "convincible": true,
  "convinceMana": 200,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Gold Coin",
   "Worm",
   "Cheese"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/rat"
 },
 {
  "id": "rotworm",
  "name": "Rotworm",
  "experience": 40,
  "hp": 65,
  "armor": 8,
  "attack": 18,
  "defense": 11,
  "speed": 18,
  "summonable": false,
  "summonMana": null,
  "convincible": true,
  "convinceMana": 305,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Gold Coin",
   "Worm",
   "Ham",
   "Meat",
   "Mace",
   "Sword",
   "Legion Helmet",
   "Copper Shield",
   "Katana"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/rotworm"
 },
 {
  "id": "scarab",
  "name": "Scarab",
  "experience": 120,
  "hp": 320,
  "armor": 21,
  "attack": 25,
  "defense": 26,
  "speed": 40,
  "summonable": true,
  "summonMana": 395,
  "convincible": true,
  "convinceMana": 395,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures"
  ],
  "attacks": [
   {
    "name": "Haste",
    "effect": "haste (+40–50 speed, 4s)",
    "target": "on itself"
   },
   {
    "name": "Field",
    "effect": "creates a poison field",
    "target": "area around itself (radius 0)"
   },
   {
    "name": "Poison Damage",
    "effect": "15–25 poison damage",
    "target": "area at target (range 1, radius 0)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Meat",
   "Arrow",
   "Scarab Coin",
   "Heavy Machete",
   "Small Amethyst",
   "Daramanian Mace",
   "Small Emerald"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/scarab"
 },
 {
  "id": "scorpion",
  "name": "Scorpion",
  "experience": 45,
  "hp": 45,
  "armor": 14,
  "attack": 21,
  "defense": 5,
  "speed": 35,
  "summonable": true,
  "summonMana": 310,
  "convincible": true,
  "convinceMana": 310,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [],
  "attacks": [],
  "loot": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/scorpion"
 },
 {
  "id": "serpent-spawn",
  "name": "Serpent Spawn",
  "experience": 2000,
  "hp": 3000,
  "armor": 38,
  "attack": 62,
  "defense": 40,
  "speed": 77,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 300–400",
    "target": "on itself"
   },
   {
    "name": "Haste",
    "effect": "haste (+90–100 speed, 3s)",
    "target": "on itself"
   },
   {
    "name": "Poison Damage",
    "effect": "100–300 poison damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Shapeshift",
    "effect": "turns into item #3492",
    "target": "on target (range 7)"
   },
   {
    "name": "Paralysis",
    "effect": "paralysis (0 to -55 speed, 120s)",
    "target": "area at target (range 7, radius 3)"
   },
   {
    "name": "Life Drain Damage",
    "effect": "150–400 life drain damage",
    "target": "wave (0°, range 8)"
   },
   {
    "name": "Poison Damage",
    "effect": "50–500 poison damage",
    "target": "wave (30°, range 8)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Green Mushroom",
   "Book",
   "Power Bolt",
   "Small Sapphire",
   "Energy Ring",
   "Golden Mug",
   "Life Ring",
   "Charmer'S Tiara",
   "Snakebite Rod",
   "Life Crystal",
   "Strange Helmet",
   "Old Parchment",
   "Tower Shield",
   "Fire Sword",
   "Dragon Scale Mail",
   "Royal Helmet"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/serpent-spawn"
 },
 {
  "id": "sheep",
  "name": "Sheep",
  "experience": 0,
  "hp": 20,
  "armor": 1,
  "attack": 0,
  "defense": 2,
  "speed": 18,
  "summonable": true,
  "summonMana": 250,
  "convincible": true,
  "convinceMana": 250,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Meat"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/sheep"
 },
 {
  "id": "sibang",
  "name": "Sibang",
  "experience": 100,
  "hp": 225,
  "armor": 15,
  "attack": 20,
  "defense": 32,
  "speed": 67,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Pushes objects",
   "Sees invisible",
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Haste",
    "effect": "haste (+70–80 speed, 3s)",
    "target": "on itself"
   },
   {
    "name": "Physical Damage",
    "effect": "35–55 physical damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Banana",
   "Small Stone",
   "Coconut",
   "Orange",
   "Melon",
   "Chain Helmet"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/sibang"
 },
 {
  "id": "skeleton",
  "name": "Skeleton",
  "experience": 35,
  "hp": 50,
  "armor": 2,
  "attack": 14,
  "defense": 9,
  "speed": 37,
  "summonable": true,
  "summonMana": 300,
  "convincible": true,
  "convinceMana": 300,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Life Drain"
  ],
  "behavior": [],
  "attacks": [
   {
    "name": "Life Drain Damage",
    "effect": "7–13 life drain damage",
    "target": "on target"
   }
  ],
  "loot": [
   "Bone",
   "Torch",
   "Gold Coin",
   "Hatchet",
   "Mace",
   "Brass Shield",
   "Viking Helmet",
   "Sword"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/skeleton"
 },
 {
  "id": "skunk",
  "name": "Skunk",
  "experience": 3,
  "hp": 20,
  "armor": 1,
  "attack": 4,
  "defense": 5,
  "speed": 28,
  "summonable": true,
  "summonMana": 200,
  "convincible": true,
  "convinceMana": 200,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [
   {
    "name": "Poison Damage",
    "effect": "1–3 poison damage",
    "target": "area at target (range 1, radius 0)"
   }
  ],
  "loot": [
   "Worm",
   "Meat"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/skunk"
 },
 {
  "id": "slime",
  "name": "Slime",
  "experience": 160,
  "hp": 150,
  "armor": 3,
  "attack": 42,
  "defense": 10,
  "speed": 20,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [
   "Pushes objects"
  ],
  "attacks": [
   {
    "name": "Summon",
    "effect": "summons up to 3 Slime",
    "target": "area around itself (radius 0)"
   }
  ],
  "loot": [],
  "notes": [
   "The source contains separate Slime entities. This record is the 160 XP mother slime; summoned copies must not be counted as identical hunt XP."
  ],
  "sourceUrl": "https://primibia.com/wiki/monsters/slime"
 },
 {
  "id": "smuggler",
  "name": "Smuggler",
  "experience": 48,
  "hp": 130,
  "armor": 10,
  "attack": 19,
  "defense": 13,
  "speed": 48,
  "summonable": true,
  "summonMana": 390,
  "convincible": true,
  "convinceMana": 390,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Pushes objects"
  ],
  "attacks": [],
  "loot": [
   "Gold Coin",
   "Meat",
   "Torch",
   "Leather Legs",
   "Ham",
   "Knife",
   "Leather Helmet",
   "Short Sword",
   "Sword",
   "Combat Knife"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/smuggler"
 },
 {
  "id": "snake",
  "name": "Snake",
  "experience": 10,
  "hp": 15,
  "armor": 0,
  "attack": 5,
  "defense": 1,
  "speed": 20,
  "summonable": true,
  "summonMana": 205,
  "convincible": true,
  "convinceMana": 205,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [],
  "attacks": [],
  "loot": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/snake"
 },
 {
  "id": "spider",
  "name": "Spider",
  "experience": 12,
  "hp": 20,
  "armor": 2,
  "attack": 7,
  "defense": 2,
  "speed": 36,
  "summonable": true,
  "summonMana": 210,
  "convincible": true,
  "convinceMana": 210,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Gold Coin"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/spider"
 },
 {
  "id": "spit-nettle",
  "name": "Spit Nettle",
  "experience": 20,
  "hp": 150,
  "armor": 12,
  "attack": 9,
  "defense": 33,
  "speed": -1,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Energy",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 8–16",
    "target": "on itself"
   },
   {
    "name": "Poison Damage",
    "effect": "17–37 poison damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Poison (condition) Damage",
    "effect": "22–38 poison (condition) damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Shadow Herb",
   "Sling Herb",
   "Grave Flower"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/spit-nettle"
 },
 {
  "id": "stalker",
  "name": "Stalker",
  "experience": 90,
  "hp": 120,
  "armor": 14,
  "attack": 30,
  "defense": 20,
  "speed": 90,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Life Drain"
  ],
  "behavior": [
   "Pushes objects",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Shapeshift",
    "effect": "changes outfit (looktype 0)",
    "target": "on itself"
   },
   {
    "name": "Life Drain Damage",
    "effect": "20–30 life drain damage",
    "target": "on target"
   }
  ],
  "loot": [
   "Gold Coin",
   "Throwing Knife",
   "Leather Legs",
   "Blank Rune",
   "Katana",
   "Brass Shield",
   "Backpack",
   "Brass Legs",
   "Obsidian Lance"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/stalker"
 },
 {
  "id": "stone-golem",
  "name": "Stone Golem",
  "experience": 160,
  "hp": 270,
  "armor": 30,
  "attack": 38,
  "defense": 25,
  "speed": 50,
  "summonable": true,
  "summonMana": 590,
  "convincible": true,
  "convinceMana": 590,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures"
  ],
  "attacks": [],
  "loot": [
   "Gold Coin",
   "Small Stone",
   "Steel Shield",
   "Torch",
   "Power Ring",
   "Scale Armor",
   "Carlin Sword",
   "Crystal Ring",
   "Red Gem"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/stone-golem"
 },
 {
  "id": "swamp-troll",
  "name": "Swamp Troll",
  "experience": 25,
  "hp": 55,
  "armor": 6,
  "attack": 12,
  "defense": 10,
  "speed": 24,
  "summonable": true,
  "summonMana": 320,
  "convincible": true,
  "convinceMana": 320,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Fish",
   "Gold Coin",
   "Dagger",
   "Torch",
   "Leather Boots",
   "Fishing Rod"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/swamp-troll"
 },
 {
  "id": "tarantula",
  "name": "Tarantula",
  "experience": 120,
  "hp": 225,
  "armor": 20,
  "attack": 38,
  "defense": 20,
  "speed": 67,
  "summonable": true,
  "summonMana": 485,
  "convincible": true,
  "convinceMana": 485,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [
   "Pushes objects"
  ],
  "attacks": [
   {
    "name": "Haste",
    "effect": "haste (+80–110 speed, 2s)",
    "target": "on itself"
   },
   {
    "name": "Field",
    "effect": "creates a poison field",
    "target": "on target"
   }
  ],
  "loot": [
   "Gold Coin",
   "Brass Legs",
   "Plate Shield",
   "Steel Helmet",
   "Time Ring"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/tarantula"
 },
 {
  "id": "terror-bird",
  "name": "Terror Bird",
  "experience": 150,
  "hp": 300,
  "armor": 13,
  "attack": 37,
  "defense": 21,
  "speed": 66,
  "summonable": true,
  "summonMana": 490,
  "convincible": true,
  "convinceMana": 490,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Pushes objects",
   "Pushes creatures"
  ],
  "attacks": [],
  "loot": [
   "Gold Coin",
   "Meat",
   "Worm",
   "Feather Headdress"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/terror-bird"
 },
 {
  "id": "tiger",
  "name": "Tiger",
  "experience": 40,
  "hp": 75,
  "armor": 5,
  "attack": 15,
  "defense": 15,
  "speed": 60,
  "summonable": true,
  "summonMana": 420,
  "convincible": true,
  "convinceMana": 420,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Pushes objects",
   "Pushes creatures"
  ],
  "attacks": [
   {
    "name": "Haste",
    "effect": "haste (+70–100 speed, 3s)",
    "target": "on itself"
   }
  ],
  "loot": [
   "Meat",
   "Ham"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/tiger"
 },
 {
  "id": "troll",
  "name": "Troll",
  "experience": 20,
  "hp": 50,
  "armor": 6,
  "attack": 10,
  "defense": 8,
  "speed": 23,
  "summonable": true,
  "summonMana": 290,
  "convincible": true,
  "convinceMana": 290,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Gold Coin",
   "Spear",
   "Hand Axe",
   "Meat",
   "Wooden Shield",
   "Leather Boots",
   "Leather Helmet",
   "Rope",
   "Studded Club",
   "Silver Amulet"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/troll"
 },
 {
  "id": "valkyrie",
  "name": "Valkyrie",
  "experience": 85,
  "hp": 190,
  "armor": 12,
  "attack": 20,
  "defense": 14,
  "speed": 48,
  "summonable": true,
  "summonMana": 450,
  "convincible": true,
  "convinceMana": 450,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Pushes objects"
  ],
  "attacks": [
   {
    "name": "Physical Damage",
    "effect": "28–42 physical damage",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Skull",
   "Spear",
   "Gold Coin",
   "Meat",
   "Dagger",
   "Chain Armor",
   "Red Apple",
   "Chain Helmet",
   "Protection Amulet",
   "Plate Armor",
   "Double Axe",
   "Small Diamond"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/valkyrie"
 },
 {
  "id": "vampire",
  "name": "Vampire",
  "experience": 290,
  "hp": 450,
  "armor": 27,
  "attack": 42,
  "defense": 38,
  "speed": 70,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Life Drain",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Shapeshift",
    "effect": "changes outfit (looktype 122)",
    "target": "on itself"
   },
   {
    "name": "Life Drain Damage",
    "effect": "55–105 life drain damage",
    "target": "on target"
   },
   {
    "name": "Paralysis",
    "effect": "paralysis (0 to -50 speed, 30s)",
    "target": "on target (range 7)"
   }
  ],
  "loot": [
   "Grave Flower",
   "Gold Coin",
   "Katana",
   "Bowl",
   "Skull",
   "Leather Legs",
   "Black Pearl",
   "Spike Sword",
   "Strange Helmet",
   "Ice Rapier",
   "Bronze Amulet",
   "Emerald Bangle",
   "Vampire Shield"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/vampire"
 },
 {
  "id": "war-wolf",
  "name": "War Wolf",
  "experience": 55,
  "hp": 140,
  "armor": 8,
  "attack": 24,
  "defense": 16,
  "speed": 92,
  "summonable": false,
  "summonMana": null,
  "convincible": true,
  "convinceMana": 420,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [
   "Pushes objects"
  ],
  "attacks": [],
  "loot": [
   "Meat",
   "Ham"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/war-wolf"
 },
 {
  "id": "warlock",
  "name": "Warlock",
  "experience": 4000,
  "hp": 3200,
  "armor": 32,
  "attack": 40,
  "defense": 50,
  "speed": 75,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Fire",
   "Poison",
   "Energy",
   "Paralysis"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible",
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Healing",
    "effect": "heals 60–100",
    "target": "on itself"
   },
   {
    "name": "Shapeshift",
    "effect": "changes outfit (looktype 0)",
    "target": "on itself"
   },
   {
    "name": "Physical Damage",
    "effect": "45–105 physical damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Mana Drain Damage",
    "effect": "35–75 mana drain damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Paralysis",
    "effect": "paralysis (0 to -60 speed, 40s)",
    "target": "on target (range 7)"
   },
   {
    "name": "Summon",
    "effect": "summons up to 1 Stone Golem",
    "target": "area around itself (radius 0)"
   },
   {
    "name": "Fire Damage",
    "effect": "90–170 fire damage",
    "target": "area at target (range 7, radius 2)"
   },
   {
    "name": "Field",
    "effect": "creates a fire field",
    "target": "area at target (range 7, radius 0)"
   },
   {
    "name": "Field",
    "effect": "creates a fire field",
    "target": "area at target (range 7, radius 1)"
   },
   {
    "name": "Energy Damage",
    "effect": "145–205 energy damage",
    "target": "wave (0°, range 8)"
   }
  ],
  "loot": [
   "Gold Coin",
   "Cherry",
   "Candlestick",
   "Inkwell",
   "Bread",
   "Poison Dagger",
   "Skull Staff",
   "Dark Mushroom",
   "Energy Ring",
   "Mind Stone",
   "Blue Robe",
   "Small Sapphire",
   "Talon",
   "Crystal Ring",
   "Stone Skin Amulet",
   "Red Tome",
   "Golden Armor",
   "Ring of the Sky"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/warlock"
 },
 {
  "id": "wasp",
  "name": "Wasp",
  "experience": 24,
  "hp": 35,
  "armor": 4,
  "attack": 12,
  "defense": 8,
  "speed": 120,
  "summonable": true,
  "summonMana": 280,
  "convincible": true,
  "convinceMana": 280,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [
   "Poison"
  ],
  "behavior": [],
  "attacks": [],
  "loot": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/wasp"
 },
 {
  "id": "wild-warrior",
  "name": "Wild Warrior",
  "experience": 60,
  "hp": 135,
  "armor": 9,
  "attack": 16,
  "defense": 18,
  "speed": 55,
  "summonable": true,
  "summonMana": 420,
  "convincible": true,
  "convinceMana": 420,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [
   {
    "name": "Haste",
    "effect": "haste (+20–60 speed, 2s)",
    "target": "on itself"
   }
  ],
  "loot": [
   "Gold Coin",
   "Meat",
   "Axe",
   "Brass Shield",
   "Leather Legs",
   "Mace",
   "Chain Helmet",
   "Brass Armor",
   "Steel Shield",
   "Doll",
   "Iron Helmet",
   "War Hammer"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/wild-warrior"
 },
 {
  "id": "winter-wolf",
  "name": "Winter Wolf",
  "experience": 20,
  "hp": 30,
  "armor": 2,
  "attack": 13,
  "defense": 6,
  "speed": 45,
  "summonable": true,
  "summonMana": 260,
  "convincible": true,
  "convinceMana": 260,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Meat"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/winter-wolf"
 },
 {
  "id": "witch",
  "name": "Witch",
  "experience": 120,
  "hp": 300,
  "armor": 8,
  "attack": 18,
  "defense": 12,
  "speed": 62,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Poison",
   "Energy"
  ],
  "behavior": [
   "Pushes objects",
   "Sees invisible",
   "Keeps distance"
  ],
  "attacks": [
   {
    "name": "Fire Damage",
    "effect": "25–55 fire damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Field",
    "effect": "creates a fire field",
    "target": "area at target (range 7, radius 0)"
   }
  ],
  "loot": [
   "Cape",
   "Leather Boots",
   "Cheese",
   "Sickle",
   "Cookie",
   "Broom",
   "Coat",
   "Gold Coin",
   "Wolf Tooth Chain",
   "Star Herb",
   "Garlic Necklace",
   "Volcanic Rod",
   "Silver Dagger"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/witch"
 },
 {
  "id": "wolf",
  "name": "Wolf",
  "experience": 18,
  "hp": 25,
  "armor": 1,
  "attack": 12,
  "defense": 4,
  "speed": 42,
  "summonable": true,
  "summonMana": 255,
  "convincible": true,
  "convinceMana": 255,
  "seesInvisible": false,
  "canTurnInvisible": null,
  "immunities": [],
  "behavior": [],
  "attacks": [],
  "loot": [
   "Meat",
   "Worm"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/wolf"
 },
 {
  "id": "yeti",
  "name": "Yeti",
  "experience": 460,
  "hp": 950,
  "armor": 28,
  "attack": 53,
  "defense": 43,
  "speed": 85,
  "summonable": false,
  "summonMana": null,
  "convincible": false,
  "convinceMana": null,
  "seesInvisible": true,
  "canTurnInvisible": null,
  "immunities": [
   "Energy"
  ],
  "behavior": [
   "Pushes objects",
   "Pushes creatures",
   "Sees invisible"
  ],
  "attacks": [
   {
    "name": "Physical Damage",
    "effect": "170–200 physical damage",
    "target": "on target (range 7)"
   },
   {
    "name": "Energy Damage",
    "effect": "120–210 energy damage",
    "target": "wave (30°, range 3)"
   }
  ],
  "loot": [
   "Meat",
   "Gold Coin",
   "Snowball",
   "Ham",
   "Wolf Tooth Chain",
   "Bunnyslippers"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/monsters/yeti"
 }
];
export const creatures: CreatureRecord[] = rawCreatures.map(c => ({...c, sourceIds:['primibia'], evidence:evidenceFor(c as unknown as Record<string,unknown>,c.sourceUrl,['experience','hp','armor','attack','defense','speed','summonable','summonMana','convincible','convinceMana','seesInvisible','canTurnInvisible','immunities','behavior','attacks','loot'])}));

const rawSpells: Omit<SpellRecord,'sourceIds'|'evidence'>[] = [
 {
  "id": "animate-dead",
  "name": "Animate Dead",
  "words": "adana mort",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "sorcerer",
   "druid"
  ],
  "level": 27,
  "mana": 600,
  "runeCharges": 1,
  "soulCost": 5,
  "useLevel": null,
  "useMagicLevel": 4,
  "premium": true,
  "promotion": false,
  "price": 1200,
  "teachers": [
   "ursula"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/animate-dead"
 },
 {
  "id": "antidote",
  "name": "Antidote",
  "words": "exana pox",
  "type": "instant",
  "category": "Healing",
  "vocations": [
   "knight",
   "paladin",
   "sorcerer",
   "druid"
  ],
  "level": 10,
  "mana": 30,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": false,
  "promotion": false,
  "price": 150,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/antidote"
 },
 {
  "id": "antidote-rune",
  "name": "Antidote Rune",
  "words": "adana pox",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "druid"
  ],
  "level": 15,
  "mana": 200,
  "runeCharges": 1,
  "soulCost": 1,
  "useLevel": null,
  "useMagicLevel": 0,
  "premium": false,
  "promotion": false,
  "price": 600,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/antidote-rune"
 },
 {
  "id": "berserk",
  "name": "Berserk",
  "words": "exori",
  "type": "instant",
  "category": "Attack",
  "vocations": [
   "knight"
  ],
  "level": 35,
  "mana": null,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": false,
  "price": 2500,
  "teachers": [
   "puffels"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/berserk"
 },
 {
  "id": "cancel-invisibility",
  "name": "Cancel Invisibility",
  "words": "exana ina",
  "type": "instant",
  "category": "Support",
  "vocations": [
   "sorcerer"
  ],
  "level": 26,
  "mana": 200,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": false,
  "price": 1600,
  "teachers": [
   "gundralph"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/cancel-invisibility"
 },
 {
  "id": "challenge",
  "name": "Challenge",
  "words": "exeta res",
  "type": "instant",
  "category": "Attack",
  "vocations": null,
  "level": 20,
  "mana": 30,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": null,
  "price": 2000,
  "teachers": [
   "eremo"
  ],
  "notes": [
   "The source's vocation assignment is disputed. Creation/casting eligibility is intentionally unknown until the promotion-specific teacher rules are corroborated."
  ],
  "sourceUrl": "https://primibia.com/wiki/spells/challenge"
 },
 {
  "id": "chameleon",
  "name": "Chameleon",
  "words": "adevo ina",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "druid"
  ],
  "level": 27,
  "mana": 600,
  "runeCharges": 1,
  "soulCost": 2,
  "useLevel": null,
  "useMagicLevel": 4,
  "premium": false,
  "promotion": false,
  "price": 1300,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/chameleon"
 },
 {
  "id": "conjure-arrow",
  "name": "Conjure Arrow",
  "words": "exevo con",
  "type": "instant",
  "category": "Support",
  "vocations": [
   "paladin"
  ],
  "level": 13,
  "mana": 100,
  "runeCharges": null,
  "soulCost": 1,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": false,
  "promotion": false,
  "price": 450,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/conjure-arrow"
 },
 {
  "id": "conjure-bolt",
  "name": "Conjure Bolt",
  "words": "exevo con mort",
  "type": "instant",
  "category": "Support",
  "vocations": [
   "paladin"
  ],
  "level": 17,
  "mana": 140,
  "runeCharges": null,
  "soulCost": 2,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": false,
  "price": 750,
  "teachers": [
   "ursula"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/conjure-bolt"
 },
 {
  "id": "convince-creature",
  "name": "Convince Creature",
  "words": "adeta sio",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "druid"
  ],
  "level": 16,
  "mana": 200,
  "runeCharges": 1,
  "soulCost": 3,
  "useLevel": null,
  "useMagicLevel": 5,
  "premium": false,
  "promotion": false,
  "price": 800,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/convince-creature"
 },
 {
  "id": "creature-illusion",
  "name": "Creature Illusion",
  "words": "utevo res ina \"creature\"",
  "type": "instant",
  "category": "Support",
  "vocations": [
   "sorcerer",
   "druid"
  ],
  "level": 23,
  "mana": 100,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": false,
  "promotion": false,
  "price": 1000,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/creature-illusion"
 },
 {
  "id": "desintegrate",
  "name": "Desintegrate",
  "words": "adito tera",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "paladin",
   "sorcerer",
   "druid"
  ],
  "level": 21,
  "mana": 200,
  "runeCharges": 3,
  "soulCost": 3,
  "useLevel": null,
  "useMagicLevel": 4,
  "premium": true,
  "promotion": false,
  "price": 900,
  "teachers": [
   "ursula"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/desintegrate"
 },
 {
  "id": "destroy-field",
  "name": "Destroy Field",
  "words": "adito grav",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "paladin",
   "sorcerer",
   "druid"
  ],
  "level": 17,
  "mana": 120,
  "runeCharges": 3,
  "soulCost": 2,
  "useLevel": null,
  "useMagicLevel": 3,
  "premium": false,
  "promotion": false,
  "price": 700,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/destroy-field"
 },
 {
  "id": "enchant-staff",
  "name": "Enchant Staff",
  "words": "exeta vis",
  "type": "instant",
  "category": "Support",
  "vocations": null,
  "level": 41,
  "mana": 80,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": null,
  "price": 2000,
  "teachers": [
   "eremo"
  ],
  "notes": [
   "The source's vocation assignment is disputed. Creation/casting eligibility is intentionally unknown until the promotion-specific teacher rules are corroborated."
  ],
  "sourceUrl": "https://primibia.com/wiki/spells/enchant-staff"
 },
 {
  "id": "energy-beam",
  "name": "Energy Beam",
  "words": "exevo vis lux",
  "type": "instant",
  "category": "Attack",
  "vocations": [
   "sorcerer"
  ],
  "level": 23,
  "mana": 100,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": false,
  "promotion": false,
  "price": 1000,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/energy-beam"
 },
 {
  "id": "energy-field",
  "name": "Energy Field",
  "words": "adevo grav vis",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "sorcerer",
   "druid"
  ],
  "level": 18,
  "mana": 320,
  "runeCharges": 3,
  "soulCost": 2,
  "useLevel": null,
  "useMagicLevel": 3,
  "premium": false,
  "promotion": false,
  "price": 700,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/energy-field"
 },
 {
  "id": "energy-strike",
  "name": "Energy Strike",
  "words": "exori vis",
  "type": "instant",
  "category": "Attack",
  "vocations": [
   "sorcerer",
   "druid"
  ],
  "level": 12,
  "mana": 20,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": false,
  "price": 800,
  "teachers": [
   "puffels"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/energy-strike"
 },
 {
  "id": "energy-wall",
  "name": "Energy Wall",
  "words": "adevo mas grav vis",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "sorcerer",
   "druid"
  ],
  "level": 41,
  "mana": 1000,
  "runeCharges": 4,
  "soulCost": 5,
  "useLevel": null,
  "useMagicLevel": 9,
  "premium": false,
  "promotion": false,
  "price": 2500,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/energy-wall"
 },
 {
  "id": "energy-wave",
  "name": "Energy Wave",
  "words": "exevo mort hur",
  "type": "instant",
  "category": "Attack",
  "vocations": [
   "sorcerer"
  ],
  "level": 38,
  "mana": 250,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": false,
  "promotion": false,
  "price": 2500,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/energy-wave"
 },
 {
  "id": "energybomb",
  "name": "Energybomb",
  "words": "adevo mas vis",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "sorcerer"
  ],
  "level": 37,
  "mana": 880,
  "runeCharges": 2,
  "soulCost": 5,
  "useLevel": null,
  "useMagicLevel": 10,
  "premium": true,
  "promotion": false,
  "price": 2300,
  "teachers": [
   "zoltan"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/energybomb"
 },
 {
  "id": "envenom",
  "name": "Envenom",
  "words": "adevo res pox",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "druid"
  ],
  "level": 21,
  "mana": 400,
  "runeCharges": 1,
  "soulCost": 2,
  "useLevel": null,
  "useMagicLevel": 4,
  "premium": true,
  "promotion": false,
  "price": 1000,
  "teachers": [
   "ursula"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/envenom"
 },
 {
  "id": "explosion",
  "name": "Explosion",
  "words": "adevo mas hur",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "sorcerer",
   "druid"
  ],
  "level": 31,
  "mana": 720,
  "runeCharges": 3,
  "soulCost": 4,
  "useLevel": null,
  "useMagicLevel": 6,
  "premium": false,
  "promotion": false,
  "price": 1800,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/explosion"
 },
 {
  "id": "explosive-arrow",
  "name": "Explosive Arrow",
  "words": "exevo con flam",
  "type": "instant",
  "category": "Support",
  "vocations": [
   "paladin"
  ],
  "level": 25,
  "mana": 290,
  "runeCharges": null,
  "soulCost": 3,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": false,
  "promotion": false,
  "price": 1000,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/explosive-arrow"
 },
 {
  "id": "find-person",
  "name": "Find Person",
  "words": "exiva \"name\"",
  "type": "instant",
  "category": "Support",
  "vocations": [
   "knight",
   "paladin",
   "sorcerer",
   "druid"
  ],
  "level": 8,
  "mana": 20,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": false,
  "promotion": false,
  "price": 80,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/find-person"
 },
 {
  "id": "fire-field",
  "name": "Fire Field",
  "words": "adevo grav flam",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "sorcerer",
   "druid"
  ],
  "level": 15,
  "mana": 240,
  "runeCharges": 3,
  "soulCost": 1,
  "useLevel": null,
  "useMagicLevel": 1,
  "premium": false,
  "promotion": false,
  "price": 500,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/fire-field"
 },
 {
  "id": "fire-wall",
  "name": "Fire Wall",
  "words": "adevo mas grav flam",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "sorcerer",
   "druid"
  ],
  "level": 33,
  "mana": 780,
  "runeCharges": 4,
  "soulCost": 4,
  "useLevel": null,
  "useMagicLevel": 6,
  "premium": false,
  "promotion": false,
  "price": 2000,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/fire-wall"
 },
 {
  "id": "fire-wave",
  "name": "Fire Wave",
  "words": "exevo flam hur",
  "type": "instant",
  "category": "Attack",
  "vocations": [
   "sorcerer"
  ],
  "level": 18,
  "mana": 80,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": false,
  "promotion": false,
  "price": 850,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/fire-wave"
 },
 {
  "id": "fireball",
  "name": "Fireball",
  "words": "adori flam",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "paladin",
   "sorcerer",
   "druid"
  ],
  "level": 17,
  "mana": 160,
  "runeCharges": 2,
  "soulCost": 2,
  "useLevel": null,
  "useMagicLevel": 2,
  "premium": false,
  "promotion": false,
  "price": 800,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/fireball"
 },
 {
  "id": "firebomb",
  "name": "Firebomb",
  "words": "adevo mas flam",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "sorcerer",
   "druid"
  ],
  "level": 27,
  "mana": 600,
  "runeCharges": 2,
  "soulCost": 4,
  "useLevel": null,
  "useMagicLevel": 5,
  "premium": false,
  "promotion": false,
  "price": 1500,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/firebomb"
 },
 {
  "id": "flame-strike",
  "name": "Flame Strike",
  "words": "exori flam",
  "type": "instant",
  "category": "Attack",
  "vocations": [
   "sorcerer",
   "druid"
  ],
  "level": 12,
  "mana": 20,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": false,
  "price": 800,
  "teachers": [
   "puffels"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/flame-strike"
 },
 {
  "id": "food",
  "name": "Food",
  "words": "exevo pan",
  "type": "instant",
  "category": "Support",
  "vocations": [
   "paladin",
   "druid"
  ],
  "level": 14,
  "mana": 120,
  "runeCharges": null,
  "soulCost": 1,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": false,
  "promotion": false,
  "price": 300,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/food"
 },
 {
  "id": "force-strike",
  "name": "Force Strike",
  "words": "exori mort",
  "type": "instant",
  "category": "Attack",
  "vocations": [
   "sorcerer",
   "druid"
  ],
  "level": 11,
  "mana": 20,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": false,
  "price": 600,
  "teachers": [
   "puffels"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/force-strike"
 },
 {
  "id": "great-energy-beam",
  "name": "Great Energy Beam",
  "words": "exevo gran vis lux",
  "type": "instant",
  "category": "Attack",
  "vocations": [
   "sorcerer"
  ],
  "level": 29,
  "mana": 200,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": false,
  "promotion": false,
  "price": 1800,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/great-energy-beam"
 },
 {
  "id": "great-fireball",
  "name": "Great Fireball",
  "words": "adori gran flam",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "sorcerer",
   "druid"
  ],
  "level": 23,
  "mana": 480,
  "runeCharges": 2,
  "soulCost": 3,
  "useLevel": null,
  "useMagicLevel": 4,
  "premium": false,
  "promotion": false,
  "price": 1200,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/great-fireball"
 },
 {
  "id": "great-light",
  "name": "Great Light",
  "words": "utevo gran lux",
  "type": "instant",
  "category": "Support",
  "vocations": [
   "knight",
   "paladin",
   "sorcerer",
   "druid"
  ],
  "level": 13,
  "mana": 60,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": false,
  "promotion": false,
  "price": 500,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/great-light"
 },
 {
  "id": "haste",
  "name": "Haste",
  "words": "utani hur",
  "type": "instant",
  "category": "Support",
  "vocations": [
   "knight",
   "paladin",
   "sorcerer",
   "druid"
  ],
  "level": 14,
  "mana": 60,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": false,
  "price": 600,
  "teachers": [
   "puffels"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/haste"
 },
 {
  "id": "heal-friend",
  "name": "Heal Friend",
  "words": "exura sio \"name\"",
  "type": "instant",
  "category": "Healing",
  "vocations": [
   "druid"
  ],
  "level": 18,
  "mana": 70,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": false,
  "price": 800,
  "teachers": [
   "ursula"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/heal-friend"
 },
 {
  "id": "heavy-magic-missile",
  "name": "Heavy Magic Missile",
  "words": "adori gran",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "paladin",
   "sorcerer",
   "druid"
  ],
  "level": 25,
  "mana": 280,
  "runeCharges": 5,
  "soulCost": 2,
  "useLevel": null,
  "useMagicLevel": 4,
  "premium": false,
  "promotion": false,
  "price": 1500,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/heavy-magic-missile"
 },
 {
  "id": "intense-healing",
  "name": "Intense Healing",
  "words": "exura gran",
  "type": "instant",
  "category": "Healing",
  "vocations": [
   "paladin",
   "sorcerer",
   "druid"
  ],
  "level": 11,
  "mana": 40,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": false,
  "promotion": false,
  "price": 350,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/intense-healing"
 },
 {
  "id": "intense-healing-rune",
  "name": "Intense Healing Rune",
  "words": "adura gran",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "druid"
  ],
  "level": 15,
  "mana": 240,
  "runeCharges": 1,
  "soulCost": 2,
  "useLevel": null,
  "useMagicLevel": 1,
  "premium": false,
  "promotion": false,
  "price": 600,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/intense-healing-rune"
 },
 {
  "id": "invisible",
  "name": "Invisible",
  "words": "utana vid",
  "type": "instant",
  "category": "Support",
  "vocations": [
   "paladin",
   "sorcerer",
   "druid"
  ],
  "level": 35,
  "mana": 440,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": false,
  "promotion": false,
  "price": 2000,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/invisible"
 },
 {
  "id": "levitate",
  "name": "Levitate",
  "words": "exani hur \"up|down\"",
  "type": "instant",
  "category": "Support",
  "vocations": [
   "knight",
   "paladin",
   "sorcerer",
   "druid"
  ],
  "level": 12,
  "mana": 50,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": false,
  "price": 500,
  "teachers": [
   "puffels"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/levitate"
 },
 {
  "id": "light",
  "name": "Light",
  "words": "utevo lux",
  "type": "instant",
  "category": "Support",
  "vocations": [
   "knight",
   "paladin",
   "sorcerer",
   "druid"
  ],
  "level": 8,
  "mana": 20,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": false,
  "promotion": false,
  "price": 100,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/light"
 },
 {
  "id": "light-healing",
  "name": "Light Healing",
  "words": "exura",
  "type": "instant",
  "category": "Healing",
  "vocations": [
   "knight",
   "paladin",
   "sorcerer",
   "druid"
  ],
  "level": 9,
  "mana": 25,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": false,
  "promotion": false,
  "price": 170,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/light-healing"
 },
 {
  "id": "light-magic-missile",
  "name": "Light Magic Missile",
  "words": "adori",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "paladin",
   "sorcerer",
   "druid"
  ],
  "level": 15,
  "mana": 120,
  "runeCharges": 5,
  "soulCost": 1,
  "useLevel": null,
  "useMagicLevel": 0,
  "premium": false,
  "promotion": false,
  "price": 500,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/light-magic-missile"
 },
 {
  "id": "magic-rope",
  "name": "Magic Rope",
  "words": "exani tera",
  "type": "instant",
  "category": "Support",
  "vocations": [
   "knight",
   "paladin",
   "sorcerer",
   "druid"
  ],
  "level": 9,
  "mana": 20,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": false,
  "price": 200,
  "teachers": [
   "puffels"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/magic-rope"
 },
 {
  "id": "magic-shield",
  "name": "Magic Shield",
  "words": "utamo vita",
  "type": "instant",
  "category": "Support",
  "vocations": [
   "paladin",
   "sorcerer",
   "druid"
  ],
  "level": 14,
  "mana": 50,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": false,
  "promotion": false,
  "price": 450,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/magic-shield"
 },
 {
  "id": "magic-wall",
  "name": "Magic Wall",
  "words": "adevo grav tera",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "sorcerer"
  ],
  "level": 32,
  "mana": 750,
  "runeCharges": 3,
  "soulCost": 5,
  "useLevel": null,
  "useMagicLevel": 9,
  "premium": true,
  "promotion": false,
  "price": 2100,
  "teachers": [
   "gundralph"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/magic-wall"
 },
 {
  "id": "mass-healing",
  "name": "Mass Healing",
  "words": "exura gran mas res",
  "type": "instant",
  "category": "Healing",
  "vocations": [
   "druid"
  ],
  "level": 36,
  "mana": 150,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": false,
  "price": 2200,
  "teachers": [
   "zoltan"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/mass-healing"
 },
 {
  "id": "paralyze",
  "name": "Paralyze",
  "words": "adana ani",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "druid"
  ],
  "level": 54,
  "mana": 1400,
  "runeCharges": 1,
  "soulCost": 3,
  "useLevel": null,
  "useMagicLevel": 18,
  "premium": true,
  "promotion": false,
  "price": 1900,
  "teachers": [
   "zoltan"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/paralyze"
 },
 {
  "id": "poison-field",
  "name": "Poison Field",
  "words": "adevo grav pox",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "sorcerer",
   "druid"
  ],
  "level": 14,
  "mana": 200,
  "runeCharges": 3,
  "soulCost": 1,
  "useLevel": null,
  "useMagicLevel": 0,
  "premium": false,
  "promotion": false,
  "price": 300,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/poison-field"
 },
 {
  "id": "poison-storm",
  "name": "Poison Storm",
  "words": "exevo gran mas pox",
  "type": "instant",
  "category": "Attack",
  "vocations": [
   "druid"
  ],
  "level": 50,
  "mana": 600,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": false,
  "price": 3400,
  "teachers": [
   "zoltan"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/poison-storm"
 },
 {
  "id": "poison-wall",
  "name": "Poison Wall",
  "words": "adevo mas grav pox",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "sorcerer",
   "druid"
  ],
  "level": 29,
  "mana": 640,
  "runeCharges": 4,
  "soulCost": 3,
  "useLevel": null,
  "useMagicLevel": 5,
  "premium": false,
  "promotion": false,
  "price": 1600,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/poison-wall"
 },
 {
  "id": "poisonbomb",
  "name": "Poisonbomb",
  "words": "adevo mas pox",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "druid"
  ],
  "level": 25,
  "mana": 520,
  "runeCharges": 2,
  "soulCost": 2,
  "useLevel": null,
  "useMagicLevel": 4,
  "premium": true,
  "promotion": false,
  "price": 1000,
  "teachers": [
   "ursula"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/poisonbomb"
 },
 {
  "id": "poisoned-arrow",
  "name": "Poisoned Arrow",
  "words": "exevo con pox",
  "type": "instant",
  "category": "Support",
  "vocations": [
   "paladin"
  ],
  "level": 16,
  "mana": 130,
  "runeCharges": null,
  "soulCost": 2,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": false,
  "promotion": false,
  "price": 700,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/poisoned-arrow"
 },
 {
  "id": "power-bolt",
  "name": "Power Bolt",
  "words": "exevo con vis",
  "type": "instant",
  "category": "Support",
  "vocations": null,
  "level": 59,
  "mana": 800,
  "runeCharges": null,
  "soulCost": 3,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": null,
  "price": 2000,
  "teachers": [
   "eremo"
  ],
  "notes": [
   "The source's vocation assignment is disputed. Creation/casting eligibility is intentionally unknown until the promotion-specific teacher rules are corroborated."
  ],
  "sourceUrl": "https://primibia.com/wiki/spells/power-bolt"
 },
 {
  "id": "soulfire",
  "name": "Soulfire",
  "words": "adevo res flam",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "sorcerer",
   "druid"
  ],
  "level": 27,
  "mana": 600,
  "runeCharges": 2,
  "soulCost": 3,
  "useLevel": null,
  "useMagicLevel": 7,
  "premium": true,
  "promotion": false,
  "price": 1800,
  "teachers": [
   "gundralph"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/soulfire"
 },
 {
  "id": "strong-haste",
  "name": "Strong Haste",
  "words": "utani gran hur",
  "type": "instant",
  "category": "Support",
  "vocations": [
   "sorcerer",
   "druid"
  ],
  "level": 20,
  "mana": 100,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": false,
  "price": 1300,
  "teachers": [
   "ursula"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/strong-haste"
 },
 {
  "id": "sudden-death",
  "name": "Sudden Death",
  "words": "adori vita vis",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "sorcerer"
  ],
  "level": 45,
  "mana": 880,
  "runeCharges": 1,
  "soulCost": 5,
  "useLevel": null,
  "useMagicLevel": 15,
  "premium": false,
  "promotion": false,
  "price": 3000,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/sudden-death"
 },
 {
  "id": "summon-creature",
  "name": "Summon Creature",
  "words": "utevo res \"creature\"",
  "type": "instant",
  "category": "Attack",
  "vocations": [
   "sorcerer",
   "druid"
  ],
  "level": 25,
  "mana": null,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": false,
  "promotion": false,
  "price": 2000,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/summon-creature"
 },
 {
  "id": "ultimate-explosion",
  "name": "Ultimate Explosion",
  "words": "exevo gran mas vis",
  "type": "instant",
  "category": "Attack",
  "vocations": [
   "sorcerer"
  ],
  "level": 60,
  "mana": 1200,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": false,
  "price": 8000,
  "teachers": [
   "zoltan"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/ultimate-explosion"
 },
 {
  "id": "ultimate-healing",
  "name": "Ultimate Healing",
  "words": "exura vita",
  "type": "instant",
  "category": "Healing",
  "vocations": [
   "paladin",
   "sorcerer",
   "druid"
  ],
  "level": 20,
  "mana": 160,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": false,
  "promotion": false,
  "price": 1000,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/ultimate-healing"
 },
 {
  "id": "ultimate-healing-rune",
  "name": "Ultimate Healing Rune",
  "words": "adura vita",
  "type": "rune",
  "category": "Support",
  "vocations": [
   "druid"
  ],
  "level": 24,
  "mana": 400,
  "runeCharges": 1,
  "soulCost": 3,
  "useLevel": null,
  "useMagicLevel": 4,
  "premium": false,
  "promotion": false,
  "price": 1500,
  "teachers": [],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/ultimate-healing-rune"
 },
 {
  "id": "ultimate-light",
  "name": "Ultimate Light",
  "words": "utevo vis lux",
  "type": "instant",
  "category": "Support",
  "vocations": [
   "sorcerer",
   "druid"
  ],
  "level": 26,
  "mana": 140,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": false,
  "price": 1600,
  "teachers": [
   "gundralph"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/ultimate-light"
 },
 {
  "id": "undead-legion",
  "name": "Undead Legion",
  "words": "exana mas mort",
  "type": "instant",
  "category": "Attack",
  "vocations": [
   "druid"
  ],
  "level": 30,
  "mana": 500,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": false,
  "price": 2000,
  "teachers": [
   "gundralph"
  ],
  "notes": [],
  "sourceUrl": "https://primibia.com/wiki/spells/undead-legion"
 },
 {
  "id": "wild-growth",
  "name": "Wild Growth",
  "words": "exevo grav vita",
  "type": "instant",
  "category": "Attack",
  "vocations": null,
  "level": 27,
  "mana": 220,
  "runeCharges": null,
  "soulCost": null,
  "useLevel": null,
  "useMagicLevel": null,
  "premium": true,
  "promotion": null,
  "price": 2000,
  "teachers": [
   "eremo"
  ],
  "notes": [
   "The source's vocation assignment is disputed. Creation/casting eligibility is intentionally unknown until the promotion-specific teacher rules are corroborated."
  ],
  "sourceUrl": "https://primibia.com/wiki/spells/wild-growth"
 }
];
export const spells: SpellRecord[] = rawSpells.map(s => {
 // The contemporary dialogue establishes only these four tower allocations.
 // Do not attach that evidence to inferred Eremo/promotion assignments.
 const teachers = s.teachers.filter(id => ['puffels','ursula','gundralph','zoltan'].includes(id));
 return {...s,teachers,sourceIds:['primibia',...(teachers.length ? ['edron-2005'] : [])],evidence:{...evidenceFor(s as unknown as Record<string,unknown>,s.sourceUrl,['vocations','level','mana','runeCharges','soulCost','useLevel','useMagicLevel','premium','promotion','price']),teachers:{status:teachers.length?'period-observation':'unknown',url:teachers.length?'https://forum.tibia.pl/showthread.php?t=22662':null},...(s.vocations===null?{vocations:{status:'disputed' as EvidenceStatus,url:s.sourceUrl,note:'The reference parser does not resolve promotion-specific permissions.'}}:{})}};
});

export const spellTeachers: SpellTeacher[] = [
 {id:'puffels',name:'Puffels',x:33269,y:31850,z:8,floor:-2,location:'Edron · southern tower',description:'Basic movement and attack spells',sourceUrl:'https://primibia.com/wiki/npcs/puffels'},
 {id:'ursula',name:'Ursula',x:33268,y:31849,z:7,floor:-1,location:'Edron · southern tower',description:'Conjuration, healing and strong haste',sourceUrl:'https://primibia.com/wiki/npcs/ursula'},
 {id:'gundralph',name:'Gundralph',x:33268,y:31849,z:5,floor:1,location:'Edron · southern tower',description:'Advanced utility and rune spells',sourceUrl:'https://primibia.com/wiki/npcs/gundralph'},
 {id:'zoltan',name:'Zoltan',x:33268,y:31849,z:4,floor:2,location:'Edron · southern tower',description:'The most powerful tower spells',sourceUrl:'https://primibia.com/wiki/npcs/zoltan'}
];

export function worldMapUrl(x=32368,y=32288,z=7,zoom=7): string {
 return 'https://opentibia.info/library/map#'+[x,y,z,zoom].join(',');
}

