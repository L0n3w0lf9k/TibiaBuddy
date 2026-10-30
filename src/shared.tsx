import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X, Search, ChevronDown, ExternalLink } from 'lucide-react';
export const number = (n: number, digits = 0) => Number.isFinite(n) ? n.toLocaleString('en-GB', { maximumFractionDigits: digits }) : '—';
export const gp = (n: number) => number(n, 2) + ' gp';
export const uid = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const value = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return value.slice(0,8)+'-'+value.slice(8,12)+'-'+value.slice(12,16)+'-'+value.slice(16,20)+'-'+value.slice(20);
};
export const today = () => { const d=new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); };
export const dateLabel = (date: string | number) => new Date(typeof date==='string' && date.length===10 ? date+'T12:00:00' : date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
export const duration = (seconds: number) => { const s=Math.max(0,Math.floor(seconds)); const h=Math.floor(s/3600),m=Math.floor(s%3600/60); return h ? h+'h '+m+'m' : m+'m '+s%60+'s'; };
export function PageHeader({eyebrow,title,description,actions}:{eyebrow?:string;title:string;description?:string;actions?:ReactNode}) {
  return <div className="page-heading"><div>{eyebrow&&<div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description&&<p>{description}</p>}</div><div className="page-actions">{actions}</div></div>;
}
export function Modal({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}) {
  const ref=useRef<HTMLDialogElement>(null); const titleId=useId();
  useEffect(()=>{const dialog=ref.current; dialog?.showModal(); return ()=>dialog?.close();},[]);
  return <dialog ref={ref} className={'modal '+(wide?'wide':'')} aria-labelledby={titleId} onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose();}}}><div className="modal-heading"><h2 id={titleId}>{title}</h2><button className="icon-btn" aria-label="Close dialog" onClick={onClose}><X size={19}/></button></div>{children}</dialog>;
}
export function Field({label,children,hint}:{label:string;children:ReactNode;hint?:string}) {
 return <label className="field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>;
}
export function EmptyState({icon,title,description,action}:{icon?:ReactNode;title:string;description?:string;action?:ReactNode}) {
 return <div className="empty-state">{icon&&<div className="empty-icon">{icon}</div>}<h3>{title}</h3>{description&&<p>{description}</p>}{action}</div>;
}
export function Tabs({tabs,value,onChange}:{tabs:{id:string;label:string;count?:number}[];value:string;onChange:(id:string)=>void}) {
 return <div className="tabs" role="tablist">{tabs.map(t=><button key={t.id} role="tab" aria-selected={t.id===value} className={t.id===value?'active':''} onClick={()=>onChange(t.id)}>{t.label}{t.count!==undefined&&<span className="count">{t.count}</span>}</button>)}</div>;
}
export function SearchBox({value,onChange,placeholder='Search…'}:{value:string;onChange:(s:string)=>void;placeholder?:string}) {
 return <div className="search-box"><Search size={17}/><input aria-label={placeholder} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>{value&&<button aria-label="Clear search" onClick={()=>onChange('')}><X size={15}/></button>}</div>;
}
export function Stat({label,value,detail,icon,tone}:{label:string;value:ReactNode;detail?:ReactNode;icon?:ReactNode;tone?:string}) {
 return <div className={'stat '+(tone||'')}><div className="stat-top"><span>{label}</span>{icon}</div><strong>{value}</strong>{detail&&<small>{detail}</small>}</div>;
}
export function Badge({children,tone='muted'}:{children:ReactNode;tone?:string}) {return <span className={'badge '+tone}>{children}</span>;}
export function Notice({children,tone='info'}:{children:ReactNode;tone?:string}) {return <div className={'notice '+tone}>{children}</div>;}
export function Evidence({children}:{children:ReactNode}) {return <details className="evidence"><summary>Rules & sources <ChevronDown size={14}/></summary><div>{children}</div></details>;}
export function External({href,children}:{href:string;children:ReactNode}) {return <a href={href} target="_blank" rel="noopener noreferrer">{children}<ExternalLink size={12}/></a>;}
