import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { locations } from "@/db/schema";
import { AIRPORT, type Location } from "@/lib/booking";
import { ApiError, assertServiceArea } from "./rules";
import type { Config } from "./config";

export const DEMO_LOCATIONS: Location[] = [
  {id:"demo-rynek",name:"Rynek Główny",address:"Rynek Główny, Kraków",lat:50.06143,lng:19.93658,demo:true},
  {id:"demo-kazimierz",name:"Kazimierz",address:"Plac Wolnica, Kraków",lat:50.04861,lng:19.94427,demo:true},
  {id:"demo-dworzec",name:"Kraków Główny",address:"Pawia 5, Kraków",lat:50.06719,lng:19.94722,demo:true},
  {id:"demo-wieliczka",name:"Kopalnia Soli Wieliczka",address:"Daniłowicza 10, Wieliczka",lat:49.98325,lng:20.05354,demo:true},
  {id:"demo-zakopane",name:"Zakopane — Krupówki",address:"Krupówki, Zakopane",lat:49.29412,lng:19.95311,demo:true},
  {id:"demo-auschwitz",name:"Muzeum Auschwitz-Birkenau",address:"Więźniów Oświęcimia 20, Oświęcim",lat:50.02720,lng:19.20234,demo:true},
  {id:"demo-hotel",name:"Hotel Stary",address:"Szczepańska 5, Kraków",lat:50.06352,lng:19.93601,demo:true},
  {id:"demo-hilton",name:"Hilton Garden Inn Kraków",address:"Marii Konopnickiej 33, Kraków",lat:50.04368,lng:19.93321,demo:true},
];
const fold = (value:string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ł/g,"l");
const airportQuery = (value:string) => /airport|lotnisk|port lotnic|balice|\bkrk\b/i.test(value);

export async function searchLocations(query:string,c:Config):Promise<Location[]> {
  if (airportQuery(query)) return [AIRPORT];
  if (c.mapsMode === "demo" && c.mode === "demo") {
    const q=fold(query);
    return DEMO_LOCATIONS.filter(l=>fold(`${l.name} ${l.address}`).includes(q)).slice(0,7);
  }
  if (!c.tomtomKey) throw new ApiError(503,"MAP_UNAVAILABLE","Wyszukiwanie adresów jest chwilowo niedostępne.");
  const params = new URLSearchParams({key:c.tomtomKey,countrySet:"PL",lat:String(AIRPORT.lat),lon:String(AIRPORT.lng),limit:"10",typeahead:"true",language:"pl-PL",view:"Unified"});
  if(c.radiusKm>0) params.set("radius",String(c.radiusKm*1000));
  const response=await fetch(`https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?${params}`,{signal:AbortSignal.timeout(10_000)});
  if(!response.ok) throw new ApiError(503,"MAP_UNAVAILABLE","Nie udało się wyszukać adresu. Spróbuj ponownie.");
  type Result={id:string;type:string;position:{lat:number;lon:number};poi?:{name?:string;categories?:string[]};address:{freeformAddress?:string;municipality?:string;countryCode?:string}};
  const data=await response.json() as {results?:Result[]};
  const result:Location[]=[];
  for(const item of data.results||[]){
    if(item.address.countryCode!=="PL" || !Number.isFinite(item.position?.lat)||!Number.isFinite(item.position?.lon)) continue;
    if((item.poi?.categories||[]).some(t=>/airport|aerodrome|lotnic|lotnisk/i.test(t)) || airportQuery(item.poi?.name||"")) continue;
    const address=item.address.freeformAddress||item.address.municipality||"";
    const location:Location={id:item.id,name:item.poi?.name||address,address,lat:item.position.lat,lng:item.position.lon};
    try{assertServiceArea(AIRPORT,location,c.radiusKm);}catch{continue;}
    if(!address)continue;
    result.push(location);
  }
  const uniqueResults=[...new Map(result.map(location=>[location.id,location])).values()];
  if(uniqueResults.length){
    const db=getDb();
    await db.insert(locations).values(uniqueResults.map(location=>({id:location.id,payload:JSON.stringify(location),expiresAt:Date.now()+24*3600_000}))).onConflictDoUpdate({target:locations.id,set:{payload:sql`excluded.payload`,expiresAt:sql`excluded.expires_at`}});
  }
  return uniqueResults;
}

export async function resolveLocation(id:string,c:Config):Promise<Location>{
  if(id===AIRPORT.id) return AIRPORT;
  if(c.mapsMode==="demo" && c.mode==="demo"){
    const location=DEMO_LOCATIONS.find(l=>l.id===id);
    if(!location)throw new ApiError(422,"SELECT_LOCATION","Wybierz adres z listy podpowiedzi.");
    return location;
  }
  if(id.startsWith("demo-"))throw new ApiError(422,"SELECT_LOCATION","Wyszukaj adres ponownie i wybierz rzeczywistą lokalizację z listy.");
  const [row]=await getDb().select().from(locations).where(eq(locations.id,id)).limit(1);
  if(!row||row.expiresAt<Date.now()) throw new ApiError(422,"SELECT_LOCATION","Wyszukaj ponownie adres i wybierz go z listy.");
  return JSON.parse(row.payload) as Location;
}

const DEMO_ROUTES:Record<string,[number,number]>={"demo-rynek":[17.2,29],"demo-kazimierz":[21.4,31],"demo-dworzec":[17.8,28],"demo-wieliczka":[27.7,31],"demo-zakopane":[112.4,106],"demo-auschwitz":[58.8,58],"demo-hotel":[16.9,28],"demo-hilton":[20.6,29]};
export async function calculateRoute(from:Location,to:Location,departureAt:string,c:Config){
  if(c.mapsMode==="demo" && c.mode==="demo"){
    const point=from.id===AIRPORT.id?to:from;
    const [distanceKm,durationMinutes]=DEMO_ROUTES[point.id]||[20,30];
    return {distanceKm,durationMinutes,routePoints:[[from.lat,from.lng],[to.lat,to.lng]] as [number,number][]};
  }
  if(!c.tomtomKey)throw new ApiError(503,"MAP_UNAVAILABLE","Wyznaczanie trasy jest chwilowo niedostępne.");
  const params=new URLSearchParams({key:c.tomtomKey,routeType:"fastest",traffic:"true",travelMode:"car",departAt:departureAt,routeRepresentation:"polyline"});
  const response=await fetch(`https://api.tomtom.com/routing/1/calculateRoute/${from.lat},${from.lng}:${to.lat},${to.lng}/json?${params}`,{signal:AbortSignal.timeout(12_000)});
  if(!response.ok)throw new ApiError(503,"ROUTE_UNAVAILABLE","Nie udało się wyznaczyć trasy. Spróbuj ponownie.");
  const data=await response.json() as {routes?:{summary:{lengthInMeters:number;travelTimeInSeconds:number};legs:{points:{latitude:number;longitude:number}[]}[]}[]};
  const route=data.routes?.[0];
  if(!route?.summary || !Number.isFinite(route.summary.lengthInMeters)||route.summary.lengthInMeters<=0)throw new ApiError(422,"ROUTE_UNAVAILABLE","Nie znaleziono przejezdnej trasy pod ten adres.");
  const points=route.legs.flatMap(leg=>leg.points);
  const step=Math.max(1,Math.ceil(points.length/200));
  return {distanceKm:route.summary.lengthInMeters/1000,durationMinutes:Math.ceil(route.summary.travelTimeInSeconds/60),routePoints:points.filter((_,i)=>i%step===0||i===points.length-1).map(p=>[p.latitude,p.longitude] as [number,number])};
}
