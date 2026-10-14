import type { Direction, Location, VehicleId, Locale } from '@/lib/booking';
import type {Country} from 'react-phone-number-input';
export type MapMode = 'live' | 'demo';
export type Quote = {
  quoteId:string; expiresAt:number; mode:'demo'|'live'; mapsMode:MapMode; mapProvider:'tomtom'|'demo';
  distanceKm:number; durationMinutes:number; amount:number; currency:'PLN'; vehicleId:VehicleId;
  departureAt:string; passengers:number; luggage:number; combi:boolean; direction:Direction;
  from:Location; to:Location; routePoints:[number,number][];
  offers:{vehicleId:VehicleId;amount:number;available:boolean}[];
};
export type Trip = {direction:Direction;location:Location|null;departure:string;passengers:number;luggage:number};
export type Customer = {firstName:string;lastName:string;email:string;phone:string};
export type PassengerDetails = {customer:Customer;phoneCountry?:Country;flightNumber:string;notes:string;unusualItems:string;invoice:{requested:boolean;companyName:string;taxId:string;address:string}};
export type BookingStatus = {bookingId:string;status:'demo'|'pending'|'paid'|'payment_failed';mode:'demo'|'live';amount:number;from:Location;to:Location;departureAt:string;vehicleId:VehicleId;emailSent:boolean};
export function localWarsaw(ms=Date.now()+24*3600000){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(ms)).replace(' ','T').slice(0,16);}
export function warsawISO(local:string){const naive=Date.parse(local+'Z');if(!Number.isFinite(naive))throw new Error('Wybierz datę i godzinę odbioru.');let ms=naive;for(let i=0;i<3;i++)ms+=naive-Date.parse(localWarsaw(ms)+'Z');if(localWarsaw(ms)!==local)throw new Error('Ta godzina nie istnieje podczas zmiany czasu. Wybierz inną.');return new Date(ms).toISOString();}
export function displayDate(iso:string,lang:Locale='pl'){return new Intl.DateTimeFormat(lang==='pl'?'pl-PL':'en-GB',{timeZone:'Europe/Warsaw',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));}
const errors:Record<string,string>={LEAD_TIME:'Please book at least 16 hours before pickup.',SELECT_LOCATION:'Search again and select an address from the suggestions.',CAPACITY:'Choose a vehicle with enough room for your group and luggage.',QUOTE_EXPIRED:'Your quote expired. Please refresh the price.',ALREADY_BOOKED:'This quote has already been booked. Check your booking status.',MAP_UNAVAILABLE:'Address search is temporarily unavailable. Please try again.',ROUTE_UNAVAILABLE:'We could not calculate a drivable route. Please try another address.',INVALID_INPUT:'Check your details and try again.',RATE_LIMIT:'Too many requests. Please wait a minute.',LIVE_NOT_CONFIGURED:'Online payments are currently unavailable. Please contact us.',NOT_FOUND:'Booking not found.'};
export async function request<T>(url:string,body?:unknown,lang:Locale='pl',signal?:AbortSignal):Promise<T>{const res=await fetch(url,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal});const data=await res.json() as {error?:string;code?:string};if(!res.ok)throw new Error(lang==='en'?(errors[data.code||'']||'Something went wrong. Please try again.'):(data.error||'Nie udało się połączyć. Spróbuj ponownie.'));return data as T;}
export const emptyDetails:PassengerDetails={customer:{firstName:'',lastName:'',email:'',phone:''},flightNumber:'',notes:'',unusualItems:'',invoice:{requested:false,companyName:'',taxId:'',address:''}};
