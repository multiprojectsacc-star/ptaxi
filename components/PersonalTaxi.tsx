'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,ArrowLeft,ArrowUpRight,Plane,MapPin,CalendarDays,Users,Luggage,ShieldCheck,Clock3,Headphones,Globe2,ChevronDown,ChevronRight,Check,Plus,Minus,Phone,Mail,LoaderCircle,CheckCircle2,LockKeyhole,Info,CarFront,Route,CircleHelp} from 'lucide-react';
import {AIRPORT,VEHICLES,VEHICLE_BY_ID,formatPrice,type Locale,type VehicleId} from '@/lib/booking';
import {request,localWarsaw,warsawISO,displayDate,emptyDetails,type Trip,type Quote,type PassengerDetails,type BookingStatus} from '@/lib/client/booking';
import AddressInput from '@/components/booking/AddressInput';
import DeparturePicker from '@/components/booking/DeparturePicker';
import HowItWorks from '@/components/HowItWorks';
import VehicleSelection from '@/components/booking/VehicleSelection';
import DetailsJourney from '@/components/booking/DetailsJourney';
import BookingReview, {BookingReviewPayment} from '@/components/booking/BookingReview';
import PhoneField from '@/components/booking/PhoneField';
import SiteMenu from '@/components/SiteMenu';

const initialTrip:Trip={direction:'from-airport',location:null,departure:'',passengers:2,luggage:2};
type BookingResult={bookingId:string;status:string;statusToken:string;paymentUrl:string|null;mode:'demo'|'live'};

