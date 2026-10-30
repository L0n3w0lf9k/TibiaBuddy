import { Component, useCallback, useEffect, useState, type ReactNode } from 'react';
import { ArrowUpRight, BookOpen, Check, ChevronDown, CircleHelp, Coins, Compass, FlaskConical, LayoutDashboard, LoaderCircle, Map, Menu, Package, Plus, Settings2, Shield, Swords, Timer, X } from 'lucide-react';
import { AppContext } from './context';
import type { AppState } from './types';
import { mutateState, readState, subscribe } from './store';
import { number } from './shared';
import { xpProgress } from './domain/xp';
import Overview from './features/Overview';
import Hunts from './features/Hunts';
import Supplies from './features/Supplies';
import Merchants from './features/Merchants';
import Training from './features/Training';
import Combat from './features/Combat';
import Library from './features/Library';
import WorldMap from './features/WorldMap';
import Settings from './features/Settings';
import Profile, { vocationLabel } from './features/Profile';

const nav=[{id:'overview',label:'Overview',icon:LayoutDashboard},{id:'hunts',label:'Hunts & experience',icon:Timer},{id:'supplies',label:'Stock & orders',icon:Package},{id:'training',label:'Training & food',icon:FlaskConical},{id:'combat',label:'Combat calculator',icon:Swords},{id:'library',label:'Creature & spell library',icon:BookOpen},{id:'merchants',label:'Merchants',icon:Coins},{id:'map',label:'World map',icon:Map}];
const getPath=()=>window.location.hash.replace(/^#\/?/,'').split('?')[0]||'overview';
export default function App(){
  const [state,setState]=useState<AppState|null>(null),[loadError,setLoadError]=useState(''),[path,setPath]=useState(getPath),[mobile,setMobile]=useState(false),[profile,setProfile]=useState<'edit'|'create'|null>(null),[saving,setSaving]=useState(0);
  const [toast,setToast]=useState<{id:number;message:string;kind:string}|null>(null);
  const route=path.split('/')[0]; const navigate=useCallback((p:string)=>{window.location.hash='/'+p;setMobile(false);},[]);
  const notify=useCallback((message:string,kind='success')=>setToast({id:Date.now(),message,kind}),[]);
  useEffect(()=>{let mounted=true;const unsubscribe=subscribe(s=>{if(mounted)setState(s);});void readState().then(s=>{if(mounted)setState(s);}).catch(e=>setLoadError(e instanceof Error?e.message:'Could not open your journal.'));return()=>{mounted=false;unsubscribe();};},[]);
  useEffect(()=>{const handle=()=>{setPath(getPath());setMobile(false);window.scrollTo({top:0});};window.addEventListener('hashchange',handle);return()=>window.removeEventListener('hashchange',handle);},[]);
  useEffect(()=>{document.title=(nav.find(n=>n.id===route)?.label??'Settings')+' · Tibia Buddy';},[route]);
  useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(null),toast.kind==='error'?8000:4000);return()=>clearTimeout(id);},[toast]);
  const update=useCallback(async(recipe:(draft:AppState)=>void)=>{setSaving(n=>n+1);try{await mutateState(recipe);}catch(e){notify(e instanceof Error?e.message:'Your changes could not be saved.','error');throw e;}finally{setSaving(n=>Math.max(0,n-1));}},[notify]);
  if(loadError)return <div className="boot-screen"><Compass size={46}/><h1>Your journal couldn't be opened</h1><p>{loadError}</p><p>Allow this site to store data in your browser, then reload. Your existing data has not been replaced.</p><button className="btn btn-primary" onClick={()=>window.location.reload()}>Try again</button></div>;
  if(!state)return <div className="boot-screen"><Compass size={46}/><h1>Tibia Buddy</h1><p>Opening your adventure journal…</p><LoaderCircle className="spinner" size={22}/></div>;
  const character=state.characters.find(c=>c.id===state.activeCharacterId)??state.characters[0], server=state.servers.find(s=>s.id===character.serverId)??state.servers[0];
  const p=xpProgress(character.xp),activeHunt=state.hunts.find(h=>h.characterId===character.id&&h.status!=='completed');
  const screens:Record<string,ReactNode>={overview:<Overview/>,hunts:<Hunts/>,supplies:<Supplies/>,training:<Training/>,combat:<Combat/>,library:<Library/>,merchants:<Merchants/>,map:<WorldMap/>,settings:<Settings/>};
  return <AppContext.Provider value={{state,character,server,update,notify,navigate,openProfile:()=>setProfile('edit')}}><a className="skip-link" href="#main-content">Skip to content</a><div className="app-shell">
    {mobile&&<button className="sidebar-scrim" aria-label="Close navigation" onClick={()=>setMobile(false)}/>}
    <aside className={'sidebar '+(mobile?'open':'')}><a className="brand" href="#/overview" onClick={()=>setMobile(false)}><span className="brand-mark"><Compass size={28} strokeWidth={1.5}/></span><span>Tibia<span className="brand-light">Buddy</span><small>THE ADVENTURER'S COMPANION</small></span></a><div className="sidebar-rule"/>
    <div className="nav-label">YOUR ADVENTURE</div><nav aria-label="Main navigation">{nav.map((n,i)=>{const Icon=n.icon;return <div key={n.id}>{i===5&&<div className="nav-label library-label">THE FIELD GUIDE</div>}<a className={'nav-item '+(route===n.id?'active':'')} href={'#/'+n.id} aria-current={route===n.id?'page':undefined} onClick={()=>setMobile(false)}><Icon size={18} strokeWidth={1.7}/><span>{n.label}</span>{n.id==='hunts'&&activeHunt&&<span className="nav-dot"/>}</a></div>;})}</nav>
    <div className="sidebar-bottom"><div className="edition-note"><div className="edition-icon">✦</div><strong>Old world. New adventures.</strong><p>Your personal companion<br/>for the Tibia 7.7 era.</p><span>CLASSIC EDITION</span></div><a className={'nav-item '+(route==='settings'?'active':'')} href="#/settings"><Settings2 size={18}/><span>Settings & data</span></a><div className="sidebar-character" onClick={()=>setProfile('edit')} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')setProfile('edit');}}><div className="avatar"><Shield size={21}/></div><div><strong>{character.name}</strong><span>Level {p.level} · {character.vocation==='unselected'?'Set vocation':vocationLabel(character)}</span></div><ChevronDown size={15}/></div></div></aside>
    <div className="main-shell"><header className="topbar"><div className="topbar-left"><button className="icon-btn mobile-menu" aria-label="Open navigation" aria-expanded={mobile} onClick={()=>setMobile(true)}><Menu size={22}/></button><div className="breadcrumb">Your journal <span>/</span> <strong>{nav.find(n=>n.id===route)?.label??'Settings & data'}</strong></div></div><div className="topbar-right"><span className="save-state">{saving?<LoaderCircle size={13} className="spinner"/>:<Check size={13}/>}<span>{saving?'Saving…':'Saved on device'}</span></span><span className="topbar-divider"/><div className="character-select"><Shield size={16}/><select aria-label="Active character" value={character.id} onChange={e=>{const id=e.target.value;if(id==='__new'){setProfile('create');return;}void update(d=>{d.activeCharacterId=id;}).catch(()=>{});}}>{state.characters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}<option value="__new">+ Add a character</option></select><ChevronDown size={13}/></div><button className="avatar small-avatar" onClick={()=>setProfile('edit')} aria-label="Edit character profile">{character.name.slice(0,1).toUpperCase()}</button></div></header>
    <main id="main-content" className={'main-content page-'+route} key={character.id}><ErrorBoundary key={route}>{screens[route]??screens.overview}</ErrorBoundary></main></div>
    </div>{profile&&<Profile key={profile+character.id} create={profile==='create'} onClose={()=>setProfile(null)}/>}{toast&&<div className={'toast '+toast.kind} role={toast.kind==='error'?'alert':'status'}><span>{toast.kind==='success'?<Check size={18}/>:<CircleHelp size={18}/>}</span>{toast.message}<button aria-label="Dismiss notification" onClick={()=>setToast(null)}><X size={16}/></button></div>}
  </AppContext.Provider>;
}
class ErrorBoundary extends Component<{children:ReactNode},{error:string}> {
  state={error:''}; static getDerivedStateFromError(error:Error){return {error:error.message};}
  render(){if(this.state.error)return <section className="card padded"><h2>This page couldn't be displayed</h2><p>{this.state.error}</p><button className="btn btn-primary" onClick={()=>window.location.reload()}>Reload your journal <ArrowUpRight size={15}/></button></section>;return this.props.children;}
}
