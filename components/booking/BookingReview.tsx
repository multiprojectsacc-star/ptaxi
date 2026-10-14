'use client';

import {ArrowLeft, ArrowRight, Info, LoaderCircle, LockKeyhole, Mail, Pencil, Phone} from 'lucide-react';
import {VEHICLE_BY_ID, formatPrice, type Locale} from '@/lib/booking';
import type {PassengerDetails, Quote} from '@/lib/client/booking';

type Props = {
 quote: Quote; details: PassengerDetails; lang: Locale; mode: 'demo' | 'live'; busy: boolean; accepted: boolean;
 onAccept: (value: boolean) => void; onEdit: () => void; onLegal: (document: 'terms' | 'privacy') => void; onBook: () => void;
};

export default function BookingReview({quote, details, lang, mode, busy, accepted, onAccept, onEdit, onLegal, onBook}: Props) {
 const t = (pl: string, en: string) => lang === 'pl' ? pl : en;
 const {customer, invoice} = details;
 const vehicle = VEHICLE_BY_ID[quote.vehicleId];
 const hasExtras = !!(details.flightNumber || details.unusualItems || details.notes || quote.combi);

 return <>
  <div className="screen-heading"><span className="section-kicker">{t('OSTATNIE SPOJRZENIE PRZED PODRÓŻĄ', 'ONE LAST LOOK BEFORE YOUR JOURNEY')}</span><h1>{t('Wszystko gotowe do podróży.', 'Ready for your journey.')}</h1><p>{t('Sprawdź szczegóły i potwierdź swój prywatny transfer.', 'Check your details and confirm your private transfer.')}</p></div>
  <section className="checkout-card" aria-labelledby="checkout-passenger-title">
   <div className="checkout-card-heading"><div className="details-form-heading"><span>01</span><div><h2 id="checkout-passenger-title">{t('Pasażer i kontakt', 'Passenger and contact')}</h2><p>{t('Do potwierdzenia rezerwacji i kontaktu w dniu odbioru.', 'For your confirmation and contact on the day.')}</p></div></div><button className="checkout-edit" type="button" disabled={busy} onClick={onEdit}><Pencil size={14}/>{t('Edytuj dane', 'Edit details')}</button></div>
   <p className="checkout-passenger-name">{customer.firstName} {customer.lastName}</p>
   <dl className="checkout-contact-grid"><div><dt><Mail size={15}/>{t('E-mail', 'Email')}</dt><dd>{customer.email}</dd></div><div><dt><Phone size={15}/>{t('Telefon', 'Phone')}</dt><dd>{customer.phone}</dd></div></dl>
  </section>
  <section className="checkout-card" aria-labelledby="checkout-travel-title">
   <div className="checkout-card-heading"><div className="details-form-heading"><span>02</span><div><h2 id="checkout-travel-title">{t('Szczegóły podróży', 'Travel details')}</h2><p>{t('Informacje przekazane przy rezerwacji.', 'The information provided for your booking.')}</p></div></div><button className="checkout-edit" type="button" disabled={busy} onClick={onEdit}><Pencil size={14}/>{t('Edytuj', 'Edit')}</button></div>
   {hasExtras ? <dl className="checkout-extras-grid">
    {details.flightNumber && <div><dt>{t('Numer lotu', 'Flight number')}</dt><dd>{details.flightNumber}</dd></div>}
    {details.unusualItems && <div><dt>{t('Nietypowy bagaż', 'Unusual luggage')}</dt><dd>{details.unusualItems}</dd></div>}
    {quote.combi && <div><dt>{t('Preferowane nadwozie', 'Preferred body style')}</dt><dd>{t('Kombi', 'Estate')}</dd></div>}
    {details.notes && <div className="wide"><dt>{t('Wiadomość dla kierowcy', 'Message for your driver')}</dt><dd>{details.notes}</dd></div>}
   </dl> : <p className="checkout-empty-note">{t('Nie dodano dodatkowych uwag do przejazdu.', 'No additional notes were added to your transfer.')}</p>}
   {invoice.requested && <div className="checkout-invoice"><h3>{t('Faktura na firmę', 'Company invoice')}</h3><dl className="checkout-extras-grid"><div><dt>{t('Nazwa firmy', 'Company name')}</dt><dd>{invoice.companyName}</dd></div><div><dt>{t('NIP / numer podatkowy', 'VAT / tax ID')}</dt><dd>{invoice.taxId}</dd></div><div className="wide"><dt>{t('Adres firmy', 'Company address')}</dt><dd>{invoice.address}</dd></div></dl></div>}
  </section>
  <section className="checkout-card checkout-payment" aria-labelledby="checkout-payment-title">
   <div className="details-form-heading"><span>03</span><div><h2 id="checkout-payment-title">{t('Potwierdzenie rezerwacji', 'Confirm your booking')}</h2><p>{t('Jedna cena za cały Twój prywatny przejazd.', 'One price for your entire private transfer.')}</p></div></div>
   <div className="checkout-total"><div><span>{t('Łącznie za transfer', 'Total transfer price')}</span><small>{vehicle.name}{quote.combi ? t(' · kombi', ' · estate') : ''}</small></div><strong>{formatPrice(quote.amount, lang)}</strong></div>
   {mode === 'demo' && <div className="demo-information"><Info size={19}/><div><strong>{t('Rezerwacja testowa', 'Test booking')}</strong><p>{t('Adres i trasa są rzeczywiste. Zapis tej rezerwacji służy testowi i nie zamawia przejazdu ani nie obciąża płatnością.', 'The address and route are real. This booking is saved for testing and does not order a transfer or take payment.')}</p></div></div>}
   <label className="checkbox-row terms-consent"><input type="checkbox" checked={accepted} disabled={busy} onChange={e => onAccept(e.target.checked)}/><span>{t('Akceptuję', 'I accept the')} <button type="button" onClick={() => onLegal('terms')}>{t('regulamin', 'terms')}</button> {t('i zapoznałem/am się z', 'and have read the')} <button type="button" onClick={() => onLegal('privacy')}>{t('polityką prywatności', 'privacy policy')}</button>.</span></label>
   <button className="button checkout-submit" type="button" disabled={!accepted || busy} onClick={onBook}>{busy ? <><LoaderCircle className="spin" size={18}/>{t('Przygotowuję rezerwację…', 'Preparing your booking…')}</> : <>{mode === 'demo' ? t('Zapisz rezerwację testową', 'Save test booking') : t('Rezerwuję i płacę', 'Book and pay')}<ArrowRight size={19}/></>}</button>
   <div className="secure-payment"><LockKeyhole size={14}/>{mode === 'demo' ? t('Podgląd płatności', 'Payment preview') : t('Płatność obsługiwana przez', 'Payment handled by')} <b>Przelewy<span>24</span></b></div>
  </section>
  <button className="back-link checkout-back" type="button" disabled={busy} onClick={onEdit}><ArrowLeft size={16}/>{t('Wróć do danych pasażera', 'Back to passenger details')}</button>
 </>;
}
