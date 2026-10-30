import type { GuideDraft } from '../domain/guides';

export interface CuratedGuide extends GuideDraft {
  id: string;
  sourceLabel: string;
  context: string;
  checkedAt: string;
  provenanceUrl?: string;
  language?: string;
  tags: string[];
}

/** Public page metadata and linked destinations checked 2026-10-30.
 * Version labels describe the source's stated context, not certified game rules.
 * YouTube titles/descriptions and TibiCam's linked recordings establish provenance;
 * the videos have not been exhaustively reviewed for every tactic or server setting.
 */
export const curatedGuides: CuratedGuide[] = [
  {
    id: 'curated-dark-cathedral-77', title: 'Dark Cathedral: a complete level 24 hunt',
    url: 'https://www.youtube.com/watch?v=hd9TuibVH4o', kind: 'video', vocations: [],
    description: 'Bone Bender’s full Dark Cathedral hunt, uploaded in May 2023. A practical look at an early hunting area.',
    versionLabel: '7.7 · uploader’s label', sourceLabel: 'Bone Bender · YouTube', language: 'Portuguese',
    context: 'The uploader labels the server 7.7. Its settings and the character’s vocation were not independently confirmed; level 24 is the recording’s level, not a safety recommendation.',
    checkedAt: '2026-10-30', tags: ['hunt', 'dark cathedral', 'beginner', 'portuguese'],
  },
  {
    id: 'curated-desert-quest-77', title: 'Desert Quest: a 7.7-era playthrough',
    url: 'https://www.youtube.com/watch?v=BhNcLu0y_ME', kind: 'video', vocations: [],
    description: 'A 15-minute recording of Fru’lich on Saphira, classified by TibiCam as a Desert Quest recording from Tibia 7.7.',
    versionLabel: '7.7 · historical recording', sourceLabel: 'TibiCam archive · YouTube',
    context: 'Quest footage for orientation. The version and quest label come from the archive; this is not a complete written checklist of quest requirements.',
    checkedAt: '2026-10-30', provenanceUrl: 'https://tibicam.com/video/frulich-tibia-77-c5a77b77', tags: ['quest', 'desert', 'walkthrough', 'kazordoon'],
  },
  {
    id: 'curated-darashia-77', title: 'Darashia: combat footage from the 7.7 era',
    url: 'https://www.youtube.com/watch?v=zqcPem7RvQM', kind: 'video', vocations: [],
    description: 'Nine minutes of Eldakar on Lunara, archived under Darashia and Tibia 7.7. Historical footage to accompany your route research.',
    versionLabel: '7.7 · historical recording', sourceLabel: 'TibiCam archive · YouTube',
    context: 'The archive identifies the version and location, but not the character’s vocation. Treat this as gameplay reference, not a narrated leveling guide.',
    checkedAt: '2026-10-30', provenanceUrl: 'https://tibicam.com/video/eldakar-tibia-77-1a14540a', tags: ['hunt', 'darashia', 'dragon', 'historical'],
  },
  {
    id: 'curated-training-concepts', title: 'Training: keeping skill practice effective',
    url: 'https://tibiantis-notes.github.io/training', kind: 'article', vocations: ['knight', 'paladin'],
    description: 'Tarsal explains physical skill practice, incoming attacks, damage and choosing a training target.',
    versionLabel: '7.4 · Tibiantis context', sourceLabel: 'Tarsal · Tibiantis Notes',
    context: 'Earlier-version context. Training concepts are useful, but verify rates, target behavior and equipment on your 7.7 server.',
    checkedAt: '2026-10-30', tags: ['training', 'shielding', 'melee', 'distance', 'skills'],
  },
  {
    id: 'curated-paladin-start', title: 'Paladin: getting started on the mainland',
    url: 'https://tibiantis.online/index.php?id=175&page=viewtopic', kind: 'article', vocations: ['paladin'],
    description: 'Quark’s beginner walkthrough covers leaving Rookgaard, first spears, city choices and early hunting through level 15.',
    versionLabel: '7.4 · Tibiantis context', sourceLabel: 'Quark · Tibiantis forum',
    context: 'Published in January 2023 for Tibiantis. Use the route ideas as earlier-version context; spell requirements, prices and server rules can differ in 7.7.',
    checkedAt: '2026-10-30', tags: ['paladin', 'beginner', 'rookgaard', 'spears', 'hunt'],
  },
  {
    id: 'curated-summon-tactics', title: 'Mage tactics: hunting with summons',
    url: 'https://tibiantis-notes.github.io/summons', kind: 'article', vocations: ['sorcerer', 'druid'],
    description: 'A practical discussion of summon positioning, target selection and common hunting combinations, with linked demonstrations.',
    versionLabel: '7.4 · Tibiantis context', sourceLabel: 'Tarsal · Tibiantis Notes',
    context: 'Earlier-version and server-specific advice, including some custom spells. Check summon costs, requirements and behavior against your 7.7 server.',
    checkedAt: '2026-10-30', tags: ['summon', 'mage', 'dragon', 'demon skeleton', 'positioning'],
  },
  ...([
    { vocation: 'knight', name: 'Knight', description: 'Look up a knight’s spell words, mana and teachers before planning a trip to learn them.' },
    { vocation: 'paladin', name: 'Paladin', description: 'Check a paladin’s healing, utility and ammunition-related spells in this reconstructed classic catalogue.' },
    { vocation: 'sorcerer', name: 'Sorcerer', description: 'Browse sorcerer spells and rune creation requirements, with incantations and spell teachers.' },
    { vocation: 'druid', name: 'Druid', description: 'Browse druid healing, utility and rune creation spells, with incantations and spell teachers.' },
  ] as const).map(entry => ({
    id: `curated-${entry.vocation}-spells`, title: `${entry.name}: classic spell reference`,
    url: `https://primibia.com/wiki/spells?vocation=${entry.name}`, kind: 'reference' as const,
    vocations: [entry.vocation], description: entry.description,
    versionLabel: '7.72 · community reconstruction', sourceLabel: 'Primibia wiki',
    context: 'A 7.72 reconstruction, slightly later than 7.7. Treat its values as a source to compare with your server, not independently certified 7.7 rules.',
    checkedAt: '2026-10-30', tags: ['spells', 'runes', 'mana', 'vocation', entry.vocation],
  })),
];
