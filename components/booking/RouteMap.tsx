'use client';

import {useEffect, useRef, useState} from 'react';
import {LocateFixed, Minus, Plus, Route} from 'lucide-react';
import type {Quote} from '@/lib/client/booking';
import type {Locale} from '@/lib/booking';

const project = (lat: number, lng: number, z: number) => {
 const scale = 256 * 2 ** z;
 const r = Math.max(-85, Math.min(85, lat)) * Math.PI / 180;
 return [(lng + 180) / 360 * scale, (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * scale];
};
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export default function RouteMap({quote, lang = 'pl', expanded = false}: {quote: Quote; lang?: Locale; expanded?: boolean}) {
 const ref = useRef<HTMLDivElement>(null);
 const drag = useRef<{x: number; y: number} | null>(null);
 const [size, setSize] = useState({width: 320, height: 190});
 const [failed, setFailed] = useState(false);
 const [zoom, setZoom] = useState(0);
 const [pan, setPan] = useState({x: 0, y: 0});
 const t = (pl: string, en: string) => lang === 'pl' ? pl : en;

 useEffect(() => {
  const observer = new ResizeObserver(([entry]) => {
   if (entry.contentRect.width > 0 && entry.contentRect.height > 0) setSize({width: entry.contentRect.width, height: entry.contentRect.height});
  });
  if (ref.current) observer.observe(ref.current);
  return () => observer.disconnect();
 }, []);
 useEffect(() => {setFailed(false); setZoom(0); setPan({x: 0, y: 0});}, [quote.quoteId]);

 const {width, height} = size;
 const points = quote.routePoints?.length ? quote.routePoints : [[quote.from.lat, quote.from.lng], [quote.to.lat, quote.to.lng]];
 const paddingX = expanded ? Math.min(150, width * .35) : 70;
 const paddingY = expanded ? Math.min(200, height * .48) : 65;
 let fitZoom = 14;
 for (; fitZoom > 3; fitZoom--) {
  const fit = points.map(([lat, lng]) => project(lat, lng, fitZoom));
  if (Math.max(...fit.map(p => p[0])) - Math.min(...fit.map(p => p[0])) < width - paddingX && Math.max(...fit.map(p => p[1])) - Math.min(...fit.map(p => p[1])) < height - paddingY) break;
 }
 const z = clamp(fitZoom + zoom, 3, 18);
 const xy = points.map(([lat, lng]) => project(lat, lng, z));
 const xs = xy.map(p => p[0]), ys = xy.map(p => p[1]);
 const left = (Math.max(...xs) + Math.min(...xs)) / 2 - width / 2 - pan.x;
 const top = (Math.max(...ys) + Math.min(...ys)) / 2 - height / 2 - pan.y;
 const tiles = [];
 for (let x = Math.floor(left / 256); x <= Math.floor((left + width) / 256); x++) for (let y = Math.floor(top / 256); y <= Math.floor((top + height) / 256); y++) {
  if (y >= 0 && y < 2 ** z) tiles.push({x: ((x % 2 ** z) + 2 ** z) % 2 ** z, y, screenX: x * 256 - left, screenY: y * 256 - top});
 }
 const path = xy.map((p, i) => (i ? 'L' : 'M') + (p[0] - left).toFixed(1) + ',' + (p[1] - top).toFixed(1)).join(' ');
 const ends = [xy[0], xy[xy.length - 1]];
 const changeZoom = (change: number) => {setZoom(clamp(z + change, 3, 18) - fitZoom); setPan({x: 0, y: 0});};

 return <div className={'route-map' + (expanded ? ' expanded-route-map' : '')} ref={ref} aria-label={t('Mapa wyznaczonej trasy', 'Map of your route')}>
  <svg className="route-map-canvas" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${quote.from.name} → ${quote.to.name}`}
   onPointerDown={e => {if (!expanded || e.pointerType !== 'mouse' || e.button !== 0) return; drag.current = {x: e.clientX, y: e.clientY}; e.currentTarget.setPointerCapture(e.pointerId);}}
   onPointerMove={e => {if (!drag.current) return; const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y; drag.current = {x: e.clientX, y: e.clientY}; setPan(v => ({x: v.x + dx, y: v.y + dy}));}}
   onPointerUp={() => {drag.current = null;}} onPointerCancel={() => {drag.current = null;}}>
   <rect width={width} height={height} fill="#e9eeec"/>
   {quote.mapsMode === 'live' && !failed && tiles.map(tile => <image key={`${z}:${tile.x}:${tile.y}`} href={`/api/map/tile?z=${z}&x=${tile.x}&y=${tile.y}`} x={tile.screenX} y={tile.screenY} width={256} height={256} onError={() => setFailed(true)}/>)}
   <path d={path} stroke="white" strokeWidth={expanded ? 8 : 7} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
   <path d={path} stroke="#222d33" strokeWidth={expanded ? 4 : 3.5} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
   {ends.map((p, i) => <g key={i}><circle cx={p[0] - left} cy={p[1] - top} r={expanded ? 10 : 12} fill={i ? '#cfaa6b' : '#202a30'} stroke="white" strokeWidth="3"/><text x={p[0] - left} y={p[1] - top + 3.5} fill={i ? '#202a30' : 'white'} fontSize="9" fontWeight="600" textAnchor="middle">{i ? 'B' : 'A'}</text></g>)}
  </svg>
  {expanded && <>
   <div className="map-heading-label">{t('TRASA TWOJEGO TRANSFERU', 'YOUR TRANSFER ROUTE')}</div>
   <div className="map-controls"><button onClick={() => changeZoom(1)} disabled={z >= 18} aria-label={t('Przybliż mapę', 'Zoom in')}><Plus size={17}/></button><button onClick={() => changeZoom(-1)} disabled={z <= 3} aria-label={t('Oddal mapę', 'Zoom out')}><Minus size={17}/></button><button onClick={() => {setZoom(0); setPan({x: 0, y: 0});}} aria-label={t('Pokaż całą trasę', 'Fit entire route')}><LocateFixed size={16}/></button></div>
   {ends.map((p, i) => <div key={i} className={'map-endpoint-label endpoint-' + i} style={{left: clamp(p[0] - left - 70, 12, width - 160), top: clamp(p[1] - top + (i ? 17 : -65), 53, height - 95)}}><small>{i ? t('CEL PODRÓŻY', 'DESTINATION') : t('ODBIÓR', 'PICKUP')}</small><strong>{i ? quote.to.name : quote.from.name}</strong></div>)}
   <div className="map-route-distance"><Route size={15}/><strong>{new Intl.NumberFormat(lang, {maximumFractionDigits: 1}).format(quote.distanceKm)} km</strong><span>·</span>{t('ok.', 'approx.')} {quote.durationMinutes} min</div>
  </>}
  <small className="map-attribution">{quote.mapsMode === 'live' ? failed ? t('Mapa chwilowo niedostępna', 'Map temporarily unavailable') : '© TomTom' : t('Schemat demonstracyjny', 'Demo route diagram')}</small>
  {failed && expanded && <button className="map-retry" onClick={() => setFailed(false)}>{t('Spróbuj wczytać mapę ponownie', 'Try loading the map again')}</button>}
 </div>;
}
