'use client';
import { useEffect,useRef,useState } from 'react';
import type {Quote} from '@/lib/client/booking';
const project=(lat:number,lng:number,z:number)=>{const scale=256*2**z,r=Math.max(-85,Math.min(85,lat))*Math.PI/180;return [(lng+180)/360*scale,(1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*scale];};
export default function RouteMap({quote}:{quote:Quote}){
 const ref=useRef<HTMLDivElement>(null);const [width,setWidth]=useState(320);const [failed,setFailed]=useState(false);const height=190;
 useEffect(()=>{const observer=new ResizeObserver(entries=>setWidth(entries[0].contentRect.width));if(ref.current)observer.observe(ref.current);return()=>observer.disconnect();},[]);
 const points=quote.routePoints?.length?quote.routePoints:[[quote.from.lat,quote.from.lng],[quote.to.lat,quote.to.lng]];
 let z=14,xy:number[][]=[];for(;z>=4;z--){xy=points.map(([lat,lng])=>project(lat,lng,z));if(Math.max(...xy.map(p=>p[0]))-Math.min(...xy.map(p=>p[0]))<width-70&&Math.max(...xy.map(p=>p[1]))-Math.min(...xy.map(p=>p[1]))<height-65)break;}
 const xs=xy.map(p=>p[0]),ys=xy.map(p=>p[1]);const left=(Math.max(...xs)+Math.min(...xs))/2-width/2,top=(Math.max(...ys)+Math.min(...ys))/2-height/2;
 const tiles=[];for(let x=Math.floor(left/256);x<=Math.floor((left+width)/256);x++)for(let y=Math.floor(top/256);y<=Math.floor((top+height)/256);y++)tiles.push({x,y});
 const path=xy.map((p,i)=>(i?'L':'M')+(p[0]-left).toFixed(1)+','+(p[1]-top).toFixed(1)).join(' ');const ends=[xy[0],xy[xy.length-1]];
 return <div className="route-map" ref={ref} aria-label="Mapa wyznaczonej trasy"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${quote.from.name} → ${quote.to.name}`}>
  <rect width={width} height={height} fill="#edece6"/>{quote.mapsMode==='live'&&!failed&&tiles.map(tile=><image key={tile.x+':'+tile.y} href={`/api/map/tile?z=${z}&x=${tile.x}&y=${tile.y}`} x={tile.x*256-left} y={tile.y*256-top} width={256} height={256} onError={()=>setFailed(true)}/>)}
  <path d={path} stroke="white" strokeWidth="7" fill="none" strokeLinecap="round"/><path d={path} stroke="#b88324" strokeWidth="3.5" fill="none" strokeLinecap="round"/>{ends.map((p,i)=><g key={i}><circle cx={p[0]-left} cy={p[1]-top} r="12" fill={i?'#151515':'#efbc62'} stroke="white" strokeWidth="3"/><text x={p[0]-left} y={p[1]-top+3.5} fill={i?'white':'#151515'} fontSize="10" fontWeight="700" textAnchor="middle">{i?'B':'A'}</text></g>)}
 </svg><small>{quote.mapsMode==='live'?(failed?'Mapa chwilowo niedostępna':'© TomTom'):'Schemat demonstracyjny'}</small></div>;
}
