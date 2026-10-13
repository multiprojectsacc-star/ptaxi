import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Personal Taxi | Prywatne transfery Kraków Airport',description:'Zarezerwuj prywatny transfer z i na lotnisko Kraków Balice. Rzeczywiste adresy, stała cena przed rezerwacją i samochód dopasowany do Twojej podróży.',icons:{icon:'/favicon.svg'},referrer:'no-referrer'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pl"><body>{children}</body></html>;}
