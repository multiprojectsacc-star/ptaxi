import { config } from '@/lib/server/config';
import { handle, json, rateLimit } from '@/lib/server/http';
export const dynamic='force-dynamic';
export async function GET(request:Request){return handle(async()=>{
 const p=new URL(request.url).searchParams;
 const z=Number(p.get('z')),x=Number(p.get('x')),y=Number(p.get('y'));
 if(!Number.isInteger(z)||z<4||z>16||!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=2**z||y>=2**z)return json({error:'Nieprawidłowa mapa.'},400);
 const c=config();if(!c.tomtomKey)return json({error:'Mapa niedostępna.'},503);
 await rateLimit(request,'map',120);
 const params=new URLSearchParams({key:c.tomtomKey,language:'pl-PL',view:'Unified'});
 const res=await fetch(`https://api.tomtom.com/map/1/tile/basic/main/${z}/${x}/${y}.png?${params}`,{signal:AbortSignal.timeout(10000)});
 if(!res.ok)return json({error:'Mapa chwilowo niedostępna.'},503);
 return new Response(await res.arrayBuffer(),{headers:{'Content-Type':'image/png','Cache-Control':'public,max-age=86400','X-Content-Type-Options':'nosniff'}});
});}
