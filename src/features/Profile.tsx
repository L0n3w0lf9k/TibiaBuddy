import { useState } from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { useApp } from '../context';
import { Field, Modal, Notice, Tabs, uid } from '../shared';
import { emptyCharacter } from '../seed';
import { checkXP, MAX_XP, xpFromRemaining, xpProgress } from '../domain/xp';
import type { Character, Vocation } from '../types';

export const vocationNames: Record<Vocation,string> = { unselected:'Choose vocation', knight:'Knight', paladin:'Paladin', sorcerer:'Sorcerer', druid:'Druid' };
export const promotedNames: Record<Vocation,string> = { unselected:'Choose vocation', knight:'Elite Knight', paladin:'Royal Paladin', sorcerer:'Master Sorcerer', druid:'Elder Druid' };
export function vocationLabel(c: Character) { return (c.promoted ? promotedNames : vocationNames)[c.vocation]; }

export default function Profile({create=false,onClose}:{create?:boolean;onClose:()=>void}) {
  const {character,state,update,notify} = useApp();
  const [draft,setDraft]=useState<Character>(()=>create?emptyCharacter(uid(),'New character',character.serverId):structuredClone(character));
  const [xpMode,setXPMode]=useState(draft.xpEstimated?'percentage':'exact');
  const changeXPMode=(mode:string)=>{try{if(mode==='percentage'){const p=xpProgress(checkXP(draft.xp));setDraft(d=>({...d,level:p.level,percentRemaining:100-p.percent}));}else{const xp=xpFromRemaining(draft.level,draft.percentRemaining);setDraft(d=>({...d,xp}));}setXPMode(mode);setError('');}catch(e){setError(e instanceof Error?e.message:'Enter valid experience first.');}};
  const [newServer,setNewServer]=useState(''); const [error,setError]=useState(''); const [saving,setSaving]=useState(false);
  const set=<K extends keyof Character>(key:K,value:Character[K])=>setDraft(d=>({...d,[key]:value}));
  const numeric=(key:keyof Character, e:React.ChangeEvent<HTMLInputElement>)=>setDraft(d=>({...d,[key]:Number(e.target.value)}));
  const save=async(e:React.FormEvent)=>{e.preventDefault();setError('');setSaving(true);try{
    if (!draft.name.trim()) throw new Error('Give your character a name.');
    const xp=xpMode==='exact'?checkXP(draft.xp):xpFromRemaining(draft.level,draft.percentRemaining);
    const p=xpProgress(xp); const next={...draft,name:draft.name.trim(),xp,level:p.level,percentRemaining:100-p.percent,xpEstimated:xpMode==='percentage'};
    if(next.vocation==='unselected')next.promoted=false;
    await update(d=>{if(create){if(next.serverId==='new'){if(!newServer.trim())throw new Error('Enter a server name.');next.serverId=uid();d.servers.push({id:next.serverId,name:newServer.trim(),xpRate:1,regenerationRate:1,magicRate:1,skillRate:1,ruleset:'tibia77',pricePreset:'Project Fibula'});}d.characters.push(next);d.activeCharacterId=next.id;}else{const i=d.characters.findIndex(c=>c.id===character.id);if(i<0)throw new Error('Character no longer exists.');d.characters[i]=next;}});
    notify(create?'Character created. Your new adventure is ready.':'Character profile saved.');onClose();
  }catch(e){setError(e instanceof Error?e.message:'Could not save profile.');}finally{setSaving(false);}};
  return <Modal title={create?'Add a character':'Character profile'} onClose={onClose} wide><form onSubmit={save} className="stack">
    <div className="profile-form-intro"><div className="profile-emblem"><Shield size={28}/></div><div><strong>Every vocation. Your own journey.</strong><p>Your profile sets the defaults for training and combat calculators.</p></div></div>
    <div className="form-grid"><Field label="Character name"><input required autoFocus value={draft.name} maxLength={80} onChange={e=>set('name',e.target.value)}/></Field><Field label="Server" hint={!create?'Server prices are shared by characters on the same server.':undefined}><select value={draft.serverId} disabled={!create} onChange={e=>set('serverId',e.target.value)}>{state.servers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}{create&&<option value="new">+ Create another server</option>}</select></Field></div>
    {draft.serverId==='new'&&<Field label="New server name"><input required value={newServer} onChange={e=>setNewServer(e.target.value)} maxLength={80} placeholder="Your server name"/></Field>}
    <div className="form-grid"><Field label="Vocation"><select value={draft.vocation} onChange={e=>set('vocation',e.target.value as Vocation)}>{Object.entries(vocationNames).map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></Field><div className="field"><span>Character status</span><div className="status-options"><label className="check-field"><input type="checkbox" checked={draft.promoted} disabled={draft.vocation==='unselected'} onChange={e=>{set('promoted',e.target.checked);if(e.target.checked)set('premium',true);}}/><Sparkles size={15}/>Promoted</label><label className="check-field"><input type="checkbox" checked={draft.premium} onChange={e=>{set('premium',e.target.checked);if(!e.target.checked)set('promoted',false);}}/>Premium</label></div></div></div>
    <div className="form-section"><h3>Experience</h3><Tabs tabs={[{id:'exact',label:'Exact experience'},{id:'percentage',label:'Level & progress'}]} value={xpMode} onChange={changeXPMode}/>{xpMode==='exact'?<Field label="Total experience" hint={'Level '+xpProgress(Math.min(MAX_XP,Math.max(0,Math.trunc(draft.xp||0)))).level+' is calculated from your experience.'}><input required type="number" min={0} max={MAX_XP} step={1} value={draft.xp} onChange={e=>numeric('xp',e)}/></Field>:<div className="form-grid"><Field label="Current level"><input required type="number" min={1} max={10000} step={1} value={draft.level} onChange={e=>numeric('level',e)}/></Field><Field label="Percent remaining to next level" hint="This gives an approximate XP total."><input required type="number" min={0} max={100} step="0.01" value={draft.percentRemaining} onChange={e=>numeric('percentRemaining',e)}/></Field></div>}</div>
    <div className="form-section"><h3>Magic & skills</h3><div className="form-grid three"><Field label="Magic level"><input required type="number" min={0} max={200} step={1} value={draft.magicLevel} onChange={e=>numeric('magicLevel',e)}/></Field><Field label="ML percent remaining"><input required type="number" min={0} max={100} step="0.01" value={draft.magicPercentRemaining} onChange={e=>numeric('magicPercentRemaining',e)}/></Field><Field label="Target magic level"><input required type="number" min={1} max={200} step={1} value={draft.goalML} onChange={e=>numeric('goalML',e)}/></Field><Field label="Melee skill"><input required type="number" min={0} max={300} step={1} value={draft.meleeSkill} onChange={e=>numeric('meleeSkill',e)}/></Field><Field label="Distance skill"><input required type="number" min={0} max={300} step={1} value={draft.distanceSkill} onChange={e=>numeric('distanceSkill',e)}/></Field><Field label="Fishing skill"><input required type="number" min={0} max={300} step={1} value={draft.fishingSkill} onChange={e=>numeric('fishingSkill',e)}/></Field></div></div>
    {error&&<Notice tone="error">{error}</Notice>}<div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving?'Saving…':create?'Create character':'Save profile'}</button></div>
  </form></Modal>;
}
