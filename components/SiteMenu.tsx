'use client';
import Link from 'next/link';
import {useRef} from 'react';
import {Menu,Phone,ArrowUpRight} from 'lucide-react';
import type {Locale} from '@/lib/booking';
import './SiteMenu.css';
export default function SiteMenu({lang,current='transfer'}:{lang:Locale;current?:'transfer'|'tours'}){
 const pl=lang==='pl',mobile=useRef<HTMLDetailsElement>(null);
 return <nav className="site-navigation" aria-label={pl?'Menu główne':'Main navigation'}>
  <Link className="site-navigation-desktop" href={(current==='transfer'?'/travels':'/')+'?lang='+lang}>{current==='transfer'?(pl?'Wycieczki':'Day trips'):(pl?'Transfery lotniskowe':'Airport transfers')}<ArrowUpRight size={14}/></Link>
  <details className="site-navigation-mobile" ref={mobile} onKeyDown={e=>{if(e.key==='Escape'&&mobile.current)mobile.current.open=false;}}><summary aria-label={pl?'Otwórz menu':'Open menu'}><Menu size={21}/></summary><div className="site-navigation-panel" onClick={e=>{if((e.target as HTMLElement).closest('a')&&mobile.current)mobile.current.open=false;}}><Link href={'/?lang='+lang}>{pl?'Transfery lotniskowe':'Airport transfers'}</Link><Link href={'/travels?lang='+lang}>{pl?'Wycieczki prywatne':'Private day trips'}</Link><a href="tel:+48690048080"><Phone size={15}/>+48 690 04 80 80</a></div></details>
 </nav>;
}
