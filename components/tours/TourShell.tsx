'use client';
import SiteShell, {useSiteLocale} from '@/components/SiteShell';
export const useTourLocale = useSiteLocale;
export default function TourShell({children}:{children:React.ReactNode}) {return <SiteShell>{children}</SiteShell>;}
