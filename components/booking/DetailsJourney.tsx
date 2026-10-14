'use client';

import {ArrowUpRight, CalendarDays, Clock3, Headphones, Luggage, Pencil, Route, Users} from 'lucide-react';
import {VEHICLE_BY_ID, formatPrice, type Locale} from '@/lib/booking';
import type {Quote} from '@/lib/client/booking';
import RouteMap from './RouteMap';

export default function DetailsJourney({quote, lang, busy, onEditRoute, onEditVehicle}: {
 quote: Quote; lang: Locale; busy: boolean; onEditRoute: () => void; onEditVehicle: () => void;
}) {
 const t = (pl: string, en: string) => lang === 'pl' ? pl : en;
 const vehicle = VEHICLE_BY_ID[quote.vehicleId];
 const arrival = new Date(Date.parse(quote.departureAt) + quote.durationMinutes * 60000);
 const time = (value: string | Date) => new Intl.DateTimeFormat(lang === 'pl' ? 'pl-PL' : 'en-GB', {timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).format(new Date(value));
 const date = new Intl.DateTimeFormat(lang === 'pl' ? 'pl-PL' : 'en-GB', {timeZone: 'Europe/Warsaw', day: 'numeric', month: 'long', year: 'numeric'}).format(new Date(quote.departureAt));

 return <aside className="details-journey" aria-label={t('Plan Twojego przejazdu', 'Your journey plan')}>
  <div className="details-map"><RouteMap quote={quote} lang={lang} expanded/></div>
  <section className="details-journey-card" aria-labelledby="details-journey-title">
   <div className="details-journey-heading"><div><span className="section-kicker">{t('WSZYSTKO W JEDNYM MIEJSCU', 'YOUR JOURNEY AT A GLANCE')}</span><h2 id="details-journey-title">{t('Twój przejazd', 'Your journey')}</h2></div><button type="button" onClick={onEditRoute} disabled={busy}><Pencil size={14}/>{t('Zmień trasę', 'Edit route')}</button></div>
   <div className="details-journey-meta"><span><CalendarDays size={15}/>{date}</span><span><Users size={15}/>{quote.passengers}<span className="details-meta-divider"/><Luggage size={15}/>{quote.luggage}</span></div>
   <ol className="details-route">
    <li><span className="details-stop-marker"/><div><small>{t('MIEJSCE ODBIORU', 'PICKUP LOCATION')}</small><strong>{quote.from.name}</strong>{quote.from.address !== quote.from.name && <p>{quote.from.address}</p>}</div><time dateTime={quote.departureAt}>{time(quote.departureAt)}</time></li>
    <li className="details-route-distance"><Route size={14}/>{new Intl.NumberFormat(lang, {maximumFractionDigits: 1}).format(quote.distanceKm)} km<span>·</span>{t('około', 'approx.')} {quote.durationMinutes} min</li>
    <li><span className="details-stop-marker destination"/><div><small>{t('MIEJSCE DOCELOWE', 'DESTINATION')}</small><strong>{quote.to.name}</strong>{quote.to.address !== quote.to.name && <p>{quote.to.address}</p>}</div><time dateTime={arrival.toISOString()}><small>{t('ok.', 'approx.')}</small>{time(arrival)}</time></li>
   </ol>
   <div className="details-selected-vehicle"><img src={vehicle.image} alt="" width="160" height="100"/><div><small>{t('TWÓJ SAMOCHÓD', 'YOUR VEHICLE')}</small><h3>{vehicle.name}{quote.combi ? ' · kombi' : ''}</h3><p><Users size={13}/>{quote.passengers}<span>·</span><Luggage size={13}/>{quote.luggage}</p></div><button type="button" onClick={onEditVehicle} disabled={busy} aria-label={t('Zmień wybrany samochód', 'Change selected vehicle')}><Pencil size={15}/></button></div>
   <div className="details-journey-included"><Clock3 size={16}/><p>{quote.direction === 'from-airport' ? t('Odbiór z tabliczką i 60 minut oczekiwania w cenie.', 'Name-sign pickup and 60 minutes of waiting included.') : t('Odbiór spod wskazanego adresu i 15 minut oczekiwania w cenie.', 'Pickup at your chosen address and 15 minutes of waiting included.')}</p></div>
   <div className="details-journey-total"><div><span>{t('Cena Twojego transferu', 'Your transfer price')}</span><small>{t('Za cały prywatny samochód', 'For the entire private vehicle')}</small></div><strong>{formatPrice(quote.amount, lang)}</strong></div>
  </section>
  <a className="details-journey-help" href="tel:+48690048080"><Headphones size={21}/><span><small>{t('Potrzebujesz pomocy przy rezerwacji?', 'Need a hand with your booking?')}</small><strong>+48 690 04 80 80</strong></span><ArrowUpRight size={17}/></a>
 </aside>;
}
