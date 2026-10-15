/** Public, shared business data. Keep credentials and payment verification server-side. */
export type Locale = 'pl' | 'en';
export type Currency = 'PLN';
export type VehicleId = 'sedan' | 'premium' | 'van';
export type Direction = 'from-airport' | 'to-airport';

export interface Location {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  isAirport?: boolean;
  demo?: boolean;
  municipality?: string;
}

export interface Vehicle {
  id: VehicleId;
  name: string;
  description: Record<Locale, string>;
  passengers: number;
  mediumLuggage: number;
  largeLuggage: number;
  supportsCombi: boolean;
  basePricePln: number;
  image: string;
}

export const BASE_DISTANCE_KM = 20;
export const EXTRA_KM_PRICE_PLN = 7;
export const MIN_LEAD_HOURS = 16;
export const MAX_PASSENGERS = 8;
export const DEFAULT_PASSENGERS = 2;
export const DEFAULT_CURRENCY: Currency = 'PLN';

export const AIRPORT: Location = {
  id: 'krakow-airport',
  name: 'Kraków Airport · KRK',
  address: 'Kraków-Balice, terminal pasażerski',
  lat: 50.077667,
  lng: 19.784833,
  isAirport: true,
  municipality: 'Zabierzów',
};

export const VEHICLES: readonly Vehicle[] = [
  {
    id: 'sedan',
    name: 'Economic Sedan',
    description: {
      pl: 'Wygodny transfer na co dzień.',
      en: 'A comfortable everyday transfer.',
    },
    passengers: 4,
    mediumLuggage: 4,
    largeLuggage: 2,
    supportsCombi: true,
    basePricePln: 129,
    image: '/images/eco.png',
  },
  {
    id: 'premium',
    name: 'Premium Sedan',
    description: {
      pl: 'Więcej komfortu w Twojej podróży.',
      en: 'Extra comfort for your journey.',
    },
    passengers: 4,
    mediumLuggage: 4,
    // The legacy PL/EN pages disagree; use the conservative EN capacity.
    largeLuggage: 2,
    supportsCombi: true,
    basePricePln: 169,
    image: '/images/premium.png',
  },
  {
    id: 'van',
    name: 'Mini Van',
    description: {
      pl: 'Podróżujcie razem, do 8 osób.',
      en: 'Travel together, with room for up to 8.',
    },
    passengers: 8,
    mediumLuggage: 7,
    largeLuggage: 4,
    supportsCombi: false,
    basePricePln: 149,
    image: '/images/van.webp',
  },
];

export const VEHICLE_BY_ID = Object.fromEntries(
  VEHICLES.map((vehicle) => [vehicle.id, vehicle]),
) as Record<VehicleId, Vehicle>;

/** Legacy PLN tariff, in integer grosz. The server must obtain its own route distance. */
export function calculatePrice(distanceKm: number, vehicleId: VehicleId): number {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    throw new RangeError('Distance must be a finite, non-negative number.');
  }
  const vehicle = VEHICLE_BY_ID[vehicleId];
  if (!vehicle) throw new RangeError('Unknown vehicle.');
  const billableExtraKm = Math.max(0, Math.round(distanceKm) - BASE_DISTANCE_KM);
  return (vehicle.basePricePln + billableExtraKm * EXTRA_KM_PRICE_PLN) * 100;
}

export function formatPrice(amountGrosz: number, locale: Locale = 'pl'): string {
  return new Intl.NumberFormat(locale === 'pl' ? 'pl-PL' : 'en-GB', {
    style: 'currency',
    currency: DEFAULT_CURRENCY,
    maximumFractionDigits: amountGrosz % 100 === 0 ? 0 : 2,
    minimumFractionDigits: amountGrosz % 100 === 0 ? 0 : 2,
  }).format(amountGrosz / 100);
}
