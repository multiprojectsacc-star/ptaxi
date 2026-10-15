import type {Metadata} from 'next';
import TourCatalogue from '@/components/tours/TourCatalogue';
export const metadata:Metadata={title:'Prywatne wycieczki z Krakowa | Personal Taxi',description:'Auschwitz-Birkenau, Zakopane i Wieliczka. Prywatny transport, oczekiwanie i powrót. Wybierz wycieczkę i zarezerwuj samochód dla swojej grupy.'};
export default function TravelsPage(){return <TourCatalogue/>;}