export default function PersonalTaxi(){
 const [lang,setLang]=useState<Locale>('pl');
 const [trip,setTrip]=useState<Trip>(initialTrip);
 const [details,setDetails]=useState<PassengerDetails>(emptyDetails);
 const [stage,setStage]=useState(0);
 const [quote,setQuote]=useState<Quote|null>(null);
 const [vehicleId,setVehicleId]=useState<VehicleId>('sedan');
 const [combi,setCombi]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [mode,setMode]=useState<'demo'|'live'>('demo');
 const [ready,setReady]=useState(false);
 const [acceptTerms,setAcceptTerms]=useState(false);
 const [status,setStatus]=useState<BookingStatus|null>(null);
 const [result,setResult]=useState<BookingResult|null>(null);
 const [help,setHelp]=useState(false);
 const t=(pl:string,en:string)=>lang==='pl'?pl:en;

 useEffect(()=>{
  setTrip(v=>({...v,departure:localWarsaw()}));
  try{
   const saved=JSON.parse(sessionStorage.getItem('personal-taxi-booking-v2')||'null');
   if(saved&&Date.now()-saved.savedAt<86400000){
    if(saved.trip&&['from-airport','to-airport'].includes(saved.trip.direction)&&saved.trip.passengers>=1&&saved.trip.passengers<=8){
     setTrip({...saved.trip,departure:saved.trip.departure&&Date.parse(saved.trip.departure)>Date.now()?saved.trip.departure:localWarsaw()});
    }
    if(saved.details)setDetails(saved.details);
    if(saved.quote&&saved.quote.expiresAt>Date.now()){setQuote(saved.quote);setVehicleId(saved.quote.offers?.some((o:{vehicleId:string;available:boolean})=>o.vehicleId===saved.vehicleId&&o.available)?saved.vehicleId:saved.quote.vehicleId);setCombi(saved.quote.combi);const path=window.location.pathname;setStage(path.endsWith("/samochod")?1:path.endsWith("/dane")?2:path.endsWith("/podsumowanie")?3:0);}
    if(saved.lang==='en')setLang('en');
   }
  }catch{}
  const requestedLang=new URLSearchParams(window.location.search).get('lang');if(requestedLang==='en'||requestedLang==='pl')setLang(requestedLang);
  setReady(true);
  request<{mode:'demo'|'live'}>('/api/config').then(c=>{setMode(c.mode);}).catch(()=>{});
  const token=new URLSearchParams(window.location.search).get('token');
  if(token){setStage(4);void loadStatus(token);}
 },[]);
 useEffect(()=>{
  if(!ready||stage===4)return;
  try{sessionStorage.setItem('personal-taxi-booking-v2',JSON.stringify({trip,details,lang,quote,vehicleId,savedAt:Date.now()}));}catch{}
 },[ready,trip,details,lang,stage,quote,vehicleId]);
 useEffect(()=>{document.documentElement.lang=lang;},[lang]);
 useEffect(()=>{setAcceptTerms(false);},[trip,vehicleId,combi]);
 useEffect(()=>{window.scrollTo({top:0,behavior:'auto'});},[stage]);


 function goStage(next:number){const paths=['/','/rezerwacja/samochod','/rezerwacja/dane','/rezerwacja/podsumowanie'];if(next<4&&window.location.pathname!==paths[next])window.history.pushState({},'',paths[next]);setStage(next);}
 useEffect(()=>{const pop=()=>{const path=window.location.pathname;setStage(path.endsWith('/samochod')?1:path.endsWith('/dane')?2:path.endsWith('/podsumowanie')?3:path.endsWith('/status')?4:0);};window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);},[]);
 function changeTrip(patch:Partial<Trip>){setTrip(v=>({...v,...patch}));setQuote(null);setError('');}
 async function createQuote(id:VehicleId,estate=false):Promise<Quote>{
  if(!trip.location)throw new Error(t('Wybierz adres z listy podpowiedzi.','Select an address from the suggestions.'));
  return request<Quote>('/api/quote',{direction:trip.direction,location:trip.location,departureAt:warsawISO(trip.departure),vehicleId:id,passengers:trip.passengers,luggage:trip.luggage,combi:estate,childSeats:0,boosterSeats:0,currency:'PLN'},lang);
 }
 async function findPrices(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError('');
  try{
   const id=trip.passengers>4||trip.luggage>4?'van':'sedan';
   const next=await createQuote(id);
   setQuote(next);setMode(next.mode);setVehicleId(id);setCombi(false);goStage(1);
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function selectVehicle(id:VehicleId){
  setBusy(true);setError('');
  try{const next=await createQuote(id);setQuote(next);setVehicleId(id);setCombi(false);goStage(2);}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function review(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError('');
  try{
   const next=await createQuote(vehicleId,combi);setQuote(next);
   setDetails(v=>({...v,customer:{firstName:v.customer.firstName.trim(),lastName:v.customer.lastName.trim(),email:v.customer.email.trim(),phone:v.customer.phone.trim()}}));
   goStage(3);
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function book(){
  if(!quote||!acceptTerms)return;setBusy(true);setError('');
  try{
   let current=quote;
   if(Date.now()>quote.expiresAt-30000){
    current=await createQuote(vehicleId,combi);setQuote(current);
    if(current.amount!==quote.amount){setAcceptTerms(false);throw new Error(t('Cena została odświeżona. Sprawdź nowe podsumowanie i potwierdź je ponownie.','The price has been refreshed. Please review and confirm it again.'));}
   }
   const {customer,flightNumber,notes,unusualItems,invoice}=details;
   const saved=await request<BookingResult>('/api/bookings',{quoteId:current.quoteId,customer,flightNumber,notes,unusualItems,invoice,locale:lang,acceptTerms:true},lang);
   setResult(saved);sessionStorage.removeItem('personal-taxi-booking-v2');
   window.history.replaceState({},'',`/rezerwacja/status?token=${encodeURIComponent(saved.statusToken)}`);
   if(saved.paymentUrl)window.location.assign(saved.paymentUrl);else setStage(4);
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function loadStatus(token:string){
  setBusy(true);setError('');
  try{const s=await request<BookingStatus>('/api/bookings/status?token='+encodeURIComponent(token),undefined,lang);setStatus(s);setMode(s.mode);}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 function reset(){goStage(0);setQuote(null);setStatus(null);setResult(null);setError('');setAcceptTerms(false);setDetails(emptyDetails);setTrip({...initialTrip,departure:localWarsaw()});window.history.replaceState({},'','/');}
 function editRoute(){goStage(0);setError('');window.history.replaceState({},'','/');}
 const vehicle=VEHICLE_BY_ID[vehicleId];
 const customer=details.customer;
 const updateCustomer=(key:keyof PassengerDetails['customer'],value:string)=>setDetails(v=>({...v,customer:{...v.customer,[key]:value}}));
 const invoice=details.invoice;
 const updateInvoice=(key:'companyName'|'taxId'|'address',value:string)=>setDetails(v=>({...v,invoice:{...v.invoice,[key]:value}}));
 const totalStatus=result?.status||status?.status;
 const isDemo=(result?.mode||status?.mode)==='demo';

 return <div className={'app-shell'+(stage===0?' home-screen':stage===1?' vehicle-screen':stage===2?' details-screen':stage===3?' details-screen review-screen':'')}>
  <header className="site-header">
   <div className="header-inner">
    <a className="brand" href="/" onClick={e=>{e.preventDefault();if(!busy)editRoute();}} aria-label="Personal Taxi — strona główna"><img src="/images/logo-transparent.png" alt="Personal Taxi"/><span className="brand-divider"/><span className="brand-location">KRAKÓW AIRPORT</span></a>
    {stage>=1&&stage<=3&&<nav className="vehicle-header-steps" aria-label={t('Etapy rezerwacji','Booking steps')}>{[t('Samochód','Vehicle'),t('Twoje dane','Your details'),t('Potwierdzenie','Confirmation')].map((name,i)=><span key={name} aria-current={i===stage-1?'step':undefined}><small>0{i+1}</small>{name}</span>)}</nav>}
    <div className="header-actions">
     {stage===0&&<SiteMenu lang={lang}/>}
     <button className="locale-button" onClick={()=>setLang(lang==='pl'?'en':'pl')} aria-label={t('Switch to English','Przełącz na polski')}><Globe2 size={17}/><span>{lang.toUpperCase()}</span><span className="currency">PLN</span><ChevronDown size={13}/></button>
     <div className="help-control"><button className="help-button" aria-expanded={help} onClick={()=>setHelp(!help)}><Headphones size={17}/>{t('Potrzebujesz pomocy?','Need help?')}<ChevronDown size={13}/></button>{help&&<div className="help-menu"><strong>{t('Porozmawiajmy o Twojej podróży','Let’s talk about your journey')}</strong><a href="tel:+48690048080"><Phone size={17}/>+48 690 04 80 80</a><a href="mailto:office@personaltaxi.pl"><Mail size={17}/>office@personaltaxi.pl</a></div>}</div>
    </div>
   </div>
  </header>

  {stage===0?<main>
   <section className="home-hero">
   <img className="hero-photo" src="/images/airport-hero.png" alt={t("Prywatny samochód przy terminalu lotniska","Private vehicle outside an airport terminal")} fetchPriority="high"/>
   <div className="hero-vignette"/>
   <div className="landing-layout container">
    <div className="landing-copy">
     <div className="service-label"><Plane size={17}/>{t('Prywatne transfery · Kraków Airport','Private transfers · Kraków Airport')}</div>
     <h1>{t('Lądujesz.','You land.')}<br/><span>{t('Resztę zostaw nam.','We take it from here.')}</span></h1>
     <p className="landing-description">{t('Prywatny transfer z i na Kraków Airport. Bez pośpiechu, bez szukania samochodu. Twój kierowca zajmie się podróżą.','Your private transfer to or from Kraków Airport. No rush, no searching for a car. Your driver takes care of the journey.')}</p>
     <div className="landing-footnote"><span className="airport-code">KRK</span><div><strong>Kraków. Balice.</strong><span>{t('Początek i koniec Twojej podróży.','The beginning and end of your journey.')}</span></div></div>
    </div>
    <div className="booking-column">
     <div className="service-tabs" role="tablist" aria-label={t('Kierunek transferu','Transfer direction')}>
      <button role="tab" aria-selected={trip.direction==='from-airport'} type="button" disabled={busy} className={trip.direction==='from-airport'?'active':''} onClick={()=>changeTrip({direction:'from-airport'})}><Plane size={17}/>{t('Z lotniska','From the airport')}</button>
      <button role="tab" aria-selected={trip.direction==='to-airport'} type="button" disabled={busy} className={trip.direction==='to-airport'?'active':''} onClick={()=>changeTrip({direction:'to-airport'})}><Plane size={17}/>{t('Na lotnisko','To the airport')}</button>
     </div>
     <form className="trip-form" onSubmit={findPrices}>
      <div className="form-intro"><span>01</span><div><h2>{t('Zaplanuj swój transfer','Plan your transfer')}</h2><p>{t('Dokąd jedziemy?','Where are we going?')}</p></div></div>
      {trip.direction==='from-airport'?<><AirportField label={t('Skąd','From')}/><AddressInput value={trip.location} onChange={location=>changeTrip({location})} lang={lang} label={t('Dokąd','To')} disabled={busy}/></>:<><AddressInput value={trip.location} onChange={location=>changeTrip({location})} lang={lang} label={t('Skąd','From')} disabled={busy}/><AirportField label={t('Dokąd','To')}/></>}
      <DeparturePicker value={trip.departure} onChange={departure=>changeTrip({departure})} lang={lang} disabled={busy}/>
      <div className="counts-row"><Counter label={t('Pasażerowie','Passengers')} icon={<Users size={19}/>} value={trip.passengers} min={1} max={8} disabled={busy} onChange={passengers=>changeTrip({passengers})}/><Counter label={t('Walizki','Suitcases')} icon={<Luggage size={19}/>} value={trip.luggage} min={0} max={7} disabled={busy} onChange={luggage=>changeTrip({luggage})}/></div>
      {error&&<div className="inline-error" role="alert"><Info size={17}/>{error}</div>}
      <button className="button yellow search-button" disabled={busy}>{busy?<><LoaderCircle className="spin" size={19}/>{t('Wyznaczam trasę…','Calculating your route…')}</>:<><span className="search-label-desktop">{t('Zobacz dostępne auta i ceny','See vehicles & prices')}</span><span className="search-label-mobile">{t('Sprawdź cenę','See prices')}</span><ArrowRight size={19}/></>}</button>
      <div className="form-reassurance"><LockKeyhole size={13}/>{t('Prywatny przejazd. Cena za cały samochód.','Private transfer. One price for the whole vehicle.')}</div>
     </form>
    </div>
   </div>
   <div className="hero-claims container">
    <span><ShieldCheck size={22}/><div><strong>{t('Cena znana z góry','Upfront pricing')}</strong><small>{t('Za cały prywatny przejazd','For your entire private transfer')}</small></div></span>
    <span><Users size={22}/><div><strong>{t('Odbiór z tabliczką','Personal meet & greet')}</strong><small>{t('Kierowca czeka na Ciebie','Your driver is waiting for you')}</small></div></span>
    <span><Plane size={22}/><div><strong>{t('Monitorowanie lotu','Flight monitoring')}</strong><small>{t('Dopasowujemy odbiór do przylotu','Pickup coordinated with your arrival')}</small></div></span>
    <span><Clock3 size={22}/><div><strong>{t('60 minut oczekiwania','60 minutes of waiting')}</strong><small>{t('Po przylocie, w cenie transferu','After arrival, included in your fare')}</small></div></span>
   </div>
   </section>
   <HowItWorks lang={lang}/>
   <section className="information-row container"><div><span className="section-kicker">{t('PRZED PODRÓŻĄ','BEFORE YOU TRAVEL')}</span><h2>{t('Wszystko, co warto wiedzieć.','Good to know before you go.')}</h2><p>{t('Masz inne pytanie? Jesteśmy pod telefonem.','Another question? Give us a call.')}</p><a href="tel:+48690048080"><Phone size={16}/>+48 690 04 80 80<ArrowUpRight size={16}/></a></div><div className="answers">{[
    [t('Czy mogę wybrać adres poza Krakowem?','Can I travel outside Kraków?'),t('Tak. Wyszukiwarka obejmuje miejscowości i adresy w Polsce. Jeden koniec trasy to zawsze lotnisko Kraków Balice. Nie stosujemy sztywnego limitu kilometrów.','Yes. Search covers towns and addresses throughout Poland. One end of the journey is always Kraków Airport. There is no fixed distance limit.')],
    [t('Z jakim wyprzedzeniem zarezerwować przejazd?','How far ahead should I book?'),t('Minimum 16 godzin przed odbiorem. Wcześniejszy przejazd możesz ustalić telefonicznie, zależnie od dostępności. Wszystkie godziny podajemy w czasie polskim.','At least 16 hours before pickup. Call us for a sooner transfer, subject to availability. All times use Poland local time.')],
    [t('Ile bagażu zmieści się w samochodzie?','How much luggage can I bring?'),t('Sedan: do 4 średnich lub 2 dużych walizek. Mini Van: do 7 średnich lub 4 dużych. Nietypowy bagaż opisz w formularzu rezerwacji.','Sedan: up to 4 medium or 2 large suitcases. Mini Van: up to 7 medium or 4 large. Describe unusual luggage in your booking.')],
    [t('Co obejmuje cena przejazdu?','What does the fare include?'),t('Prywatny samochód na wyznaczonej trasie i oczekiwanie: 60 minut po przylocie albo 15 minut przy odbiorze poza lotniskiem. Końcową kwotę zobaczysz przed rezerwacją.','Your private vehicle on the selected route and waiting: 60 minutes after arrival or 15 minutes for a non-airport pickup. You will see the final amount before booking.')]
   ].map(([q,a])=><details key={q}><summary>{q}<Plus size={17}/></summary><p>{a}</p></details>)}</div></section>
  </main>:<main className="booking-app">
   {stage===4&&<div className="booking-progress"><div className="container">{[t('Trasa','Route'),t('Samochód','Vehicle'),t('Twoje dane','Your details'),t('Potwierdzenie','Confirmation')].map((name,i)=><div key={i} className={stage>i?'complete':stage===i?'current':''}><span>{stage>i?<Check size={13}/>:i+1}</span>{name}{i<3&&<ChevronRight size={14}/>}</div>)}</div></div>}
   {stage===1&&quote?<VehicleSelection quote={quote} selected={vehicleId} lang={lang} busy={busy} error={error} onSelect={id=>{setVehicleId(id);setCombi(false);setError('');}} onContinue={()=>void selectVehicle(vehicleId)} onEdit={editRoute}/>:stage===4?<section className="confirmation-card container">
    {busy?<LoaderCircle className="spin" size={42}/>:<>
     <div className={'confirmation-symbol '+(error?'failed':'')}>{error?<CircleHelp size={34}/>:totalStatus==='pending'?<Clock3 size={34}/>:totalStatus==='payment_failed'?<Info size={34}/>:<CheckCircle2 size={34}/>}</div>
     <span className="section-kicker">PERSONAL TAXI</span>
     <h1>{error?t('Nie udało się odczytać rezerwacji.','We could not retrieve your booking.'):isDemo?t('Rezerwacja testowa zapisana.','Test booking saved.'):totalStatus==='paid'?t('Do zobaczenia w drodze.','See you on the road.'):totalStatus==='payment_failed'?t('Płatność nie została ukończona.','Payment was not completed.'):t('Czekamy na potwierdzenie płatności.','Waiting for payment confirmation.')}</h1>
     <p>{error?error:isDemo?t('Możesz przetestować cały proces na rzeczywistym adresie. Ta rezerwacja nie zamawia samochodu, nie pobiera opłaty i nie wysyła e-maila.','You can test the complete process with a real address. This test booking does not order a car, charge a payment or send an email.'):totalStatus==='paid'?t('Operator płatności potwierdził wpłatę. Twoja rezerwacja została zapisana.','The payment provider has verified your payment. Your booking is saved.'):t('Status zaktualizuje się po informacji od operatora płatności.','The status will update after confirmation from the payment provider.')}</p>
     {(result?.bookingId||status?.bookingId)&&<div className="reference"><small>{t('Numer rezerwacji','Booking reference')}</small><strong>{result?.bookingId||status?.bookingId}</strong></div>}
     {status&&<div className="confirmed-trip"><MapPin size={18}/><span>{status.from.name}<ArrowRight size={14}/>{status.to.name}</span></div>}
     {status?.status==='pending'&&<button className="button outline" onClick={()=>void loadStatus(new URLSearchParams(window.location.search).get('token')||'')}>{t('Odśwież status','Refresh status')}</button>}
     <button className="button yellow" onClick={reset}>{t('Wróć do rezerwacji','Back to booking')}<ArrowRight size={18}/></button>
    </>}
   </section>:quote&&<div className="details-workspace">
    <div className="booking-content details-content">
     {error&&<div className="inline-error" role="alert"><Info size={18}/>{error}</div>}
     {stage===2?<>
      <div className="screen-heading"><span className="section-kicker">{t('TWOJA PODRÓŻ, DOPRACOWANA','YOUR JOURNEY, TAKEN CARE OF')}</span><h1>{t('Kogo odbieramy?','Who are we picking up?')}</h1><p>{t('Podaj dane pasażera. Zadbamy o kontakt i sprawny odbiór.','Add your passenger details. We’ll take care of a smooth pickup.')}</p></div>
      <form id="passenger-details" className="passenger-form details-form" onSubmit={review}>
       <section className="form-section"><div className="details-form-heading"><span>01</span><div><h2>{t('Dane pasażera','Passenger details')}</h2><p>{t('Dane do potwierdzenia rezerwacji i kontaktu w dniu podróży.','For your booking confirmation and contact on the day.')}</p></div></div><div className="input-grid"><label>{t('Imię','First name')}<input required minLength={2} maxLength={50} autoComplete="given-name" value={customer.firstName} onChange={e=>updateCustomer('firstName',e.target.value)} placeholder="Anna"/></label><label>{t('Nazwisko','Last name')}<input required minLength={2} maxLength={60} autoComplete="family-name" value={customer.lastName} onChange={e=>updateCustomer('lastName',e.target.value)} placeholder={t('Kowalska','Smith')}/></label><label>{t('E-mail','Email')}<input required type="email" maxLength={50} autoComplete="email" value={customer.email} onChange={e=>updateCustomer('email',e.target.value)} placeholder="anna@example.com"/><small>{t('Tu wyślemy potwierdzenie rezerwacji.','We’ll send your confirmation here.')}</small></label><PhoneField locale={lang} value={customer.phone} country={details.phoneCountry} onChange={value=>updateCustomer('phone',value)} onCountryChange={phoneCountry=>setDetails(v=>({...v,phoneCountry}))}/></div></section>
       <section className="form-section"><div className="details-form-heading"><span>02</span><div><h2>{t('Szczegóły podróży','Travel details')}</h2><p>{t('Dodaj informacje, które pomogą nam przygotować Twój transfer.','Anything that helps us prepare for your transfer.')}</p></div></div><div className="input-grid"><label>{t('Numer lotu','Flight number')}<span>{t('Opcjonalnie','Optional')}</span><input maxLength={20} value={details.flightNumber} onChange={e=>setDetails(v=>({...v,flightNumber:e.target.value.toUpperCase()}))} placeholder="FR 1234"/><small>{t('Pomoże nam monitorować Twój przylot.','Helps us monitor your arrival.')}</small></label><label>{t('Nietypowy bagaż','Unusual luggage')}<span>{t('Opcjonalnie','Optional')}</span><input maxLength={500} value={details.unusualItems} onChange={e=>setDetails(v=>({...v,unusualItems:e.target.value}))} placeholder={t('Np. wózek dziecięcy','E.g. a pushchair')}/></label><label className="wide">{t('Wiadomość dla kierowcy','Message for your driver')}<span>{t('Opcjonalnie','Optional')}</span><textarea rows={3} maxLength={1000} value={details.notes} onChange={e=>setDetails(v=>({...v,notes:e.target.value}))} placeholder={t('Co powinniśmy wiedzieć przed odbiorem?','Anything we should know before pickup?')}/></label></div>{vehicle.supportsCombi&&<label className="checkbox-row"><input type="checkbox" checked={combi} onChange={e=>setCombi(e.target.checked)}/><span>{t('Preferuję samochód z nadwoziem kombi','I prefer an estate vehicle')}</span></label>}</section>
       <section className="form-section invoice-section"><label className="checkbox-row"><input type="checkbox" checked={invoice.requested} onChange={e=>setDetails(v=>({...v,invoice:{...v.invoice,requested:e.target.checked}}))}/><span>{t('Potrzebuję faktury na firmę','I need a company invoice')}</span></label>{invoice.requested&&<div className="input-grid"><label>{t('Nazwa firmy','Company name')}<input required maxLength={150} value={invoice.companyName} onChange={e=>updateInvoice('companyName',e.target.value)}/></label><label>{t('NIP / numer podatkowy','VAT / tax ID')}<input required maxLength={25} value={invoice.taxId} onChange={e=>updateInvoice('taxId',e.target.value)}/></label><label className="wide">{t('Adres firmy','Company address')}<input required maxLength={250} value={invoice.address} onChange={e=>updateInvoice('address',e.target.value)}/></label></div>}</section>
      </form>
     </>:<BookingReview quote={quote} details={details} lang={lang} busy={busy} onEdit={()=>{goStage(2);setError('');}}/>}

    </div>
    <DetailsJourney quote={quote} lang={lang} busy={busy} onEditRoute={editRoute} onEditVehicle={()=>{goStage(1);setError('');}}/>
    <div className="details-actions">
    {stage===2?<>
     <div className="details-next-note"><ShieldCheck size={16}/>{t('Sprawdzisz wszystkie dane przed płatnością.','You’ll review all your details before payment.')}</div>
     <div className="screen-actions"><button type="button" className="back-link" disabled={busy} onClick={()=>{goStage(1);setError('');}}><ArrowLeft size={17}/>{t('Wybór samochodu','Vehicle selection')}</button><button type="submit" form="passenger-details" className="button yellow" disabled={busy}>{busy?<LoaderCircle className="spin" size={18}/>:<>{t('Sprawdź rezerwację','Review booking')}<ArrowRight size={18}/></>}</button></div>
    </>:<BookingReviewPayment quote={quote} lang={lang} mode={mode} busy={busy} accepted={acceptTerms} onAccept={setAcceptTerms} onEdit={()=>{goStage(2);setError('');}} onBook={()=>void book()}/>}
    </div>
   </div>}
  </main>}
  <footer className="site-footer"><div className="container"><div><span>© {new Date().getFullYear()} Personal Taxi</span><small>Inter-Dywiz Sp. z o.o. · NIP 6751496482</small></div><nav aria-label={t('Informacje','Information')}><Link href={'/regulamin?lang='+lang}>{t('Regulamin','Terms')}</Link><Link href={'/rodo?lang='+lang}>{t('RODO','Privacy')}</Link><a href="mailto:office@personaltaxi.pl">{t('Kontakt','Contact')}<ArrowUpRight size={13}/></a></nav><div className="footer-payment"><LockKeyhole size={13}/><span>Przelewy<b>24</b></span></div></div></footer>
 </div>;
}
function AirportField({label}:{label:string}){return <div className="booking-field airport-field"><Plane size={21}/><div><small>{label}</small><strong>Kraków Airport <span>KRK</span></strong><p>Balice · terminal pasażerski</p></div><LockKeyhole size={14}/></div>;}
function Counter({label,icon,value,min,max,onChange,disabled}:{label:string;icon:React.ReactNode;value:number;min:number;max:number;onChange:(n:number)=>void;disabled?:boolean}){return <div className="counter-field"><div>{icon}<span>{label}</span></div><div className="counter-actions"><button type="button" aria-label={'Zmniejsz: '+label} disabled={disabled||value<=min} onClick={()=>onChange(value-1)}><Minus size={15}/></button><output aria-label={label}>{value}</output><button type="button" aria-label={'Zwiększ: '+label} disabled={disabled||value>=max} onClick={()=>onChange(value+1)}><Plus size={15}/></button></div></div>;}
