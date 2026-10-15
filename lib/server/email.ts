import { and, eq, lt, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, emailOutbox } from "@/db/schema";
import { VEHICLE_BY_ID } from "@/lib/booking";
import type { Config } from "./config";
import type { StoredBooking } from "./booking-service";

export async function deliverOutbox(c:Config,bookingId?:string){
  if(c.mode!=="live"||!c.resendKey||!c.emailFrom||!c.operationsEmail)return;
  const db=getDb();
  const now=Date.now();
  const candidates=await db.select().from(emailOutbox).where(and(
    bookingId?eq(emailOutbox.bookingId,bookingId):undefined,
    or(eq(emailOutbox.status,"pending"),and(eq(emailOutbox.status,"sending"),lt(emailOutbox.lockedUntil,now))),
  )).limit(10);
  for(const item of candidates){
    const claimNow=Date.now();
    const leaseUntil=claimNow+60_000;
    // Resend idempotency keys live for 24h. Old uncertain sends require manual reconciliation.
    if(item.attempts>0&&claimNow-item.createdAt>23*3600_000){await db.update(emailOutbox).set({status:"needs_review"}).where(and(eq(emailOutbox.id,item.id),or(eq(emailOutbox.status,"pending"),and(eq(emailOutbox.status,"sending"),lt(emailOutbox.lockedUntil,claimNow)))));continue;}
    const claimed=await db.update(emailOutbox).set({status:"sending",lockedUntil:leaseUntil,attempts:sql`${emailOutbox.attempts}+1`}).where(and(eq(emailOutbox.id,item.id),or(eq(emailOutbox.status,"pending"),and(eq(emailOutbox.status,"sending"),lt(emailOutbox.lockedUntil,claimNow))))).returning({id:emailOutbox.id});
    if(!claimed.length)continue;
    try{
      const [booking]=await db.select().from(bookings).where(eq(bookings.id,item.bookingId)).limit(1);
      if(!booking||booking.mode!=="live"||booking.status!=="paid")throw new Error("Not paid");
      const p=JSON.parse(booking.payload) as StoredBooking;
      const q=p.quote;
      const en=p.locale==="en"&&item.audience==="customer";
      const text=(pl:string,eng:string)=>en?eng:pl;
      const when=(iso:string)=>new Intl.DateTimeFormat(en?"en-GB":"pl-PL",{dateStyle:"long",timeStyle:"short",timeZone:"Europe/Warsaw"}).format(new Date(iso));
      const details=[
        q.kind==="tour"?`${text("Wycieczka","Tour")}: ${q.tour.title[en?"en":"pl"]} · ${text("przejazd, oczekiwanie i powrót; bilety osobno","transport, waiting and return; admission separate")}`:"",
        q.kind==="tour"?`${text("Początek wizyty","Visit starts")}: ${when(q.tour.visitAt)}; ${text("pobyt na miejscu","time on site")}: ${q.tour.visitMinutes} min`:"",
        q.kind==="tour"?`${text("Wyjazd w drogę powrotną","Return journey starts")}: ${when(q.tour.returnDepartureAt)}; ${text("orientacyjny powrót pod adres","estimated arrival at pickup address")}: ${when(q.tour.returnArrivalAt)}`:"",
        q.kind==="tour"&&q.tour.pickupPending?text("Podaj dokładny adres odbioru w Krakowie lub gminie Zabierzów: office@personaltaxi.pl.","Send your exact pickup address in Kraków or Zabierzów municipality to office@personaltaxi.pl."):"",
        `${text("Rezerwacja","Booking")}: ${booking.id}`,
        `${text("Trasa","Route")}: ${q.from.name} (${q.from.address}) → ${q.to.name} (${q.to.address})${q.kind==="tour"?` → ${q.from.name} (${text("powrót","return")})`:""}`,
        `${text("Termin","Pickup")}: ${new Intl.DateTimeFormat(en?"en-GB":"pl-PL",{dateStyle:"long",timeStyle:"short",timeZone:"Europe/Warsaw"}).format(new Date(q.departureAt))} ${text("czas polski","Poland local time")}`,
        `${text("Samochód","Vehicle")}: ${VEHICLE_BY_ID[q.vehicleId].name}${q.combi?" kombi":""}`,
        `${text("Pasażerowie","Passengers")}: ${q.passengers}; ${text("bagaż średni","medium suitcases")}: ${q.luggage}`,
        `${text("Dystans","Distance")}: ${q.distanceKm} km; ${text("kwota","total")}: ${(booking.amount/100).toFixed(2)} ${booking.currency}`,
        `${text("Pasażer","Passenger")}: ${p.customer.firstName} ${p.customer.lastName}`,
        `${text("Telefon","Phone")}: ${p.customer.phone}; e-mail: ${p.customer.email}`,
        p.flightNumber?`${text("Numer lotu","Flight number")}: ${p.flightNumber}`:"",
        p.notes?`${text("Uwagi","Notes")}: ${p.notes}`:"",
        p.unusualItems?`${text("Nietypowy bagaż","Unusual luggage")}: ${p.unusualItems}`:"",
        p.invoice.requested?`${text("Faktura","Invoice")}: ${p.invoice.companyName}; NIP: ${p.invoice.taxId}; ${p.invoice.address}`:"",
      ].filter(Boolean).join("\n");
      const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${c.resendKey}`,"Content-Type":"application/json","Idempotency-Key":`personal-taxi/${item.id}`},signal:AbortSignal.timeout(12_000),body:JSON.stringify({from:c.emailFrom,to:item.audience==="customer"?p.customer.email:c.operationsEmail,subject:`Personal Taxi — ${q.kind==="tour"?text("opłacona wycieczka","confirmed tour"):text("opłacony transfer","confirmed transfer")} ${booking.id}`,text:`${text("Płatność została potwierdzona.","Your payment has been confirmed.")}\n\n${details}\n\n${text("W razie zmian skontaktuj się z Personal Taxi:","For any changes, contact Personal Taxi:")} office@personaltaxi.pl.\n${text("Dziękujemy i do zobaczenia!","Thank you. See you on the road!")}`})});
      const data=await response.json() as {id?:string};
      if(!response.ok||!data.id)throw new Error("Email rejected");
      await db.update(emailOutbox).set({status:"sent",providerId:data.id,sentAt:Date.now(),lockedUntil:null}).where(and(eq(emailOutbox.id,item.id),eq(emailOutbox.status,"sending"),eq(emailOutbox.lockedUntil,leaseUntil)));
    }catch{
      await db.update(emailOutbox).set({status:"pending",lockedUntil:null}).where(and(eq(emailOutbox.id,item.id),eq(emailOutbox.status,"sending"),eq(emailOutbox.lockedUntil,leaseUntil)));
    }
  }
}
