'use client';
import Link from 'next/link';
import Image from 'next/image';
import {ArrowRight,ArrowDown,Clock3,Users,ShieldCheck,CarFront,Plus,Phone,ArrowUpRight} from 'lucide-react';
import {TOURS,durationLabel} from '@/lib/tours';
import {formatPrice} from '@/lib/booking';
import {useTourLocale} from './TourShell';
export default function TourCatalogue(){
 const lang=useTourLocale(),t=(pl:string,en:string)=>lang==='pl'?pl:en;
 return <main>
  <section className="tour-catalogue-hero">
   <Image className="tour-hero-photo" fill sizes="100vw" src="/images/tours/zakopane-tatras.png" alt={TOURS[1].imageAlt[lang]} fetchPriority="high"/>
   <div className="tour-photo-shade"/>
   <div className="tour-container tour-hero-copy">
    <div className="service-label"><CarFront size={17}/>{t('Prywatne wycieczki · Personal Taxi','Private day trips · Personal Taxi')}</div>
    <h1>{t('Wycieczki','Day trips')}<br/><span>{t('z Krakowa.','from Kraków.')}</span></h1>
    <p>{t('Auschwitz-Birkenau, Wieliczka lub Zakopane. Kierowca odbierze Cię spod adresu, poczeka podczas wizyty i odwiezie z powrotem.','Auschwitz-Birkenau, Wieliczka or Zakopane. Your driver collects you at your address, waits during your visit and takes you back.')}</p>
    <a className="tour-button" href="#kierunki">{t('Wybierz wycieczkę','Choose your day trip')}<ArrowDown size={18}/></a>
   </div>
   <div className="tour-service-line tour-container">
    <span><ShieldCheck size={22}/><div><strong>{t('Cena za cały samochód','One price per vehicle')}</strong><small>{t('Prywatny wyjazd dla 1–8 osób','Private trips for 1–8 guests')}</small></div></span>
    <span><Clock3 size={22}/><div><strong>{t('Kierowca czeka na miejscu','Your driver waits for you')}</strong><small>{t('Czas wizyty podany w ofercie','Visit duration listed in each offer')}</small></div></span>
    <span><CarFront size={22}/><div><strong>{t('Odbiór i powrót pod adres','Pickup and return at your address')}</strong><small>{t('Kraków i gmina Zabierzów','Kraków and Zabierzów municipality')}</small></div></span>
   </div>
  </section>
  <section className="tour-destinations tour-container" id="kierunki">
   <div className="tour-section-heading"><div><span className="section-kicker">{t('WYCIECZKI Z KIEROWCĄ','DAY TRIPS WITH A DRIVER')}</span><h2>{t('Wybierz cel podróży.','Choose your destination.')}</h2></div><p>{t('Transport w obie strony i oczekiwanie w cenie. Bilety wstępu i przewodnika rezerwujesz osobno.','Return transport and waiting included. Admission and guides are booked separately.')}</p></div>
   <div className="tour-card-grid">{TOURS.map(tour=><article className={'tour-destination-card tour-card-'+tour.slug} key={tour.slug}>
    <Link className="tour-card-image" href={'/travels/'+tour.slug+'?lang='+lang} aria-label={tour.title[lang]}><Image fill sizes="(max-width: 720px) 100vw, (max-width: 1000px) 50vw, 33vw" src={tour.image} alt={tour.imageAlt[lang]}/></Link>
    <div className="tour-card-copy"><h3><Link href={'/travels/'+tour.slug+'?lang='+lang}>{tour.title[lang]}</Link></h3><p>{tour.intro[lang]}</p><div className="tour-card-meta"><span><Clock3 size={16}/>{durationLabel(tour.visitMinutes,lang)} {t('na miejscu','on site')}</span><span><Users size={16}/>1–8 {t('osób','guests')}</span></div><div className="tour-card-bottom"><div><small>{t('Od','From')}</small><strong>{formatPrice(tour.prices.sedan,lang)}</strong><span>{t('za samochód · w obie strony','per vehicle · return included')}</span></div><Link className="tour-button" href={'/travels/'+tour.slug+'?lang='+lang} aria-label={t('Zobacz ofertę: ','View trip: ')+tour.title[lang]}>{t('Zobacz ofertę','View trip')}<ArrowRight size={17}/></Link></div></div>
   </article>)}</div>
  </section>
  <section className="tour-faq-section"><div className="information-row container"><div><span className="section-kicker">{t('PRZED WYJAZDEM','BEFORE YOUR TRIP')}</span><h2>{t('Wszystko, co warto wiedzieć.','Good to know before you go.')}</h2><p>{t('Masz inne pytanie? Jesteśmy pod telefonem.','Another question? Give us a call.')}</p><a href="tel:+48690048080"><Phone size={16}/>+48 690 04 80 80<ArrowUpRight size={16}/></a></div><div className="answers">{[
 [t('Co jest zawarte w cenie?','What is included?'),t('Prywatny transport w obie strony, samochód dla Twojej grupy oraz oczekiwanie kierowcy przez czas podany w ofercie. Bilety wstępu, przewodnika i posiłki kupujesz osobno.','Private return transport, a vehicle for your group and driver waiting for the duration listed in the offer. Admission, guides and meals are purchased separately.')],
 [t('Skąd możecie mnie odebrać?','Where can you collect me?'),t('Z adresu w Krakowie lub gminie Zabierzów, także z Kraków Airport. Jeśli nie znasz jeszcze adresu, możesz podać go później — musi mieścić się w tym obszarze.','From an address in Kraków or Zabierzów municipality, including Kraków Airport. If you don’t know your address yet, you can provide it later; it must be within this area.')],
 [t('Czy muszę najpierw kupić bilety?','Should I book admission first?'),t('W przypadku Auschwitz-Birkenau i Wieliczki najpierw zarezerwuj wejście na konkretną godzinę. Podczas zamawiania transportu wpisz godzinę rozpoczęcia wizyty, a my wyliczymy wcześniejszy odbiór.','For Auschwitz-Birkenau and Wieliczka, book admission for a specific time first. Enter the start of your visit when booking transport and we calculate an earlier pickup.')],
 [t('Ile osób może pojechać?','How many people can travel?'),t('Sedan i Premium mieszczą do 4 pasażerów, a Mini Van do 8. Samochód jest tylko dla Ciebie i Twojej grupy. Rezerwację złóż przynajmniej 16 godzin przed odbiorem.','Sedan and Premium carry up to 4 guests; Mini Van up to 8. Your vehicle is exclusively for your group. Book at least 16 hours before pickup.')]
 ].map(([q,a])=><details key={q}><summary>{q}<Plus size={17}/></summary><p>{a}</p></details>)}</div></div></section>
 </main>;
}
