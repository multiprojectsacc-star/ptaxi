'use client';

import {useEffect, useRef, useState} from 'react';
import {Pause, Play} from 'lucide-react';
import type {Locale} from '@/lib/booking';

type Translate = (pl: string, en: string) => string;

export default function HowItWorks({lang}: {lang: Locale}) {
 const section = useRef<HTMLElement>(null);
 const [paused, setPaused] = useState(false);
 const t: Translate = (pl, en) => lang === 'pl' ? pl : en;

 useEffect(() => {
  const panels = section.current?.querySelectorAll('.step-motion');
  if (!panels) return;
  const observer = new IntersectionObserver(entries => {
   for (const entry of entries) entry.target.classList.toggle('is-playing', entry.isIntersecting);
  }, {threshold: 0.2});
  panels.forEach(panel => observer.observe(panel));
  return () => observer.disconnect();
 }, []);

 const steps = [
  {title: t('Zamawiasz transfer', 'Book your transfer'),
   description: t('Wybierz trasę, termin i samochód. Sprawdź cenę całego przejazdu i zarezerwuj go online.', 'Choose your route, date and vehicle. See the price for the entire journey and book online.'),
   motion: <BookingMotion t={t}/>},
  {title: t('Odbieramy Cię po przylocie', 'Meet your driver on arrival'),
   description: t('Monitorujemy lot. Kierowca czeka w hali przylotów z tabliczką z Twoim nazwiskiem i pomaga z bagażem.', 'We monitor your flight. Your driver meets you in arrivals with a personalised name sign and helps with your luggage.'),
   motion: <ArrivalMotion t={t}/>},
  {title: t('Docierasz pod wskazany adres', 'Arrive at your destination'),
   description: t('Podróżujesz prywatnym samochodem prosto do hotelu, domu lub innego wybranego miejsca.', 'Travel in a private vehicle directly to your hotel, home or another destination of your choice.'),
   motion: <TransferMotion t={t}/>},
 ];

 return <section className="how-it-works" ref={section} data-paused={paused} aria-labelledby="how-it-works-title">
  <div className="container">
   <div className="how-heading">
    <div><span className="section-kicker">{t('JAK TO DZIAŁA', 'HOW IT WORKS')}</span>
     <h2 id="how-it-works-title">{t('Od rezerwacji','From your booking')}<br/>{t('do miejsca docelowego.','to your destination.')}</h2>
    </div>
    <p>{t('Rezerwacja online. Osobisty odbiór na lotnisku. Komfortowy przejazd pod wskazany adres. O każdy etap zadbamy za Ciebie.', 'Online booking. A personal airport pickup. A comfortable journey to your chosen address. We take care of every stage.')}</p>
   </div>
   <ol className="transfer-steps">
    {steps.map((step, index) => <li className="transfer-step" key={index}>
     <div className="step-motion" aria-hidden="true">{step.motion}</div>
     <div className="step-caption"><span className="step-number" aria-hidden="true">0{index + 1}</span>
      <div><h3>{step.title}</h3><p>{step.description}</p></div>
     </div>
    </li>)}
   </ol>
   <div className="how-section-footer">
    <p className="how-return-note">{t('Transfer na lotnisko? Kierowca odbierze Cię spod wskazanego adresu i zawiezie bezpośrednio do terminalu Kraków Airport.', 'Travelling to the airport? Your driver picks you up at your chosen address and takes you directly to the Kraków Airport terminal.')}</p>
    <button className="motion-toggle" onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? <Play size={12}/> : <Pause size={12}/>}<span>{paused ? t('Odtwórz animacje','Play animations') : t('Wstrzymaj animacje','Pause animations')}</span></button>
   </div>
  </div>
 </section>;
}

function BookingMotion({t}: {t: Translate}) {
 return <div className="motion-interface booking-motion">
  <div className="motion-panel-header"><span>{t('REZERWACJA ONLINE','ONLINE BOOKING')}</span></div>
  <div className="reservation-lines">
   <div className="reservation-line motion-animated booking-route"><small>{t('TRASA','ROUTE')}</small><strong>Kraków Airport <span>→</span> {t('Twój adres','Your address')}</strong><span className="reservation-line-indicator motion-animated route-selected"/></div>
   <div className="reservation-line motion-animated booking-vehicle"><small>{t('SAMOCHÓD I TERMIN','VEHICLE & DATE')}</small><strong>{t('Wybrane dla Twojej podróży','Chosen for your journey')}</strong><span className="reservation-line-indicator motion-animated vehicle-selected"/></div>
  </div>
  <div className="reservation-completion"><div className="booking-progress-track"><span className="motion-animated booking-progress-fill"/></div><div className="booking-status motion-animated booking-status-pending">{t('Przygotowujemy rezerwację','Preparing your booking')}</div><div className="booking-status motion-animated booking-status-complete"><span className="status-check">✓</span>{t('Rezerwacja potwierdzona','Booking confirmed')}</div></div>
 </div>;
}

