'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {CheckCircle2,Clock3,Info,ArrowRight,LoaderCircle} from 'lucide-react';
import {formatPrice,VEHICLE_BY_ID} from '@/lib/booking';
import {displayDate,request,type BookingStatus} from '@/lib/client/booking';
import type {TourSnapshot} from '@/lib/tours';
import {useTourLocale} from './TourShell';
export default function TourStatus(){
 const lang=useTourLocale(),t=(pl:string,en:string)=>lang==='pl'?pl:en;
 const [status,setStatus]=useState<(BookingStatus&{kind?:string;tour?:TourSnapshot})|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function load(){const token=new URLSearchParams(window.location.search).get('token');if(!token){setError(t('Brak identyfikatora rezerwacji.','Missing booking identifier.'));return;}setBusy(true);setError('');try{setStatus(await request('/api/bookings/status?token='+encodeURIComponent(token),undefined,lang));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 // Start the initial status request after hydration.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{void load();},[lang]); // eslint-disable-line react-hooks/exhaustive-deps
 return <main className="tour-status tour-container">{!status?busy?<><LoaderCircle className="spin"/><p>{t('Sprawdzamy rezerwację…','Checking your booking…')}</p></>:<><Info size={30}/><h1>{t('Sprawdź rezerwację','Check your booking')}</h1><p role="alert">{error}</p><button className="tour-button" onClick={()=>void load()}>{t('Spróbuj ponownie','Try again')}</button></>:<>
  {status.status==='paid'?<CheckCircle2 size={38}/>:status.status==='pending'?<Clock3 size={38}/>:<Info size={38}/>}
  <span className="tour-eyebrow">{status.bookingId}</span><h1>{status.status==='demo'?t('Rezerwacja testowa zapisana.','Demo booking saved.'):status.status==='paid'?t('Do zobaczenia w podróży.','See you on the road.'):status.status==='pending'?t('Czekamy na potwierdzenie płatności.','Waiting for payment confirmation.'):t('Płatność nie została uruchomiona.','Payment could not be started.')}</h1><p>{status.status==='demo'?t('To demonstracja. Nie pobrano pieniędzy, nie wysłano e-maila i nie zamówiono rzeczywistego przejazdu.','This is a demonstration. No money was taken, no email was sent and no actual journey was booked.'):status.status==='paid'?t('Płatność została potwierdzona.','Your payment has been confirmed.'):t('Odśwież status za chwilę lub skontaktuj się z nami: +48 690 04 80 80.','Refresh the status shortly or contact us: +48 690 04 80 80.')}</p>
  <div className="tour-status-details"><h2>{status.tour?.title[lang]||status.to.name}</h2><p>{t('Odbiór','Pickup')}: {displayDate(status.departureAt,lang)}</p><p>{status.tour?.pickupPending?t('Adres w Krakowie lub gminie Zabierzów do ustalenia — napisz na office@personaltaxi.pl.','Pickup address in Kraków or Zabierzów to be confirmed — email office@personaltaxi.pl.'):status.from.name}</p>{status.tour&&<p>{t('Początek wizyty','Visit starts')}: {displayDate(status.tour.visitAt,lang)}<br/>{t('Transport, oczekiwanie i powrót. Bilety osobno.','Transport, waiting and return. Admission separate.')}</p>}<p>{VEHICLE_BY_ID[status.vehicleId].name}</p><strong>{formatPrice(status.amount,lang)}</strong></div>
  {status.status==='pending'&&<button className="tour-button" disabled={busy} onClick={()=>void load()}>{t('Odśwież status','Refresh status')}</button>}{error&&<p role="alert">{error}</p>}
 </>}<Link href={'/travels?lang='+lang} className="tour-back">{t('Wróć do wycieczek','Back to day trips')}<ArrowRight size={16}/></Link></main>;
}
