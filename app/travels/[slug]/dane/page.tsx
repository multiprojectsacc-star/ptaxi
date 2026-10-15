import {notFound} from 'next/navigation';
import {getTour} from '@/lib/tours';
import TourBooking from '@/components/tours/TourBooking';
export const metadata={title:'Rezerwacja wycieczki | Personal Taxi',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{slug:string}>}){const tour=getTour((await params).slug);if(!tour)notFound();return <TourBooking key={tour.slug+'-2'} tour={tour} step={2}/>;}
