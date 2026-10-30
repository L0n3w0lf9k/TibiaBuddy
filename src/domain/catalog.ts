import type { AppState, Item, NPC, Offer } from '../types';
export const overrideKey=(serverId:string,id:string)=>serverId+'::'+id;
export function catalogItems(state:AppState,serverId:string):Item[] { return state.items.filter(x=>!x.serverId||x.serverId===serverId).map(x=>({...x,...state.itemOverrides[overrideKey(serverId,x.id)],id:x.id})); }
export function catalogNPCs(state:AppState,serverId:string):NPC[] { return state.npcs.filter(x=>!x.serverId||x.serverId===serverId).map(x=>({...x,...state.npcOverrides[overrideKey(serverId,x.id)],id:x.id})); }
export function catalogOffers(state:AppState,serverId:string):Offer[] { return state.offers.filter(x=>!x.serverId||x.serverId===serverId).map(x=>({...x,...state.offerOverrides[overrideKey(serverId,x.id)],id:x.id})); }
