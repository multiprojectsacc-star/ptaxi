'use client';

import {useEffect, useRef} from 'react';
import {ArrowRight, Plane} from 'lucide-react';
import type {Locale} from '@/lib/booking';

export default function HowItWorks({lang}: {lang: Locale}) {
 const section = useRef<HTMLElement>(null);
 const t = (pl: string, en: string) => lang === 'pl' ? pl : en;

 useEffect(() => {
  const target = section.current;
  if (!target) return;
  const observer = new IntersectionObserver(([entry]) => {
   target.classList.toggle('in-view', entry.isIntersecting);
  }, {threshold: 0.08});
  observer.observe(target);
  return () => observer.disconnect();
 }, []);

 const steps = [
  {
   title: t('Zamawiasz transfer', 'Book your transfer'),
   description: t('Wybierasz trasę, termin i samochód. Znasz cenę z góry, a rezerwację załatwiasz online.', 'Choose your route, date and vehicle. See the price upfront and complete your booking online.'),
   illustration: <BookingIllustration lang={lang}/>,
  },
  {
   title: t('Lądujesz, my Cię odbieramy', 'You land. We meet you.'),
   description: t('Monitorujemy Twój lot. W hali przylotów czeka kierowca z tabliczką z Twoim nazwiskiem.', 'We monitor your flight. Your driver waits in arrivals with a sign bearing your name.'),
   illustration: <PickupIllustration lang={lang}/>,
  },
  {
   title: t('Jedziesz prosto do celu', 'Travel straight to your destination'),
   description: t('Rozsiadasz się wygodnie. Zajmujemy się bagażem i dowozimy Cię pod wskazany adres.', 'Settle in and relax. We take care of your luggage and drive you to your chosen address.'),
   illustration: <JourneyIllustration/>,
  },
 ];

 return <section className="how-it-works" ref={section} aria-labelledby="how-it-works-title">
  <div className="container">
   <div className="how-heading">
    <div>
     <span className="section-kicker">{t('JAK TO DZIAŁA', 'HOW IT WORKS')}</span>
     <h2 id="how-it-works-title">{t('Trzy kroki.','Three steps.')}<br/>{t('I jesteś na miejscu.','And you’re there.')}</h2>
    </div>
    <p>{t('Od pierwszego kliknięcia do ostatniego kilometra — zadbamy o spokojny początek Twojej podróży.', 'From the first click to the last mile — we take care of a smooth start to your journey.')}</p>
   </div>
   <ol className="transfer-steps">
    {steps.map((step, index) => <li className="transfer-step" key={index}>
     <div className="step-artwork">
      <span className="step-number" aria-hidden="true">0{index + 1}</span>
      {step.illustration}
      {index < 2 && <span className="step-connector" aria-hidden="true"><ArrowRight size={17}/></span>}
     </div>
     <h3>{step.title}</h3>
     <p>{step.description}</p>
    </li>)}
   </ol>
   <div className="how-return-note"><Plane size={16}/><span>{t('Wracasz na lotnisko? Rezerwujesz równie prosto — kierowca odbierze Cię spod wskazanego adresu.', 'Heading to the airport? Booking is just as easy — your driver picks you up at your chosen address.')}</span></div>
  </div>
 </section>;
}

