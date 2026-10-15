'use client';
import Link from 'next/link';
import Image from 'next/image';
import {ArrowLeft,ArrowRight,ArrowUpRight,Check,Clock3,MapPin,Users,Ticket} from 'lucide-react';
import {VEHICLES,formatPrice} from '@/lib/booking';
import {durationLabel,type Tour} from '@/lib/tours';
import {useTourLocale} from './TourShell';
export default function TourDetail({tour}:{tour:Tour}){
 const lang=useTourLocale(),t=(pl:string,en:string)=>lang==='pl'?pl:en,href='/travels/'+tour.slug+'/rezerwacja?lang='+lang;
 return <main>
  <section className={'tour-detail-hero tour-detail-'+tour.slug}>
   <Image className="tour-detail-photo" fill sizes="100vw" src={tour.image} alt={tour.imageAlt[lang]} fetchPriority="high"/><div className="tour-photo-shade"/>
   <div className="tour-container tour-detail-copy"><Link className="tour-back" href={'/travels?lang='+lang}><ArrowLeft size={15}/>{t('Wszystkie wycieczki','All day trips')}</Link><h1>{tour.title[lang]}</h1><p>{tour.intro[lang]}</p><div className="tour-detail-facts"><span><Clock3 size={18}/>{durationLabel(tour.visitMinutes,lang)} {t('na miejscu','on site')}</span><span><Users size={18}/>1–8 {t('osób','guests')}</span><span><MapPin size={18}/>{t('Odbiór: Kraków / Zabierzów','Pickup: Kraków / Zabierzów')}</span></div><div className="tour-detail-cta"><div><small>{t('Od','From')}</small><strong>{formatPrice(tour.prices.sedan,lang)}</strong><span>{t('za samochód · w obie strony','per vehicle · return included')}</span></div><Link className="tour-button" href={href}>{t('Wybierz termin i samochód','Choose your date and vehicle')}<ArrowRight size={18}/></Link></div></div>
  </section>
  <section className="tour-detail-body tour-container"><div className="tour-detail-story"><span className="section-kicker">{t('SZCZEGÓŁY WYJAZDU','TRIP DETAILS')}</span><h2>{t('Co obejmuje wycieczka?','What does the trip include?')}</h2><p>{tour.description[lang]}</p><ul className="tour-highlight-list">{tour.highlights.map(x=><li key={x.pl}><Check size={17}/>{x[lang]}</li>)}</ul><div className="tour-practical"><Ticket size={22}/><div><h3>{t('Bilety i zwiedzanie','Admission & sightseeing')}</h3><p>{tour.practical[lang]}</p><a href={tour.ticketUrl||tour.officialUrl} target="_blank" rel="noreferrer">{tour.ticketUrl?t('Zarezerwuj bilety u organizatora','Book admission with the operator'):t('Informacje o Zakopanem','Information about Zakopane')}<ArrowUpRight size={15}/></a></div></div></div>
   <aside className="tour-tariffs"><h2>{t('Wybierz samochód.','Choose your vehicle.')}</h2><p>{t('Cena za cały samochód, dojazd, oczekiwanie i powrót.','One price for the vehicle, outward journey, waiting and return.')}</p>{VEHICLES.map(v=><Link href={href+'&vehicle='+v.id} className="tour-tariff-row" key={v.id}><Image width={160} height={100} src={v.image} alt=""/><div><strong>{v.name}</strong><span>{t('do','up to')} {v.passengers} {t('osób','guests')}</span></div><b>{formatPrice(tour.prices[v.id],lang)}</b><ArrowRight size={16}/></Link>)}<Link href={href} className="tour-button">{t('Przejdź do rezerwacji','Continue to booking')}<ArrowRight size={17}/></Link><small>{t('Bilety, przewodnik i posiłki nie są wliczone.','Admission, guides and meals are not included.')}</small></aside>
  </section>
  <section className="tour-detail-bottom tour-container"><div><h2>{t('Godzina odbioru dopasowana do wizyty.','Pickup planned around your visit.')}</h2></div><p>{t('Wpisz godzinę rozpoczęcia zwiedzania. Na podstawie trasy wyznaczymy wcześniejszy odbiór. Po wizycie wrócisz do miejsca, z którego wyruszyliśmy.','Enter the start time of your visit. We calculate an earlier pickup from your route. After your visit, we bring you back to where we started.')}</p></section>
 </main>;
}
