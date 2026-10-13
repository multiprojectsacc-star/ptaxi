'use client';

import {ArrowRight, ArrowLeft, CalendarDays, Check, CheckCircle2, Clock3, Headphones, Info, LoaderCircle, LockKeyhole, Luggage, Pencil, Plane, Route, ShieldCheck, Users} from 'lucide-react';
import {VEHICLES, VEHICLE_BY_ID, formatPrice, type Locale, type VehicleId} from '@/lib/booking';
import {displayDate, type Quote} from '@/lib/client/booking';
import RouteMap from './RouteMap';

type Props = {
 quote: Quote; selected: VehicleId; lang: Locale; busy: boolean; error: string;
 onSelect: (id: VehicleId) => void; onContinue: () => void; onEdit: () => void;
};

export default function VehicleSelection({quote, selected, lang, busy, error, onSelect, onContinue, onEdit}: Props) {
 const t = (pl: string, en: string) => lang === 'pl' ? pl : en;
 const vehicle = VEHICLE_BY_ID[selected];
 const selectedOffer = quote.offers.find(offer => offer.vehicleId === selected);
 const available = !!selectedOffer?.available && quote.passengers <= vehicle.passengers && quote.luggage <= vehicle.mediumLuggage;
 const amount = selectedOffer?.amount ?? quote.amount;
 const waiting = quote.direction === 'from-airport' ? 60 : 15;
 const arrival = new Date(Date.parse(quote.departureAt) + quote.durationMinutes * 60000);
 const time = (date: string | Date) => new Intl.DateTimeFormat(lang === 'pl' ? 'pl-PL' : 'en-GB', {timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).format(new Date(date));

 return <div className="vehicle-workspace">
  <section className="vehicle-options" aria-labelledby="vehicle-selection-title">
   <div className="vehicle-screen-heading"><span className="section-kicker">{t('TWÓJ PRYWATNY TRANSFER', 'YOUR PRIVATE TRANSFER')}</span><h1 id="vehicle-selection-title">{t('Wybierz swój samochód.', 'Choose your vehicle.')}</h1><p>{t('Komfort dopasowany do Twojej podróży. Jedna cena za cały przejazd.', 'Comfort for your journey. One price for the entire transfer.')}</p></div>
   <div className="vehicle-route-compact"><div><span className="compact-route-dot"/><strong>{quote.from.name}</strong><ArrowRight size={14}/><strong>{quote.to.name}</strong></div><p>{displayDate(quote.departureAt, lang)}<span>·</span>{quote.passengers} {t('os.', 'guests')}<span>·</span>{quote.luggage} {t('wal.', 'bags')}</p><button onClick={onEdit} disabled={busy} aria-label={t('Edytuj trasę i termin', 'Edit route and date')}><Pencil size={16}/></button></div>
   {error && <div className="inline-error" role="alert"><Info size={17}/>{error}</div>}
   <div className="vehicle-choice-list" role="radiogroup" aria-label={t('Samochód na transfer', 'Transfer vehicle')}>
    {VEHICLES.map(v => {
     const offer = quote.offers.find(item => item.vehicleId === v.id);
     const fits = !!offer?.available && quote.passengers <= v.passengers && quote.luggage <= v.mediumLuggage;
     const chosen = selected === v.id;
     return <label key={v.id} className={'vehicle-choice' + (chosen ? ' selected' : '') + (!fits ? ' unavailable' : '')}>
      <input type="radio" name="transfer-vehicle" value={v.id} checked={chosen} disabled={busy || !fits} onChange={() => onSelect(v.id)}/>
      <div className="vehicle-choice-image"><img src={v.image} alt="" width="200" height="120"/></div>
      <div className="vehicle-choice-description"><span className="vehicle-category">{v.id === 'premium' ? t('KLASA PREMIUM', 'PREMIUM COMFORT') : v.id === 'van' ? t('DLA WIĘKSZEJ GRUPY', 'FOR YOUR GROUP') : t('CODZIENNY KOMFORT', 'EVERYDAY COMFORT')}</span><h2>{v.name}</h2><p>{v.description[lang]}</p><div className="vehicle-capacity"><span><Users size={15}/>{t('do', 'up to')} {v.passengers}</span><span><Luggage size={15}/>{t('do', 'up to')} {v.mediumLuggage}</span></div></div>
      <div className="vehicle-choice-price"><span className="choice-indicator" aria-hidden="true">{chosen && <Check size={13}/>}</span><strong>{formatPrice(offer?.amount ?? quote.amount, lang)}</strong><small>{fits ? t('za cały samochód', 'per private vehicle') : t('Za mało miejsca', 'Not enough room')}</small></div>
     </label>;
    })}
   </div>
   <div className="vehicle-included"><CheckCircle2 size={16}/><span>{t('Prywatny samochód', 'Private vehicle')}</span><span className="included-separator"/><Clock3 size={16}/><span>{waiting} {t('min oczekiwania w cenie', 'min waiting included')}</span></div>
   <div className="vehicle-next-bar"><div className="vehicle-next-price"><small>{vehicle.name}</small><strong>{formatPrice(amount, lang)}</strong></div><button className="vehicle-continue button" disabled={busy || !available} onClick={onContinue}>{busy ? <><LoaderCircle size={18} className="spin"/>{t('Przygotowuję rezerwację…', 'Preparing your booking…')}</> : <>{t('Dalej — dane pasażera', 'Continue — passenger details')}<ArrowRight size={19}/></>}</button></div>
  </section>

  <div className="vehicle-context">
   <section className="vehicle-map-panel" aria-label={t('Trasa Twojego transferu', 'Your transfer route')}><RouteMap quote={quote} lang={lang} expanded/></section>
   <aside className="vehicle-booking-summary" aria-labelledby="vehicle-summary-title">
    <div className="vehicle-summary-header"><div><span className="section-kicker">PERSONAL TAXI</span><h2 id="vehicle-summary-title">{t('Twój transfer', 'Your transfer')}</h2></div><button onClick={onEdit} disabled={busy} aria-label={t('Edytuj rezerwację', 'Edit booking')}><Pencil size={17}/></button></div>
    <div className="vehicle-summary-meta"><span><CalendarDays size={14}/>{new Intl.DateTimeFormat(lang === 'pl' ? 'pl-PL' : 'en-GB', {timeZone: 'Europe/Warsaw', day: 'numeric', month: 'short', year: 'numeric'}).format(new Date(quote.departureAt))}</span><span><Users size={14}/>{quote.passengers}</span><span><Luggage size={14}/>{quote.luggage}</span></div>
    <div className="vehicle-summary-stops"><div><span className="summary-stop-marker start"/><div><small>{t('ODBIÓR', 'PICKUP')}</small><strong>{quote.from.name}</strong>{quote.from.address !== quote.from.name && <p>{quote.from.address}</p>}</div><time>{time(quote.departureAt)}</time></div><p className="vehicle-summary-distance"><Route size={13}/>{new Intl.NumberFormat(lang, {maximumFractionDigits: 1}).format(quote.distanceKm)} km<span>·</span>{t('ok.', 'approx.')} {quote.durationMinutes} min</p><div><span className="summary-stop-marker end"/><div><small>{t('CEL PODRÓŻY', 'DESTINATION')}</small><strong>{quote.to.name}</strong>{quote.to.address !== quote.to.name && <p>{quote.to.address}</p>}</div><time><small>{t('ok.', 'approx.')}</small>{time(arrival)}</time></div></div>
    <div className="vehicle-summary-total"><div><span>{t('Łącznie za przejazd', 'Total transfer price')}</span><strong>{formatPrice(amount, lang)}</strong></div><p>{vehicle.name}<span>·</span>{t('Cena za cały samochód', 'Price for the entire vehicle')}</p></div>
    <details className="vehicle-price-details"><summary>{t('Co zawiera cena?', 'What is included?')}<span>+</span></summary><ul><li><Check size={13}/>{t('Prywatny przejazd pod wskazany adres', 'Private transfer to your chosen address')}</li>{quote.direction === 'from-airport' && <li><Check size={13}/>{t('Odbiór z tabliczką i monitorowanie lotu', 'Name-sign pickup and flight monitoring')}</li>}<li><Check size={13}/>{waiting} {t('minut oczekiwania na odbiór', 'minutes of waiting at pickup')}</li></ul></details>
    <div className="vehicle-summary-schedule"><div><small>{t('ODBIÓR', 'PICKUP')}</small><strong>{time(quote.departureAt)}</strong></div><div><small>{t('PLANOWANY DOJAZD', 'ESTIMATED ARRIVAL')}</small><strong>{time(arrival)}</strong></div><div><small>{t('PASAŻEROWIE · WALIZKI', 'PASSENGERS · BAGS')}</small><strong><Users size={13}/>{quote.passengers}<span>·</span><Luggage size={13}/>{quote.luggage}</strong></div></div>
    <div className="vehicle-wide-inclusions"><div className="summary-selected-vehicle"><img src={vehicle.image} alt=""/><div><small>{t('WYBRANY SAMOCHÓD', 'SELECTED VEHICLE')}</small><strong>{vehicle.name}</strong><p>{t('Do', 'Up to')} {vehicle.passengers} {t('pasażerów', 'passengers')}<span>·</span>{t('do', 'up to')} {vehicle.mediumLuggage} {t('walizek', 'bags')}</p></div></div><h3>{t('W Twojej rezerwacji', 'Included in your booking')}</h3><ul><li><CheckCircle2 size={16}/><div>{t('Przejazd bez przesiadek', 'Direct private transfer')}<small>{t('Odbiór i dowóz pod wskazany adres.', 'Pickup and drop-off at your chosen address.')}</small></div></li>{quote.direction === 'from-airport'&&<li><Plane size={16}/><div>{t('Monitorowanie przylotu', 'Flight monitoring')}<small>{t('Odbiór z tabliczką w hali przylotów.', 'Name-sign pickup in the arrivals hall.')}</small></div></li>}<li><Clock3 size={16}/><div>{waiting} {t('minut oczekiwania w cenie', 'minutes of waiting included')}<small>{quote.direction==='from-airport'?t('Czas na kontrolę i odbiór bagażu.', 'Time for arrivals checks and baggage collection.'):t('Spokojny odbiór spod Twojego adresu.', 'A relaxed pickup at your chosen address.')}</small></div></li></ul></div>
    <div className="vehicle-summary-assurance"><ShieldCheck size={18}/><p>{t('Cena znana przed rezerwacją', 'Know your fare before you book')}<small>{t('Sprawdzasz wszystkie dane przed płatnością.', 'Review all your details before payment.')}</small></p></div>
    <div className="vehicle-summary-support"><a href="tel:+48690048080"><Headphones size={17}/><span>{t('Pomoc w rezerwacji', 'Booking assistance')}<strong>+48 690 04 80 80</strong></span></a><span className="vehicle-payment"><LockKeyhole size={12}/>Przelewy<b>24</b></span></div>
   </aside>
  </div>
 </div>;
}
