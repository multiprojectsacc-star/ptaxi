'use client';

import {useEffect,useState} from 'react';
import {ArrowRight,ArrowLeft,ArrowUpRight,Plane,MapPin,CalendarDays,Users,Luggage,ShieldCheck,Clock3,Headphones,Globe2,ChevronDown,ChevronRight,Check,Plus,Minus,Phone,Mail,X,LoaderCircle,CheckCircle2,LockKeyhole,Info,CarFront,Route,CircleHelp} from 'lucide-react';
import {AIRPORT,VEHICLES,VEHICLE_BY_ID,formatPrice,type Locale,type VehicleId} from '@/lib/booking';
import {request,localWarsaw,warsawISO,displayDate,emptyDetails,type Trip,type Quote,type PassengerDetails,type BookingStatus} from '@/lib/client/booking';
import AddressInput from '@/components/booking/AddressInput';
import DeparturePicker from '@/components/booking/DeparturePicker';
import RouteMap from '@/components/booking/RouteMap';
import HowItWorks from '@/components/HowItWorks';

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
 const [mapsMode,setMapsMode]=useState<'live'|'demo'>('live');
 const [ready,setReady]=useState(false);
 const [acceptTerms,setAcceptTerms]=useState(false);
 const [status,setStatus]=useState<BookingStatus|null>(null);
 const [result,setResult]=useState<BookingResult|null>(null);
 const [help,setHelp]=useState(false);
 const [legal,setLegal]=useState<'terms'|'privacy'|null>(null);
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
    if(saved.quote&&saved.quote.expiresAt>Date.now()){setQuote(saved.quote);setVehicleId(saved.quote.vehicleId);setCombi(saved.quote.combi);const path=window.location.pathname;setStage(path.endsWith("/samochod")?1:path.endsWith("/dane")?2:path.endsWith("/podsumowanie")?3:0);}
    if(saved.lang==='en')setLang('en');
   }
  }catch{}
  setReady(true);
  request<{mode:'demo'|'live';mapsMode:'live'|'demo'}>('/api/config').then(c=>{setMode(c.mode);setMapsMode(c.mapsMode);}).catch(()=>{});
  const token=new URLSearchParams(window.location.search).get('token');
  if(token){setStage(4);void loadStatus(token);}
 },[]);
 useEffect(()=>{
  if(!ready||stage===4)return;
  try{sessionStorage.setItem('personal-taxi-booking-v2',JSON.stringify({trip,details,lang,quote,savedAt:Date.now()}));}catch{}
 },[ready,trip,details,lang,stage,quote]);
 useEffect(()=>{document.documentElement.lang=lang;},[lang]);
 useEffect(()=>{setAcceptTerms(false);},[trip,vehicleId,combi]);
 useEffect(()=>{window.scrollTo({top:0,behavior:'auto'});},[stage]);
 useEffect(()=>{
  if(!legal)return;
  const before=document.body.style.overflow;document.body.style.overflow='hidden';
  const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setLegal(null);};window.addEventListener('keydown',close);
  return()=>{document.body.style.overflow=before;window.removeEventListener('keydown',close);};
 },[legal]);

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
   setQuote(next);setMode(next.mode);setMapsMode(next.mapsMode);setVehicleId(id);setCombi(false);goStage(1);
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
   const saved=await request<BookingResult>('/api/bookings',{quoteId:current.quoteId,...details,locale:lang,acceptTerms:true},lang);
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

 return <div className="app-shell">
  <header className="site-header">
   <div className="header-inner">
    <a className="brand" href="/" onClick={e=>{e.preventDefault();if(!busy)editRoute();}} aria-label="Personal Taxi — strona główna"><img src="/images/logo-transparent.png" alt="Personal Taxi"/><span className="brand-divider"/><span className="brand-location">KRAKÓW AIRPORT</span></a>
    <div className="header-actions">
     <button className="locale-button" onClick={()=>setLang(lang==='pl'?'en':'pl')} aria-label={t('Switch to English','Przełącz na polski')}><Globe2 size={17}/><span>{lang.toUpperCase()}</span><span className="currency">PLN</span><ChevronDown size={13}/></button>
     <div className="help-control"><button className="help-button" aria-expanded={help} onClick={()=>setHelp(!help)}><Headphones size={17}/>{t('Potrzebujesz pomocy?','Need help?')}<ChevronDown size={13}/></button>{help&&<div className="help-menu"><strong>{t('Porozmawiajmy o Twojej podróży','Let’s talk about your journey')}</strong><a href="tel:+48690048080"><Phone size={17}/>+48 690 04 80 80</a><a href="mailto:office@personaltaxi.pl"><Mail size={17}/>office@personaltaxi.pl</a></div>}</div>
    </div>
   </div>
  </header>
  {mode==='demo'&&<div className="test-strip"><span/>{mapsMode==='live'?t('Podgląd rezerwacji · rzeczywiste adresy i trasy · płatności testowe','Booking preview · real addresses and routes · test payments'):t('Podgląd rezerwacji · płatności testowe','Booking preview · test payments')}</div>}

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
      <button className="button yellow search-button" disabled={busy}>{busy?<><LoaderCircle className="spin" size={19}/>{t('Wyznaczam trasę…','Calculating your route…')}</>:<>{t('Zobacz dostępne auta i ceny','See vehicles & prices')}<ArrowRight size={19}/></>}</button>
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
   <section className="service-details container">
    <div><span className="detail-number">01</span><h3>{t('Odbiór bez szukania','A seamless pickup')}</h3><p>{t('Kierowca czeka w hali przylotów z tabliczką z Twoim nazwiskiem.','Your driver meets you in arrivals with a personalised name sign.')}</p></div>
    <div><span className="detail-number">02</span><h3>{t('Twój lot pod kontrolą','We follow your flight')}</h3><p>{t('Podaj numer lotu. Monitorujemy przylot i organizujemy odbiór.','Add your flight number. We track your arrival and arrange the pickup.')}</p></div>
    <div><span className="detail-number">03</span><h3>{t('Komfort dla całej grupy','Room for everyone')}</h3><p>{t('Sedan, Premium lub Mini Van — wybierz samochód dla maksymalnie 8 osób.','Sedan, Premium or Mini Van — choose a vehicle for up to 8 passengers.')}</p></div>
   </section>
   <HowItWorks lang={lang}/>
   <section className="information-row container"><div><span className="section-kicker">{t('PRZED PODRÓŻĄ','BEFORE YOU TRAVEL')}</span><h2>{t('Wszystko, co warto wiedzieć.','Good to know before you go.')}</h2><p>{t('Masz inne pytanie? Jesteśmy pod telefonem.','Another question? Give us a call.')}</p><a href="tel:+48690048080"><Phone size={16}/>+48 690 04 80 80<ArrowUpRight size={16}/></a></div><div className="answers">{[
    [t('Czy mogę wybrać adres poza Krakowem?','Can I travel outside Kraków?'),t('Tak. Wyszukiwarka obejmuje miejscowości i adresy w Polsce. Jeden koniec trasy to zawsze lotnisko Kraków Balice. Nie stosujemy sztywnego limitu kilometrów.','Yes. Search covers towns and addresses throughout Poland. One end of the journey is always Kraków Airport. There is no fixed distance limit.')],
    [t('Z jakim wyprzedzeniem zarezerwować przejazd?','How far ahead should I book?'),t('Minimum 16 godzin przed odbiorem. Wcześniejszy przejazd możesz ustalić telefonicznie, zależnie od dostępności. Wszystkie godziny podajemy w czasie polskim.','At least 16 hours before pickup. Call us for a sooner transfer, subject to availability. All times use Poland local time.')],
    [t('Ile bagażu zmieści się w samochodzie?','How much luggage can I bring?'),t('Sedan: do 4 średnich lub 2 dużych walizek. Mini Van: do 7 średnich lub 4 dużych. Nietypowy bagaż opisz w formularzu rezerwacji.','Sedan: up to 4 medium or 2 large suitcases. Mini Van: up to 7 medium or 4 large. Describe unusual luggage in your booking.')],
    [t('Co obejmuje cena przejazdu?','What does the fare include?'),t('Prywatny samochód na wyznaczonej trasie i oczekiwanie: 60 minut po przylocie albo 15 minut przy odbiorze poza lotniskiem. Końcową kwotę zobaczysz przed rezerwacją.','Your private vehicle on the selected route and waiting: 60 minutes after arrival or 15 minutes for a non-airport pickup. You will see the final amount before booking.')]
   ].map(([q,a])=><details key={q}><summary>{q}<Plus size={17}/></summary><p>{a}</p></details>)}</div></section>
  </main>:<main className="booking-app">
   <div className="booking-progress"><div className="container">{[t('Trasa','Route'),t('Samochód','Vehicle'),t('Twoje dane','Your details'),t('Potwierdzenie','Confirmation')].map((name,i)=><div key={i} className={stage>i?'complete':stage===i?'current':''}><span>{stage>i?<Check size={13}/>:i+1}</span>{name}{i<3&&<ChevronRight size={14}/>}</div>)}</div></div>
   {stage===4?<section className="confirmation-card container">
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
   </section>:quote&&<div className="booking-workspace container">
    <aside className="trip-sidebar"><div className="trip-card"><div className="trip-card-title"><h2>{t('Twój przejazd','Your journey')}</h2><button disabled={busy} onClick={editRoute}>{t('Edytuj','Edit')}</button></div><RouteMap quote={quote}/><div className="route-stops"><div><span>A</span><small>{t('ODBIÓR','PICKUP')}</small><strong>{quote.from.name}</strong>{quote.from.address!==quote.from.name&&<p>{quote.from.address}</p>}</div><div><span>B</span><small>{t('CEL PODRÓŻY','DESTINATION')}</small><strong>{quote.to.name}</strong>{quote.to.address!==quote.to.name&&<p>{quote.to.address}</p>}</div></div><div className="trip-meta"><span><CalendarDays size={16}/>{displayDate(quote.departureAt,lang)}</span><span><Users size={16}/>{quote.passengers} {t('pasażerów','passengers')}<Luggage size={16}/>{quote.luggage} {t('walizek','suitcases')}</span><span><Route size={16}/>{quote.distanceKm.toFixed(1)} km<Clock3 size={16}/>{t('ok.','approx.')} {quote.durationMinutes} min</span></div>{stage>1&&<div className="sidebar-total"><small>{vehicle.name}{quote.combi?' · kombi':''}</small><div><span>{t('Łączna cena','Total price')}</span><strong>{formatPrice(quote.amount,lang)}</strong></div></div>}</div><div className="sidebar-help"><Headphones size={24}/><div><strong>{t('Jesteśmy do Twojej dyspozycji','We’re here to help')}</strong><a href="tel:+48690048080">+48 690 04 80 80</a></div></div></aside>
    <div className="booking-content">
     {error&&<div className="inline-error" role="alert"><Info size={18}/>{error}</div>}
     {stage===1?<>
      <div className="screen-heading"><span className="section-kicker">{t('02 / WYBIERZ SWÓJ KOMFORT','02 / CHOOSE YOUR COMFORT')}</span><h1>{t('Samochód na Twoją podróż.','The right vehicle for your journey.')}</h1><p>{t('Wszystkie ceny obejmują cały prywatny przejazd.','All fares cover the entire private transfer.')}</p></div>
      <div className="offer-list">{VEHICLES.map(v=>{const offer=quote.offers.find(o=>o.vehicleId===v.id);const available=trip.passengers<=v.passengers&&trip.luggage<=v.mediumLuggage;return <article className={'vehicle-offer '+(!available?'unavailable':'')} key={v.id}><div className="offer-image"><img src={v.image} alt={v.name}/></div><div className="offer-info"><div className="offer-labels"><span>{v.id==='premium'?t('WIĘCEJ KOMFORTU','EXTRA COMFORT'):v.id==='van'?t('DLA CAŁEJ GRUPY','FOR YOUR WHOLE GROUP'):t('DOBRY WYBÓR','A GREAT CHOICE')}</span></div><h2>{v.name}</h2><p>{v.description[lang]}</p><div className="offer-specs"><span><Users size={16}/>{t('do','up to')} {v.passengers}</span><span><Luggage size={16}/>{t('do','up to')} {v.mediumLuggage}</span><span><Check size={15}/>{t('Prywatny transfer','Private transfer')}</span></div></div><div className="offer-price"><small>{t('Cena za cały przejazd','Total transfer price')}</small><strong>{formatPrice(offer?.amount||quote.amount,lang)}</strong><button className="button yellow" disabled={!available||busy} onClick={()=>void selectVehicle(v.id)}>{busy?<LoaderCircle className="spin" size={17}/>:<>{available?t('Wybierz','Select'):t('Za mało miejsca','Not enough room')}<ArrowRight size={17}/></>}</button></div></article>;})}</div>
      <div className="included-note"><ShieldCheck size={21}/><p>{trip.direction==='from-airport'?t('W cenie: prywatny samochód, odbiór z tabliczką i 60 minut oczekiwania po przylocie.','Included: your private vehicle, a name-sign pickup and 60 minutes of waiting after arrival.'):t('W cenie: prywatny samochód i 15 minut oczekiwania przy odbiorze.','Included: your private vehicle and 15 minutes of waiting at pickup.')}</p></div>
      <button className="back-link" onClick={editRoute}><ArrowLeft size={16}/>{t('Zmień trasę','Edit your route')}</button>
     </>:stage===2?<>
      <div className="screen-heading"><span className="section-kicker">{t('03 / SZCZEGÓŁY REZERWACJI','03 / BOOKING DETAILS')}</span><h1>{t('Kogo odbieramy?','Who are we picking up?')}</h1><p>{t('Podaj dane osoby, dla której rezerwujesz transfer.','Enter the details of the passenger you’re booking for.')}</p></div>
      <form className="passenger-form" onSubmit={review}>
       <section className="form-section"><h2><Users size={20}/>{t('Dane pasażera','Passenger details')}</h2><div className="input-grid"><label>{t('Imię','First name')}<input required minLength={2} maxLength={50} autoComplete="given-name" value={customer.firstName} onChange={e=>updateCustomer('firstName',e.target.value)} placeholder="Anna"/></label><label>{t('Nazwisko','Last name')}<input required minLength={2} maxLength={60} autoComplete="family-name" value={customer.lastName} onChange={e=>updateCustomer('lastName',e.target.value)} placeholder={t('Kowalska','Smith')}/></label><label>{t('E-mail','Email')}<input required type="email" maxLength={50} autoComplete="email" value={customer.email} onChange={e=>updateCustomer('email',e.target.value)} placeholder="anna@example.com"/><small>{t('Tu wyślemy potwierdzenie rezerwacji.','We’ll send your confirmation here.')}</small></label><label>{t('Telefon z numerem kierunkowym','Phone with country code')}<input required type="tel" minLength={8} maxLength={20} pattern="[+0-9 ()\-]{8,20}" autoComplete="tel" value={customer.phone} onChange={e=>updateCustomer('phone',e.target.value)} placeholder="+48 600 000 000"/></label></div></section>
       <section className="form-section"><h2><Plane size={20}/>{t('Szczegóły podróży','Travel details')}</h2><div className="input-grid"><label>{t('Numer lotu','Flight number')}<span>{t('Opcjonalnie','Optional')}</span><input maxLength={20} value={details.flightNumber} onChange={e=>setDetails(v=>({...v,flightNumber:e.target.value.toUpperCase()}))} placeholder="FR 1234"/><small>{t('Pomoże nam monitorować Twój przylot.','Helps us monitor your arrival.')}</small></label><label>{t('Nietypowy bagaż','Unusual luggage')}<span>{t('Opcjonalnie','Optional')}</span><input maxLength={500} value={details.unusualItems} onChange={e=>setDetails(v=>({...v,unusualItems:e.target.value}))} placeholder={t('Np. wózek dziecięcy','E.g. a pushchair')}/></label><label className="wide">{t('Wiadomość dla kierowcy','Message for your driver')}<span>{t('Opcjonalnie','Optional')}</span><textarea rows={3} maxLength={1000} value={details.notes} onChange={e=>setDetails(v=>({...v,notes:e.target.value}))} placeholder={t('Co powinniśmy wiedzieć przed odbiorem?','Anything we should know before pickup?')}/></label></div>{vehicle.supportsCombi&&<label className="checkbox-row"><input type="checkbox" checked={combi} onChange={e=>setCombi(e.target.checked)}/><span>{t('Preferuję samochód z nadwoziem kombi','I prefer an estate vehicle')}</span></label>}</section>
       <section className="form-section invoice-section"><label className="checkbox-row"><input type="checkbox" checked={invoice.requested} onChange={e=>setDetails(v=>({...v,invoice:{...v.invoice,requested:e.target.checked}}))}/><span>{t('Potrzebuję faktury na firmę','I need a company invoice')}</span></label>{invoice.requested&&<div className="input-grid"><label>{t('Nazwa firmy','Company name')}<input required maxLength={150} value={invoice.companyName} onChange={e=>updateInvoice('companyName',e.target.value)}/></label><label>{t('NIP / numer podatkowy','VAT / tax ID')}<input required maxLength={25} value={invoice.taxId} onChange={e=>updateInvoice('taxId',e.target.value)}/></label><label className="wide">{t('Adres firmy','Company address')}<input required maxLength={250} value={invoice.address} onChange={e=>updateInvoice('address',e.target.value)}/></label></div>}</section>
       <div className="screen-actions"><button type="button" className="back-link" disabled={busy} onClick={()=>{goStage(1);setError('');}}><ArrowLeft size={17}/>{t('Wybór samochodu','Vehicle selection')}</button><button className="button yellow" disabled={busy}>{busy?<LoaderCircle className="spin" size={18}/>:<>{t('Sprawdź rezerwację','Review booking')}<ArrowRight size={18}/></>}</button></div>
      </form>
     </>:<>
      <div className="screen-heading"><span className="section-kicker">{t('04 / POTWIERDŹ REZERWACJĘ','04 / CONFIRM YOUR BOOKING')}</span><h1>{t('Wszystko gotowe do podróży.','Ready for your journey.')}</h1><p>{t('Sprawdź dane. Do zobaczenia na trasie.','Check your details. We’ll see you on the road.')}</p></div>
      <div className="review-panel"><div className="review-vehicle"><img src={vehicle.image} alt={vehicle.name}/><div><small>{t('TWÓJ SAMOCHÓD','YOUR VEHICLE')}</small><h2>{vehicle.name}{quote.combi?' · kombi':''}</h2><p>{quote.passengers} {t('pasażerów','passengers')} · {quote.luggage} {t('walizek','suitcases')}</p></div><button onClick={()=>goStage(1)}>{t('Zmień','Change')}</button></div><div className="review-details"><div><small>{t('PASAŻER','PASSENGER')}</small><strong>{customer.firstName} {customer.lastName}</strong><p>{customer.email}<br/>{customer.phone}</p></div><button onClick={()=>goStage(2)}>{t('Edytuj','Edit')}</button></div>{(details.flightNumber||details.notes||details.unusualItems||invoice.requested)&&<div className="review-extras">{details.flightNumber&&<p><strong>{t('Lot','Flight')}</strong>{details.flightNumber}</p>}{details.unusualItems&&<p><strong>{t('Bagaż','Luggage')}</strong>{details.unusualItems}</p>}{details.notes&&<p><strong>{t('Uwagi','Notes')}</strong>{details.notes}</p>}{invoice.requested&&<p><strong>{t('Faktura','Invoice')}</strong>{invoice.companyName} · {invoice.taxId}<br/>{invoice.address}</p>}</div>}<div className="review-total"><span>{t('Całkowita cena przejazdu','Total transfer price')}<small>{t('Za cały samochód. Cena obejmuje wyznaczoną trasę.','For the whole vehicle on your selected route.')}</small></span><strong>{formatPrice(quote.amount,lang)}</strong></div></div>
      {mode==='demo'&&<div className="demo-information"><Info size={20}/><div><strong>{t('Test rezerwacji','Booking test')}</strong><p>{t('Adres i trasa są rzeczywiste. Zapis tej rezerwacji służy testowi i nie zamawia przejazdu ani nie obciąża płatnością.','The address and route are real. This booking is saved for testing and does not order a transfer or take payment.')}</p></div></div>}
      <label className="checkbox-row terms-consent"><input type="checkbox" checked={acceptTerms} onChange={e=>setAcceptTerms(e.target.checked)}/><span>{t('Akceptuję','I accept the')} <button onClick={()=>setLegal('terms')}>{t('regulamin','terms')}</button> {t('i zapoznałem/am się z','and have read the')} <button onClick={()=>setLegal('privacy')}>{t('polityką prywatności','privacy policy')}</button>.</span></label>
      <div className="screen-actions"><button className="back-link" disabled={busy} onClick={()=>goStage(2)}><ArrowLeft size={16}/>{t('Dane pasażera','Passenger details')}</button><button className="button yellow" disabled={!acceptTerms||busy} onClick={()=>void book()}>{busy?<LoaderCircle className="spin" size={18}/>:<>{mode==='demo'?t('Zapisz rezerwację testową','Save test booking'):t('Rezerwuję i płacę','Book and pay')}<ArrowRight size={18}/></>}</button></div>
      <div className="secure-payment"><LockKeyhole size={14}/>{t('Płatność obsługiwana przez','Payment handled by')} <b>Przelewy<span>24</span></b></div>
     </>}
    </div>
   </div>}
  </main>}
  <footer className="site-footer"><div className="container"><div><span>© {new Date().getFullYear()} Personal Taxi</span><small>Inter-Dywiz Sp. z o.o. · NIP 6751496482</small></div><nav aria-label={t('Informacje','Information')}><button onClick={()=>setLegal('terms')}>{t('Regulamin','Terms')}</button><button onClick={()=>setLegal('privacy')}>{t('Prywatność','Privacy')}</button><a href="mailto:office@personaltaxi.pl">{t('Kontakt','Contact')}<ArrowUpRight size={13}/></a></nav><div className="footer-payment"><LockKeyhole size={13}/><span>Przelewy<b>24</b></span></div></div></footer>
  {legal&&<div className="legal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setLegal(null);}}><section role="dialog" aria-modal="true" aria-label={legal==='terms'?t('Regulamin','Terms'):t('Polityka prywatności','Privacy policy')}><button className="close-modal" aria-label={t('Zamknij','Close')} onClick={()=>setLegal(null)}><X size={21}/></button><span className="section-kicker">PERSONAL TAXI</span><h2>{legal==='terms'?t('Warunki rezerwacji','Booking terms'):t('Polityka prywatności','Privacy policy')}</h2><p>{t('Operatorem usługi i administratorem danych jest Inter-Dywiz Sp. z o.o., ul. Lotnicza 6/2, NIP 6751496482. Kontakt: biuro@inter-dywiz.pl.','The service operator and data controller is Inter-Dywiz Sp. z o.o., ul. Lotnicza 6/2, tax ID 6751496482. Contact: biuro@inter-dywiz.pl.')}</p>{legal==='terms'?<><p>{t('Transfer obejmuje przejazd z lub na Kraków Airport. Rezerwacja online wymaga minimum 16 godzin wyprzedzenia. Cena jest przedstawiana przed płatnością. Oczekiwanie w cenie: 60 minut po przylocie albo 15 minut poza lotniskiem.','Transfers run to or from Kraków Airport. Book online at least 16 hours ahead. The fare is shown before payment. Waiting included: 60 minutes after arrival or 15 minutes outside the airport.')}</p><a href="https://www.personaltaxi.pl/terms" target="_blank" rel="noreferrer">{t('Pełny regulamin operatora','Full operator terms')}<ArrowUpRight size={17}/></a></>:<><p>{t('Dane z formularza są wykorzystywane do obsługi rezerwacji, kontaktu dotyczącego transferu i realizacji płatności. Szczegóły podstaw przetwarzania, odbiorców, czasu przechowywania i Twoich praw opisuje pełna polityka operatora.','Form details are used to organise your booking, contact you about your transfer and process payment. The operator’s full policy describes the legal basis, recipients, retention and your rights.')}</p><a href="https://www.personaltaxi.pl/policy" target="_blank" rel="noreferrer">{t('Pełna polityka prywatności','Full privacy policy')}<ArrowUpRight size={17}/></a></>}{mode==='demo'&&<p className="legal-demo">{t('W tym podglądzie płatności są testowe. Zapis rezerwacji nie tworzy umowy przewozu. Korzystaj z przykładowych danych kontaktowych.','Payments in this preview are test payments. Saving a booking does not create a transport contract. Use example contact details.')}</p>}<button className="button yellow" onClick={()=>setLegal(null)}>{t('Rozumiem','Got it')}</button></section></div>}
 </div>;
}
function AirportField({label}:{label:string}){return <div className="booking-field airport-field"><Plane size={21}/><div><small>{label}</small><strong>Kraków Airport <span>KRK</span></strong><p>Balice · terminal pasażerski</p></div><LockKeyhole size={14}/></div>;}
function Counter({label,icon,value,min,max,onChange,disabled}:{label:string;icon:React.ReactNode;value:number;min:number;max:number;onChange:(n:number)=>void;disabled?:boolean}){return <div className="counter-field"><div>{icon}<span>{label}</span></div><div className="counter-actions"><button type="button" aria-label={'Zmniejsz: '+label} disabled={disabled||value<=min} onClick={()=>onChange(value-1)}><Minus size={15}/></button><output aria-label={label}>{value}</output><button type="button" aria-label={'Zwiększ: '+label} disabled={disabled||value>=max} onClick={()=>onChange(value+1)}><Plus size={15}/></button></div></div>;}