function ArrivalMotion({t}: {t: Translate}) {
 return <div className="motion-interface arrival-motion">
  <div className="motion-panel-header"><span>{t('MONITORING I ODBIÓR','MONITORING & PICKUP')}</span></div>
  <div className="arrival-status"><span className="motion-animated flight-status-pending">{t('Monitorujemy Twój lot','Monitoring your flight')}</span><span className="motion-animated flight-status-landed">{t('Samolot wylądował','Your plane has landed')}</span></div>
  <svg className="arrival-chart" viewBox="0 0 320 90" fill="none" focusable="false">
   <path d="M7 69H224M7 38H224M234 9V83" stroke="#334048" strokeWidth=".7"/>
   <path d="M19 53H211" stroke="#516068" strokeWidth="1" strokeDasharray="3 5"/>
   <path className="motion-animated flight-trace" d="M19 53H211" stroke="#d3b17a" strokeWidth="1.4" pathLength="1" strokeDasharray="1"/>
   <g className="motion-animated flight-marker" stroke="#e0c391" strokeWidth="1.4" strokeLinejoin="round"><path d="M-9-4-3-3 2-11h3L3-3l8 2v2L3 3l2 8H2L-3 3l-6 1-2-4 2-4Z" fill="#1d282f"/></g>
   <circle cx="211" cy="53" r="3" fill="#d3b17a"/><circle className="motion-animated airport-signal" cx="211" cy="53" r="9" stroke="#d3b17a" strokeWidth="1"/>
   <g className="arrival-driver-icon" stroke="#cbb184" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="276" cy="19" rx="8" ry="9"/>
    <path d="M272 28v6m8-6v6m-8 0c-11 2-18 8-20 16l-2 10m30-26c11 2 18 8 20 16l2 10M272 34l4 15 4-15m-4 8v13m-16-9-1 14m34-14 1 14"/>
    <rect x="243" y="60" width="66" height="23" rx="2" fill="#1d282f"/>
    <text x="276" y="75" stroke="none" fill="#dec79e" fontSize="8" fontWeight="450" textAnchor="middle">{t('Twoje imię','Your name')}</text>
   </g>
  </svg>
  <div className="driver-ready"><span className="driver-status-light motion-animated"/><div><strong>{t('Kierowca czeka na Ciebie','Your driver is waiting')}</strong><small>{t('Odbiór z tabliczką w hali przylotów','Meet & greet in the arrivals hall')}</small></div></div>
 </div>;
}

function TransferMotion({t}: {t: Translate}) {
 return <div className="motion-interface transfer-motion">
  <div className="motion-panel-header"><span>{t('PRYWATNY TRANSFER','PRIVATE TRANSFER')}</span></div>
  <svg className="transfer-chart" viewBox="0 0 320 180" fill="none" focusable="false">
   <g stroke="#35434b" strokeWidth=".7"><path d="M-10 25 90 25 145 0M-10 65 80 65 80 190M20-10V190M63-10V190M-10 115H330M-10 152H330M165-10V190M215-10V190M270-10V190M115-10V70M165 45H330M220 5H330"/><path d="m290-10-50 42-8 30-67 5-18 27-82-12-40 16"/></g>
   <path d="M35 150H110Q125 150 125 135V75Q125 60 140 60H265Q280 60 280 45V35" stroke="#64747a" strokeWidth="1.4"/>
   <path className="motion-animated transfer-route-trace" d="M35 150H110Q125 150 125 135V75Q125 60 140 60H265Q280 60 280 45V35" stroke="#d5b37c" strokeWidth="2" pathLength="1" strokeDasharray="1"/>
   <circle cx="35" cy="150" r="4" fill="#1d282f" stroke="#d5b37c" strokeWidth="1.3"/><circle cx="280" cy="35" r="4" fill="#d5b37c"/>
   <g className="motion-animated transfer-route-marker"><circle r="7" fill="#172026" stroke="#d5b37c" strokeWidth="1.5"/><circle r="2.5" fill="#e5c78f"/></g>
   <text x="35" y="171" fill="#9eacb3" fontSize="9">Kraków Airport</text><text x="271" y="21" textAnchor="end" fill="#cfb889" fontSize="9">{t('Twój adres','Your address')}</text>
  </svg>
  <div className="journey-status"><span className="motion-animated journey-status-moving">{t('W drodze do celu','On the way')}</span><span className="motion-animated journey-status-arrived">{t('Jesteś na miejscu','Arrived at your destination')}</span></div>
 </div>;
}
