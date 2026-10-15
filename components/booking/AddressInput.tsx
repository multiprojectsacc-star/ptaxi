'use client';
import { useEffect,useRef,useState } from 'react';
import { MapPin,Search,LoaderCircle,X,ArrowUpRight,Building2,Plane } from 'lucide-react';
import type { Location,Locale } from '@/lib/booking';
import { request,type MapMode } from '@/lib/client/booking';
type Props={value:Location|null;onChange:(location:Location|null)=>void;lang:Locale;label:string;disabled?:boolean;scope?:"transfer"|"tour";allowAirport?:boolean};
export default function AddressInput({value,onChange,lang,label,disabled,scope="transfer",allowAirport=false}:Props){
 const [query,setQuery]=useState(value?.name||'');const [open,setOpen]=useState(false);const [items,setItems]=useState<Location[]>([]);const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [mapsMode,setMapsMode]=useState<MapMode>('live');
 const box=useRef<HTMLDivElement>(null);const input=useRef<HTMLInputElement>(null);const t=(a:string,b:string)=>lang==='pl'?a:b;
 useEffect(()=>{if(value){setQuery(value.name);setOpen(false);}},[value]);
 useEffect(()=>{const listener=(e:MouseEvent)=>{if(!box.current?.contains(e.target as Node))setOpen(false);};document.addEventListener('mousedown',listener);return()=>document.removeEventListener('mousedown',listener);},[]);
 useEffect(()=>{if(value||query.trim().length<2){setItems([]);setLoading(false);return;}const controller=new AbortController();setItems([]);setLoading(true);setError('');const timer=setTimeout(()=>{
  request<{locations:Location[];mapsMode:MapMode}>('/api/locations?q='+encodeURIComponent(query.trim())+'&scope='+scope,undefined,lang,controller.signal).then(r=>{setItems(r.locations);setMapsMode(r.mapsMode);}).catch(e=>{if(e.name!=='AbortError')setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
 },250);return()=>{controller.abort();clearTimeout(timer);};},[query,value,lang,scope]);
 function select(item:Location){if(item.isAirport&&!allowAirport){setError(t('Lotnisko Kraków jest już wybrane. Wskaż drugi adres.','Kraków Airport is already selected. Choose your other address.'));return;}onChange(item);setQuery(item.name);setOpen(false);}
 return <div className="address-control" ref={box}>
  <div className={'booking-field address-field '+(value?'filled':'')}>
   <MapPin size={21}/><div><label htmlFor="destination-input">{label}</label><input ref={input} id="destination-input" role="combobox" aria-expanded={open&&!value&&query.length>=2} aria-controls="address-options" aria-autocomplete="list" autoComplete="off" disabled={disabled} value={query} placeholder={t('Miejscowość, adres lub hotel','Town, address or hotel')} onFocus={()=>setOpen(true)} onChange={e=>{setQuery(e.target.value);onChange(null);setOpen(true);setError('');}} onKeyDown={e=>{if(e.key==='Escape')setOpen(false);if(e.key==='ArrowDown'){e.preventDefault();box.current?.querySelector<HTMLButtonElement>('[role="option"]')?.focus();}}}/>{value&&<small>{value.address}</small>}</div>
   {query&&<button type="button" className="clear-address" aria-label={t('Wyczyść adres','Clear address')} disabled={disabled} onClick={()=>{setQuery('');onChange(null);setItems([]);input.current?.focus();}}><X size={15}/></button>}
  </div>
  {open&&!value&&query.length>=2&&<div className="address-results" id="address-options" role="listbox" aria-label={t('Proponowane adresy','Suggested addresses')}>
   {loading?<div className="search-message"><LoaderCircle className="spin" size={18}/>{t('Wyszukuję adresy…','Searching addresses…')}</div>:error?<div className="search-message error-text">{error}</div>:items.length?items.map((item,i)=><button type="button" role="option" aria-selected={false} key={item.id} onClick={()=>select(item)} onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();(e.currentTarget.nextElementSibling as HTMLElement)?.focus();}if(e.key==='ArrowUp'){e.preventDefault();if(i)(e.currentTarget.previousElementSibling as HTMLElement)?.focus();else input.current?.focus();}if(e.key==='Escape'){setOpen(false);input.current?.focus();}}}>{item.isAirport?<Plane size={19}/>:<MapPin size={19}/>}<span><strong>{item.name}</strong>{item.address!==item.name&&<small>{item.address}</small>}</span><ArrowUpRight size={15}/></button>):<div className="search-message"><Search size={18}/>{scope==='tour'?t('Brak adresów w obszarze odbioru. Wpisz ulicę, hotel lub adres w Krakowie albo gminie Zabierzów.','No pickup addresses found. Search for a street, hotel or address in Kraków or Zabierzów municipality.'):t('Brak wyników. Podaj miejscowość, ulicę i numer.','No results. Try a town, street and number.')}</div>}
   <div className="search-attribution">{mapsMode==='live'?t('Adresy w Polsce · TomTom','Addresses in Poland · TomTom'):t('Przykładowe adresy','Sample addresses')}</div>
  </div>}
 </div>;
}