function BookingIllustration({lang}: {lang: Locale}) {
 return <svg viewBox="0 0 360 220" fill="none" aria-hidden="true" focusable="false">
  <ellipse cx="180" cy="198" rx="95" ry="9" fill="#ddd5c5" opacity=".5"/>
  <circle cx="180" cy="108" r="80" fill="#f0e8d9"/>
  <path d="M70 89h35m-22-12h36m137 74h32m-13 13h23" stroke="#d8c8ab" strokeWidth="1.5" strokeLinecap="round"/>
  <g transform="rotate(-7 175 110)">
   <rect x="123" y="23" width="109" height="173" rx="19" fill="#282d31"/>
   <rect x="129" y="29" width="97" height="160" rx="14" fill="#fffdf9"/>
   <path d="M160 32h35" stroke="#282d31" strokeWidth="5" strokeLinecap="round"/>
   <path d="M145 58h45" stroke="#343a3e" strokeWidth="4" strokeLinecap="round"/>
   <path d="M145 68h59" stroke="#ddd9d0" strokeWidth="2" strokeLinecap="round"/>
   <rect x="140" y="81" width="75" height="26" rx="5" fill="#f5f2ec"/>
   <circle cx="150" cy="94" r="3" fill="#bf944e"/>
   <path d="M161 90h39m-39 7h25" stroke="#a7a49c" strokeWidth="2" strokeLinecap="round"/>
   <rect x="140" y="113" width="75" height="26" rx="5" fill="#f5f2ec"/>
   <circle cx="150" cy="126" r="3" stroke="#bf944e" strokeWidth="1.5"/>
   <path d="M161 122h39m-39 7h25" stroke="#a7a49c" strokeWidth="2" strokeLinecap="round"/>
   <rect x="140" y="149" width="75" height="24" rx="5" fill="#eac483"/>
   <path d="M163 161h26m-5-4 5 4-5 4" stroke="#51432d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </g>
  <g className="booking-confirmation">
   <rect x="193" y="112" width="119" height="57" rx="10" fill="#c8b999" opacity=".18" transform="translate(0 5)"/>
   <rect x="193" y="112" width="119" height="57" rx="10" fill="#fffdf9" stroke="#e7ddcd"/>
   <circle cx="212" cy="132" r="8" fill="#eac483"/>
   <path d="m208 132 3 3 5-6" stroke="#54422a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
   <text x="227" y="135" fill="#343a3e" fontSize="8" fontWeight="600">{lang === 'pl' ? 'Potwierdzono' : 'Confirmed'}</text>
   <path d="M205 153h42m7 0h27" stroke="#d6d0c6" strokeWidth="2" strokeLinecap="round"/>
  </g>
  <g className="art-sparkle" stroke="#bb965b" strokeWidth="1.4" strokeLinecap="round"><path d="M80 141v12m-6-6h12M267 65v8m-4-4h8"/></g>
 </svg>;
}

function PickupIllustration({lang}: {lang: Locale}) {
 return <svg viewBox="0 0 360 220" fill="none" aria-hidden="true" focusable="false">
  <circle cx="177" cy="109" r="80" fill="#f0e8d9"/>
  <path d="M37 192h286" stroke="#d1c8b8" strokeWidth="1.5" strokeLinecap="round"/>
  <path d="M44 192V93h162v99M44 93l22-18h140v18" stroke="#c7bba5" strokeWidth="1.5" strokeLinejoin="round"/>
  <path d="M57 111h136M57 137h136M57 163h111M76 103v81m33-81v81m33-81v81m33-81v45" stroke="#d4c8b3" strokeWidth="1.2"/>
  <rect x="85" y="77" width="57" height="19" rx="3" fill="#fffdf9" stroke="#dfd4c1"/>
  <text x="113.5" y="90" textAnchor="middle" fill="#74674f" fontSize="8" fontWeight="600" letterSpacing="2">KRK</text>
  <g className="arrival-plane" stroke="#a0804d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
   <path d="m257 49 19-8 11 4-16 12 3 12-6 3-9-12-12 3-5-5 15-9Z" fill="#ead1a5"/>
   <path d="m232 64-18 7m10-19-12 5" stroke="#cfbb9b"/>
  </g>
  <ellipse cx="240" cy="195" rx="55" ry="6" fill="#ddd5c5" opacity=".5"/>
  <circle cx="236" cy="104" r="12" fill="#e6c69c"/>
  <path d="M223 103c-1-18 26-18 26 1l-8-5-18 4Z" fill="#343a3e"/>
  <path d="m227 116-9 10-6 44h45l-5-44-11-10" fill="#343a3e"/>
  <path d="m231 116 5 21 4-21" fill="#fffdf9"/>
  <path d="m235 125-2 21 4 5 3-5-3-21" fill="#c8a46b"/>
  <path d="m227 170-3 23h10l4-23m9 0 5 23h-10l-5-23" fill="#292e32"/>
  <path d="m214 140-15 13m57-17 10 12" stroke="#343a3e" strokeWidth="8" strokeLinecap="round"/>
  <rect x="187" y="132" width="93" height="27" rx="4" fill="#fffdf9" stroke="#c3a576" strokeWidth="1.5"/>
  <text x="233.5" y="149" textAnchor="middle" fill="#7a633e" fontSize="8.5" fontWeight="600">{lang === 'pl' ? 'Twoje nazwisko' : 'Your name'}</text>
  <rect x="171" y="163" width="20" height="28" rx="4" fill="#d9ba85" stroke="#ae8e5b" strokeWidth="1.5"/>
  <path d="M177 163v-8h8v8m-5 5v17" stroke="#ae8e5b" strokeWidth="1.5" strokeLinecap="round"/>
  <circle cx="176" cy="194" r="2" fill="#343a3e"/><circle cx="186" cy="194" r="2" fill="#343a3e"/>
 </svg>;
}

