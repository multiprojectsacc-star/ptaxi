import {z} from 'zod';
import {getDb} from '@/db';
import {quotes} from '@/db/schema';
import {VEHICLES} from '@/lib/booking';
import {getTour,isTourPickup,PENDING_PICKUP,type TourQuote} from '@/lib/tours';
import {config} from './config';
import {calculateRoute,resolveLocation} from './locations';
import {ApiError,assertLeadTime} from './rules';
export const tourQuoteSchema=z.object({
 slug:z.string().max(60),pickupId:z.string().min(1).max(250).optional(),pickupPending:z.boolean().default(false),
 visitAt:z.string().datetime({offset:true}),vehicleId:z.enum(['sedan','premium','van']),
 passengers:z.number().int().min(1).max(8),luggage:z.number().int().min(0).max(7).default(0),
}).refine(d=>d.pickupPending||Boolean(d.pickupId),{message:'Wybierz adres odbioru.'});
export async function createTourQuote(raw:unknown):Promise<TourQuote>{
 const input=tourQuoteSchema.parse(raw),tour=getTour(input.slug);
 if(!tour)throw new ApiError(404,'TOUR_NOT_FOUND','Nie znaleziono tej wycieczki.');
 const vehicle=VEHICLES.find(v=>v.id===input.vehicleId)!;
 if(input.passengers>vehicle.passengers||input.luggage>vehicle.mediumLuggage)throw new ApiError(422,'CAPACITY','Wybierz samochód mieszczący wszystkich pasażerów i bagaż.');
 const c=config(),from=input.pickupPending?PENDING_PICKUP:await resolveLocation(input.pickupId!,c);
 if(!isTourPickup(from))throw new ApiError(422,'TOUR_OUTSIDE_AREA','Odbiór na wycieczkę jest dostępny w Krakowie i gminie Zabierzów. Wybierz adres w tym obszarze.');
 const visit=Date.parse(input.visitAt);
 let pickup=visit-tour.minimumPickupMinutes*60_000;
 assertLeadTime(new Date(pickup).toISOString());
 let outbound=await calculateRoute(from,tour.destination,new Date(pickup).toISOString(),c);
 // The actual drive and arrival buffer take precedence over the legacy minimum offset.
 let offset=Math.max(tour.minimumPickupMinutes,outbound.durationMinutes+tour.arrivalBufferMinutes);
 pickup=visit-offset*60_000;
 outbound=await calculateRoute(from,tour.destination,new Date(pickup).toISOString(),c);
 offset=Math.max(offset,outbound.durationMinutes+tour.arrivalBufferMinutes);
 pickup=visit-offset*60_000;
 assertLeadTime(new Date(pickup).toISOString());
 const returnDepartureAt=new Date(visit+tour.visitMinutes*60_000).toISOString();
 const back=await calculateRoute(tour.destination,from,returnDepartureAt,c);
 const quote:TourQuote={kind:'tour',direction:'tour',quoteId:crypto.randomUUID(),expiresAt:Date.now()+15*60_000,mode:c.mode,mapsMode:c.mapsMode,mapProvider:c.mapProvider,
  amount:tour.prices[input.vehicleId],currency:'PLN',vehicleId:input.vehicleId,departureAt:new Date(pickup).toISOString(),passengers:input.passengers,luggage:input.luggage,combi:false,
  from,to:tour.destination,routePoints:outbound.routePoints,distanceKm:Math.round((outbound.distanceKm+back.distanceKm)*10)/10,durationMinutes:offset+tour.visitMinutes+back.durationMinutes,
  offers:VEHICLES.map(v=>({vehicleId:v.id,amount:tour.prices[v.id],available:input.passengers<=v.passengers&&input.luggage<=v.mediumLuggage})),
  tour:{slug:tour.slug,title:tour.title,visitAt:new Date(visit).toISOString(),visitMinutes:tour.visitMinutes,pickupPending:input.pickupPending,returnDepartureAt,returnArrivalAt:new Date(visit+tour.visitMinutes*60_000+back.durationMinutes*60_000).toISOString(),outboundKm:outbound.distanceKm,outboundMinutes:outbound.durationMinutes,returnKm:back.distanceKm,returnMinutes:back.durationMinutes,arrivalBufferMinutes:tour.arrivalBufferMinutes}};
 await getDb().insert(quotes).values({id:quote.quoteId,mode:c.mode,payload:JSON.stringify(quote),amount:quote.amount,currency:quote.currency,expiresAt:quote.expiresAt,createdAt:Date.now()});
 return quote;
}
