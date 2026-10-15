import type {Locale, Location, VehicleId} from './booking';
import type {Quote} from './client/booking';
type Copy = Record<Locale, string>;
export type Tour = {
 slug:string; number:string; title:Copy; eyebrow:Copy; intro:Copy; description:Copy;
 image:string; imageAlt:Copy; visitMinutes:number; minimumPickupMinutes:number; arrivalBufferMinutes:number;
 estimatedTotalMinutes:number; prices:Record<VehicleId,number>; destination:Location;
 highlights:Copy[]; practical:Copy; officialUrl:string; ticketUrl?:string;
};
/** Legacy fixed tariffs: integer grosz, whole car, including waiting and return. */
export const TOURS:readonly Tour[] = [
 {slug:'auschwitz-birkenau',number:'01',title:{pl:'Auschwitz-Birkenau',en:'Auschwitz-Birkenau'},eyebrow:{pl:'Pamięć i historia',en:'Memory & history'},
 intro:{pl:'Prywatny transport do Miejsca Pamięci, oczekiwanie i powrót do Krakowa.',en:'Private transport to the Memorial, waiting and return to Kraków.'},
 description:{pl:'Prywatny dojazd z Krakowa do Miejsca Pamięci i Muzeum Auschwitz-Birkenau. Kierowca odbierze Cię spod wskazanego adresu, poczeka podczas zwiedzania i odwiezie z powrotem.',en:'Private transport from Kraków to the Auschwitz-Birkenau Memorial and Museum. Your driver collects you from your address, waits during your visit and takes you back.'},
 image:'/images/tours/auschwitz-memorial.png',imageAlt:{pl:'Historyczna brama w Miejscu Pamięci Auschwitz',en:'Historic gate at the Auschwitz Memorial'},
 visitMinutes:210,minimumPickupMinutes:120,arrivalBufferMinutes:30,estimatedTotalMinutes:450,prices:{sedan:60000,premium:79000,van:89000},
 destination:{id:'tour-auschwitz',name:'Muzeum Auschwitz-Birkenau',address:'Wejście dla odwiedzających, Więźniów Oświęcimia 55, Oświęcim',lat:50.0293528,lng:19.2054782},
 highlights:[{pl:'Odbiór pod Twoim adresem',en:'Pickup at your address'},{pl:'3,5 godziny na zwiedzanie',en:'3.5 hours for your visit'},{pl:'Powrót tym samym samochodem',en:'Return in the same vehicle'}],
 practical:{pl:'Zarezerwuj imienną kartę wstępu na stronie Muzeum przed zamówieniem transportu. Przy wejściu należy być co najmniej 30 minut przed zwiedzaniem. Bilety i edukator nie są zawarte w cenie transportu.',en:'Reserve your named entry pass on the Museum website before booking transport. Arrive at least 30 minutes before the visit. Entry passes and an educator are not included in the transport price.'},
 officialUrl:'https://www.auschwitz.org/en/visiting/',ticketUrl:'https://visit.auschwitz.org/'},
 {slug:'zakopane',number:'02',title:{pl:'Zakopane i Tatry',en:'Zakopane & the Tatras'},eyebrow:{pl:'Dzień w górach',en:'A day in the mountains'},
 intro:{pl:'Przejazd do centrum Zakopanego i 5 godzin na własny plan zwiedzania.',en:'Transport to central Zakopane and 5 hours to explore at your own pace.'},
 description:{pl:'Jednodniowy wyjazd do Zakopanego, w Twoim tempie. Spacer po Krupówkach, regionalny obiad lub widok na Tatry — Ty wybierasz, jak spędzisz czas na miejscu. My zajmujemy się dojazdem i powrotem.',en:'A private day trip to Zakopane, at your own pace. Walk along Krupówki, enjoy a regional lunch or take in the mountain views. You decide how to spend your time; we handle the journey there and back.'},
 image:'/images/tours/zakopane-tatras.png',imageAlt:{pl:'Górska panorama Tatr z drewnianymi schroniskami',en:'Tatra mountain landscape with wooden mountain huts'},
 visitMinutes:300,minimumPickupMinutes:60,arrivalBufferMinutes:15,estimatedTotalMinutes:700,prices:{sedan:89000,premium:99000,van:109000},
 destination:{id:'tour-zakopane',name:'Zakopane · centrum',address:'Krupówki, Zakopane',lat:49.29412,lng:19.95311},
 highlights:[{pl:'Prywatny samochód dla Twojej grupy',en:'A private car for your group'},{pl:'5 godzin na miejscu',en:'5 hours at your destination'},{pl:'Własny plan dnia',en:'Your own itinerary'}],
 practical:{pl:'Transport obejmuje dojazd do centrum Zakopanego, oczekiwanie i powrót. Kolejki, atrakcje, przewodnik oraz posiłki są dodatkowo płatne u ich organizatorów. Zdjęcie przedstawia region Tatr; dojazdy do szlaków nie są częścią tej oferty.',en:'Transport includes travel to central Zakopane, waiting and return. Cable cars, attractions, guides and meals are paid separately to their operators. The photograph shows the Tatra region; trailhead transfers are not part of this offer.'},
 officialUrl:'https://www.zakopane.pl/en/tourist-area'},
 {slug:'wieliczka',number:'03',title:{pl:'Kopalnia Soli Wieliczka',en:'Wieliczka Salt Mine'},eyebrow:{pl:'Pod powierzchnią',en:'Beneath the surface'},
 intro:{pl:'Dojazd do kopalni, 3 godziny na wizytę i powrót pod Twój adres.',en:'Transport to the mine, 3 hours for your visit and return to your address.'},
 description:{pl:'Komfortowy dojazd do Kopalni Soli Wieliczka i spokojny powrót do Krakowa. Kierowca czeka, gdy Ty poznajesz podziemne korytarze, komory i historię solnego miasta.',en:'A comfortable journey to Wieliczka Salt Mine and a relaxed return to Kraków. Your driver waits while you explore the underground corridors, chambers and the history of this salt town.'},
 image:'/images/tours/salt-mine-corridor.png',imageAlt:{pl:'Oświetlony korytarz w kopalni soli',en:'An illuminated corridor in a salt mine'},
 visitMinutes:180,minimumPickupMinutes:40,arrivalBufferMinutes:15,estimatedTotalMinutes:240,prices:{sedan:29000,premium:32000,van:35000},
 destination:{id:'tour-wieliczka',name:'Kopalnia Soli Wieliczka',address:'Szyb Daniłowicza, Daniłowicza 10, Wieliczka',lat:49.982761,lng:20.056242},
 highlights:[{pl:'Dojazd pod kopalnię',en:'Travel to the mine'},{pl:'3 godziny na wizytę',en:'3 hours for your visit'},{pl:'Kierowca czeka na miejscu',en:'Your driver waits for you'}],
 practical:{pl:'Trasa Turystyczna zaczyna się w Szybie Daniłowicza. Zwiedzanie odbywa się z przewodnikiem kopalni i trwa zwykle 2–3 godziny. Bilet zarezerwuj osobno na wybraną godzinę, przed zamówieniem transportu.',en:'The Tourist Route starts at the Daniłowicz Shaft. Visits are led by a mine guide and usually take 2–3 hours. Book your admission separately for a specific time before arranging transport.'},
 officialUrl:'https://www.kopalnia.pl/turysta-indywidualny/informacje-praktyczne/wazne-informacje/trasa-turystyczna',ticketUrl:'https://bilety.kopalnia.pl/'}
];
export function getTour(slug:string){return TOURS.find(t=>t.slug===slug);}
export function durationLabel(minutes:number,lang:Locale='pl'){
 const h=Math.floor(minutes/60),m=Math.round(minutes%60);
 return [h?`${h} ${lang==='pl'?'godz.':'h'}`:'',m?`${m} min`:''].filter(Boolean).join(' ');
}
export const PENDING_PICKUP:Location={id:'krakow-pickup-pending',name:'Adres odbioru do ustalenia',address:'Kraków lub gmina Zabierzów · adres przekażesz przed podróżą',lat:50.06143,lng:19.93658,municipality:'Kraków'};
export function isTourPickup(location:Location){
 const city=(location.municipality||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/^gmina\s+/,'').trim();
 return location.id==='krakow-airport'||city==='krakow'||city==='zabierzow';
}
export type TourSnapshot={slug:string;title:Copy;visitAt:string;visitMinutes:number;pickupPending:boolean;returnDepartureAt:string;returnArrivalAt:string;outboundKm:number;outboundMinutes:number;returnKm:number;returnMinutes:number;arrivalBufferMinutes:number};
export type TourQuote=Omit<Quote,'direction'> & {kind:'tour';direction:'tour';tour:TourSnapshot};
