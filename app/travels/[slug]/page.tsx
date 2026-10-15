import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {TOURS,getTour} from '@/lib/tours';
import TourDetail from '@/components/tours/TourDetail';
export function generateStaticParams(){return TOURS.map(t=>({slug:t.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const tour=getTour((await params).slug);return {title:tour?tour.title.pl+' — prywatny transport | Personal Taxi':'Wycieczka | Personal Taxi',description:tour?.description.pl};}
export default async function TourPage({params}:{params:Promise<{slug:string}>}){const tour=getTour((await params).slug);if(!tour)notFound();return <TourDetail tour={tour}/>;}