function JourneyIllustration() {
 return <svg viewBox="0 0 360 220" fill="none" aria-hidden="true" focusable="false">
  <circle cx="183" cy="109" r="80" fill="#f0e8d9"/>
  <path d="M35 192h289" stroke="#d1c8b8" strokeWidth="1.5" strokeLinecap="round"/>
  <path d="M237 161V91l35-17 37 17v101m-72-31V91m35-17v69m-29-40h58m-58 17h58m-58 17h58m-41-46v55m19-55v55" stroke="#c7bba5" strokeWidth="1.5" strokeLinejoin="round"/>
  <path className="journey-route" d="M66 100h77q17 0 17-17V71q0-17 18-17h53" stroke="#c2a16b" strokeWidth="1.7" strokeDasharray="4 6" strokeLinecap="round"/>
  <path d="M54 72c-9 0-15 7-15 15 0 11 15 23 15 23s15-12 15-23c0-8-6-15-15-15Z" fill="#fffdf9" stroke="#c4a472" strokeWidth="1.5"/>
  <circle cx="54" cy="87" r="4" fill="#c4a472"/>
  <g className="destination-pin"><path d="M245 35c-9 0-15 7-15 15 0 11 15 23 15 23s15-12 15-23c0-8-6-15-15-15Z" fill="#eac483"/><circle cx="245" cy="50" r="4" fill="#fffdf9"/></g>
  <ellipse cx="164" cy="195" rx="102" ry="7" fill="#ddd5c5" opacity=".5"/>
  <g className="journey-car">
   <path d="m66 168 18-24 29-7h63l39 24 35 7 10 13-2 10H60l-2-12 8-11Z" fill="#343a3e"/>
   <path d="m94 144 21-3h29v23H79l15-20Zm55-3h25l32 23h-57v-23Z" fill="#c8d0ce"/>
   <path d="m93 148 22-3h21m20 0h15l16 12" stroke="#fffdf9" strokeWidth="2" opacity=".6" strokeLinecap="round"/>
   <path d="M64 171h28m5 0h144" stroke="#606463" strokeWidth="1.4"/>
   <path d="M255 174h-13" stroke="#eac483" strokeWidth="4" strokeLinecap="round"/>
   <path d="M62 174h8" stroke="#a88452" strokeWidth="4" strokeLinecap="round"/>
   <path d="M119 174h12m36 0h12" stroke="#a9afad" strokeWidth="2" strokeLinecap="round"/>
   <circle cx="96" cy="187" r="15" fill="#282d31" stroke="#7c807b" strokeWidth="2"/>
   <circle cx="96" cy="187" r="8" fill="#a8afaa"/><circle cx="96" cy="187" r="3" fill="#343a3e"/>
   <circle cx="223" cy="187" r="15" fill="#282d31" stroke="#7c807b" strokeWidth="2"/>
   <circle cx="223" cy="187" r="8" fill="#a8afaa"/><circle cx="223" cy="187" r="3" fill="#343a3e"/>
  </g>
 </svg>;
}
