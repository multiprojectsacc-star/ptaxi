import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, quotes, emailOutbox } from "@/db/schema";
import { AIRPORT, VEHICLES, calculatePrice, type Location } from "@/lib/booking";
import { config, requireLiveConfig } from "./config";
import { resolveLocation, calculateRoute } from "./locations";
import { ApiError, quoteSchema, bookingSchema, assertLeadTime, assertPassengerCapacity, assertServiceArea, sha384, type QuoteInput, type BookingInput } from "./rules";
import { registerPayment } from "./payments";
import type {TourQuote} from "@/lib/tours";

export type StoredQuote = QuoteInput & {
  kind?:"transfer";
  quoteId:string;expiresAt:number;mode:"demo"|"live";mapsMode:"demo"|"live";mapProvider:"demo"|"tomtom";distanceKm:number;durationMinutes:number;amount:number;
  from:Location;to:Location;routePoints:[number,number][];radiusKm:number;
  offers:{vehicleId:string;amount:number;available:boolean}[];
};
export type StoredBooking = { quote:StoredQuote|TourQuote;customer:BookingInput["customer"];flightNumber:string;notes:string;unusualItems:string;invoice:BookingInput["invoice"];locale:"pl"|"en";termsAcceptedAt:string;termsVersion:string };

export async function createQuote(raw:unknown){
  const input=quoteSchema.parse(raw);
  assertLeadTime(input.departureAt);
  assertPassengerCapacity(input);
  const c=config();
  const location=await resolveLocation(input.location.id,c);
  assertServiceArea(AIRPORT,location,c.radiusKm);
  const [from,to]=input.direction==="from-airport"?[AIRPORT,location]:[location,AIRPORT];
  const route=await calculateRoute(from,to,input.departureAt,c);
  const quote:StoredQuote={...input,location,combi:input.vehicleId==="van"?false:input.combi,quoteId:crypto.randomUUID(),expiresAt:Date.now()+15*60_000,mode:c.mode,mapsMode:c.mapsMode,mapProvider:c.mapProvider,...route,amount:calculatePrice(route.distanceKm,input.vehicleId),from,to,radiusKm:c.radiusKm,offers:VEHICLES.map(v=>({vehicleId:v.id,amount:calculatePrice(route.distanceKm,v.id),available:input.passengers<=v.passengers&&input.luggage<=v.mediumLuggage}))};
  await getDb().insert(quotes).values({id:quote.quoteId,mode:c.mode,payload:JSON.stringify(quote),amount:quote.amount,currency:input.currency,expiresAt:quote.expiresAt,createdAt:Date.now()});
  return quote;
}

export async function createBooking(raw:unknown){
  const input=bookingSchema.parse(raw);
  const c=config();
  if(c.mode==="live")requireLiveConfig(c);
  const db=getDb();
  const [row]=await db.select().from(quotes).where(eq(quotes.id,input.quoteId)).limit(1);
  if(!row||row.expiresAt<Date.now()||row.mode!==c.mode)throw new ApiError(410,"QUOTE_EXPIRED","Oferta wygasła. Wyznacz trasę ponownie, aby odświeżyć cenę.");
  const quote=JSON.parse(row.payload) as StoredQuote|TourQuote;
  assertLeadTime(quote.departureAt);
  const [existing]=await db.select({id:bookings.id}).from(bookings).where(eq(bookings.quoteId,input.quoteId)).limit(1);
  if(existing)throw new ApiError(409,"ALREADY_BOOKED","Ta oferta została już wykorzystana. Sprawdź status rezerwacji lub wyznacz trasę ponownie.");
  const now=Date.now();
  const id=`PT-${new Date(now).getUTCFullYear()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
  const statusToken=Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,"0")).join("");
  const payload:StoredBooking={quote,customer:input.customer,flightNumber:input.flightNumber,notes:input.notes,unusualItems:input.unusualItems,invoice:input.invoice,locale:input.locale,termsAcceptedAt:new Date(now).toISOString(),termsVersion:"2026-10-preview"};
  const sessionId=crypto.randomUUID();
  const status=c.mode==="demo"?"demo":"pending";
  try{
    await db.insert(bookings).values({id,quoteId:row.id,statusTokenHash:await sha384(statusToken),mode:c.mode,status,payload:JSON.stringify(payload),amount:row.amount,currency:row.currency,sessionId,createdAt:now});
  }catch(error){
    const [duplicate]=await db.select({id:bookings.id}).from(bookings).where(eq(bookings.quoteId,input.quoteId)).limit(1);
    if(duplicate)throw new ApiError(409,"ALREADY_BOOKED","Ta oferta została już wykorzystana. Sprawdź status rezerwacji.");
    throw error;
  }
  if(c.mode==="demo")return{bookingId:id,status,statusToken,paymentUrl:null,mode:c.mode};
  try{
    const payment=await registerPayment({id,sessionId,amount:row.amount,currency:row.currency,email:input.customer.email,customerName:`${input.customer.firstName} ${input.customer.lastName}`,locale:input.locale,returnPath:quote.kind==="tour"?"/travels/status":"/rezerwacja/status"},statusToken,c);
    await db.update(bookings).set({providerToken:payment.token}).where(eq(bookings.id,id));
    return {bookingId:id,status,statusToken,paymentUrl:payment.paymentUrl,mode:c.mode};
  }catch(error){
    await db.update(bookings).set({status:"payment_failed"}).where(and(eq(bookings.id,id),eq(bookings.status,"pending")));
    throw error;
  }
}

export async function getBookingStatus(token:string){
  if(!/^[a-f0-9]{64}$/.test(token))throw new ApiError(404,"NOT_FOUND","Nie znaleziono rezerwacji.");
  const db=getDb();
  const [row]=await db.select().from(bookings).where(eq(bookings.statusTokenHash,await sha384(token))).limit(1);
  if(!row)throw new ApiError(404,"NOT_FOUND","Nie znaleziono rezerwacji.");
  const payload=JSON.parse(row.payload) as StoredBooking;
  const [mail]=await db.select({status:emailOutbox.status}).from(emailOutbox).where(eq(emailOutbox.id,`${row.id}:customer`)).limit(1);
  return{kind:payload.quote.kind||"transfer",tour:payload.quote.kind==="tour"?payload.quote.tour:undefined,bookingId:row.id,status:row.status==="verifying"?"pending":row.status,mode:row.mode,amount:row.amount,currency:row.currency,from:payload.quote.from,to:payload.quote.to,departureAt:payload.quote.departureAt,vehicleId:payload.quote.vehicleId,emailSent:mail?.status==="sent",distanceKm:payload.quote.distanceKm,durationMinutes:payload.quote.durationMinutes,passengers:payload.quote.passengers,luggage:payload.quote.luggage,combi:payload.quote.combi};
}
