import { config } from "@/lib/server/config";
import { handle, json, rateLimit } from "@/lib/server/http";
import { searchLocations } from "@/lib/server/locations";
export const dynamic="force-dynamic";
export async function GET(request:Request){return handle(async()=>{
  await rateLimit(request,"locations",40);
  const q=(new URL(request.url).searchParams.get("q")||"").trim().slice(0,150);
  const c=config();
  if(q.length<2)return json({locations:[],mode:c.mode,mapsMode:c.mapsMode,mapProvider:c.mapProvider});
  return json({locations:await searchLocations(q,c,new URL(request.url).searchParams.get("scope")==="tour"?"tour":"transfer"),mode:c.mode,mapsMode:c.mapsMode,mapProvider:c.mapProvider});
});}
