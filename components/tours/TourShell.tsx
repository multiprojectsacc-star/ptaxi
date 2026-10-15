'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname} from 'next/navigation';
import {Globe2,ArrowUpRight,Phone,Mail,ChevronDown,Headphones,LockKeyhole} from 'lucide-react';
import SiteMenu from '@/components/SiteMenu';
import type {Locale} from '@/lib/booking';
const TourLocale=createContext<Locale>('pl');
export const useTourLocale=()=>useContext(TourLocale);
export default function TourShell({children}:{children:React.ReactNode}){
 const [lang,setLang]=useState<Locale>('pl');
 const [help,setHelp]=useState(false);
 const pathname=usePathname();
 useEffect(()=>{document.documentElement.lang=lang;},[lang]);
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[pathname]);
 // Read browser-only language preference after hydration.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{const q=new URLSearchParams(window.location.search).get('lang');let stored:string|null=null;try{stored=sessionStorage.getItem('personal-taxi-tour-lang');}catch{}setLang(q==='en'||(!q&&stored==='en')?'en':'pl');},[]);
 function changeLang(){const next=lang==='pl'?'en':'pl';setLang(next);try{sessionStorage.setItem('personal-taxi-tour-lang',next);}catch{}const url=new URL(window.location.href);url.searchParams.set('lang',next);window.history.replaceState(null,'',url);document.documentElement.lang=next;}
 const photoPage=pathname==='/travels'||/^\/travels\/(auschwitz-birkenau|zakopane|wieliczka)$/.test(pathname);
 return <TourLocale.Provider value={lang}><div className={'tour-site'+(photoPage?' tour-photo-page':'')}>
  <header className="tour-header site-header"><div className="header-inner"><Link className="brand" href={'/?lang='+lang} aria-label={lang==='pl'?'Personal Taxi — strona główna':'Personal Taxi — home'}><Image src="/images/logo-transparent.png" alt="Personal Taxi" width={190} height={63}/><span className="brand-divider"/><span className="brand-location">KRAKÓW AIRPORT</span></Link><div className="header-actions"><SiteMenu lang={lang} current="tours"/><button className="locale-button" onClick={changeLang} aria-label={lang==='pl'?'Switch to English':'Przełącz na polski'}><Globe2 size={17}/><span>{lang.toUpperCase()}</span><span className="currency">PLN</span><ChevronDown size={13}/></button><div className="help-control"><button className="help-button" aria-expanded={help} onClick={()=>setHelp(!help)}><Headphones size={17}/>{lang==='pl'?'Potrzebujesz pomocy?':'Need help?'}<ChevronDown size={13}/></button>{help&&<div className="help-menu"><strong>{lang==='pl'?'Porozmawiajmy o Twojej podróży':'Let’s talk about your journey'}</strong><a href="tel:+48690048080"><Phone size={17}/>+48 690 04 80 80</a><a href="mailto:office@personaltaxi.pl"><Mail size={17}/>office@personaltaxi.pl</a></div>}</div></div></div></header>
  {children}
  <footer className="site-footer"><div className="container"><div><span>© {new Date().getFullYear()} Personal Taxi</span><small>Inter-Dywiz Sp. z o.o. · NIP 6751496482</small></div><nav aria-label={lang==='pl'?'Informacje':'Information'}><Link href={'/?lang='+lang}>{lang==='pl'?'Transfery':'Airport transfers'}</Link><Link href={'/travels?lang='+lang}>{lang==='pl'?'Wycieczki':'Day trips'}</Link><a href="https://www.personaltaxi.pl/terms" target="_blank" rel="noreferrer">{lang==='pl'?'Regulamin':'Terms'}</a><a href="https://www.personaltaxi.pl/policy" target="_blank" rel="noreferrer">{lang==='pl'?'Prywatność':'Privacy'}</a><a href="mailto:office@personaltaxi.pl">{lang==='pl'?'Kontakt':'Contact'}<ArrowUpRight size={13}/></a></nav><div className="footer-payment"><LockKeyhole size={13}/><span>Przelewy<b>24</b></span></div></div></footer>
 </div></TourLocale.Provider>;
}
