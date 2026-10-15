'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname} from 'next/navigation';
import {Globe2,ArrowUpRight,Phone,Mail} from 'lucide-react';
import SiteMenu from '@/components/SiteMenu';
import type {Locale} from '@/lib/booking';
const TourLocale=createContext<Locale>('pl');
export const useTourLocale=()=>useContext(TourLocale);
export default function TourShell({children}:{children:React.ReactNode}){
 const [lang,setLang]=useState<Locale>('pl');
 const pathname=usePathname();
 useEffect(()=>{document.documentElement.lang=lang;},[lang]);
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[pathname]);
 // Read browser-only language preference after hydration.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{const q=new URLSearchParams(window.location.search).get('lang');let stored:string|null=null;try{stored=sessionStorage.getItem('personal-taxi-tour-lang');}catch{}setLang(q==='en'||(!q&&stored==='en')?'en':'pl');},[]);
 function changeLang(){const next=lang==='pl'?'en':'pl';setLang(next);try{sessionStorage.setItem('personal-taxi-tour-lang',next);}catch{}const url=new URL(window.location.href);url.searchParams.set('lang',next);window.history.replaceState(null,'',url);document.documentElement.lang=next;}
 return <TourLocale.Provider value={lang}><div className="tour-site">
  <header className="tour-header"><div className="tour-container"><Link className="tour-brand" href={'/?lang='+lang} aria-label="Personal Taxi — strona główna"><Image src="/images/logo-transparent.png" alt="Personal Taxi" width="165" height="55"/></Link><div className="tour-header-actions"><SiteMenu lang={lang} current="tours"/><a className="tour-header-phone" href="tel:+48690048080"><Phone size={15}/>+48 690 04 80 80</a><button onClick={changeLang} aria-label={lang==='pl'?'Switch to English':'Przełącz na polski'}><Globe2 size={16}/>{lang.toUpperCase()}</button></div></div></header>
  {children}
  <footer className="tour-footer"><div className="tour-container"><div><Link className="tour-brand" href={'/?lang='+lang}><Image src="/images/logo-transparent.png" alt="Personal Taxi" width="165" height="55"/></Link><p>{lang==='pl'?'Twój czas. Twoja podróż.':'Your time. Your journey.'}</p></div><div><a href="tel:+48690048080"><Phone size={15}/>+48 690 04 80 80</a><a href="mailto:office@personaltaxi.pl"><Mail size={15}/>office@personaltaxi.pl</a></div><nav aria-label={lang==='pl'?'Informacje':'Information'}><Link href={'/travels?lang='+lang}>{lang==='pl'?'Wycieczki':'Day trips'}<ArrowUpRight size={13}/></Link><Link href={'/?lang='+lang}>{lang==='pl'?'Transfery lotniskowe':'Airport transfers'}<ArrowUpRight size={13}/></Link><a href="https://www.personaltaxi.pl/terms" target="_blank" rel="noreferrer">{lang==='pl'?'Regulamin':'Terms'}</a><a href="https://www.personaltaxi.pl/policy" target="_blank" rel="noreferrer">{lang==='pl'?'Prywatność':'Privacy'}</a></nav></div><div className="tour-container tour-footer-legal">© {new Date().getFullYear()} Personal Taxi <span>Inter-Dywiz Sp. z o.o. · NIP 6751496482</span></div></footer>
 </div></TourLocale.Provider>;
}
