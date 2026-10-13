# Personal Taxi — nowy projekt rezerwacji

Interfejs zbudowany od nowa: fotograficzna strona główna z samochodem przy lotnisku, dużym nagłówkiem, korzyściami i pionowym formularzem. Rezerwacja prowadzi przez osobne strony wyboru auta, danych pasażera i podsumowania, zgodnie ze sposobem rezerwacji wskazanym przez użytkownika na book.transfeero.com. Oryginalny znak Personal Taxi został zachowany z usuniętym czarnym tłem.

## Strony

- `/`: kierunek, rzeczywisty adres, data, pasażerowie i bagaż.
- `/rezerwacja/samochod`: lista samochodów, ceny i mapa wyznaczonej trasy.
- `/rezerwacja/dane`: dane pasażera, lot, uwagi i faktura.
- `/rezerwacja/podsumowanie`: kontrola danych i przejście do płatności.
- `/rezerwacja/status?token=…`: trwałe potwierdzenie konkretnej rezerwacji.

Kroki mają osobne adresy. Formularz oraz oferta są przywracane po odświeżeniu w tej samej karcie. Oferta wygasa po 15 minutach; przed zapisem serwer sprawdza jej ważność i cenę.

## Mapy i płatności

Te dwa tryby są niezależne:

- `TOMTOM_API_KEY` włącza rzeczywiste wyszukiwanie miejscowości, ulic, numerów i hoteli oraz rzeczywistą trasę drogową. Klucz jest tylko na serwerze. Wyszukiwanie obejmuje Polskę, bez sztywnego limitu kilometrów.
- `DEMO_MODE=true` zapisuje rezerwację testową bez pobrania płatności, wysyłki e-maila ani zamówienia samochodu. Rzeczywiste adresy i trasy nadal działają.
- Bez klucza map dostępne są wyłącznie oznaczone dane przykładowe do lokalnych testów.

Jeden koniec każdej trasy to Kraków Airport. Minimum wyprzedzenia: 16 godzin. Taryfa: do 20 zaokrąglonych kilometrów Eco 129 zł, Premium 169 zł, Van 149 zł; kolejne kilometry po 7 zł. Waluta: PLN.

## Lokalnie

Node.js 24. Zależności: `npm run install:ci`. Skopiuj `.env.example` do `.dev.vars` i skonfiguruj klucz TomTom. Oba pliki runtime z sekretami są ignorowane przez Git; nie stosuj `NEXT_PUBLIC_*` do kluczy.

```sh
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_thick_joystick.sql
npm run dev
```

Migrację lokalną zastosuj raz. D1 przechowuje wyniki wyszukiwania, oferty, pełne rezerwacje, powiązania płatności i kolejkę e-maili. Strona i API są jednym projektem Vinext/React/TypeScript działającym jako Cloudflare Worker.

## Weryfikacja

```sh
node --test tests/backend.test.ts
npx tsc --noEmit
npm run build
```

Przy uruchomionym lokalnym serwerze, aktywnym kluczu map i płatnościach testowych:

```sh
node tests/live-maps.integration.mjs
```

Ten test sprawdza Opole, Ozimską 2, rzeczywistą trasę w obu kierunkach, cenę po stronie serwera i zapis rezerwacji testowej. Starsze testy danych demonstracyjnych wymagają uruchomienia bez klucza map.

## Rzeczywiste płatności

Pozostają wyłączone do konfiguracji i próby Przelewy24 sandbox. `DEMO_MODE=false` wymaga poprawnych danych P24, publicznego `APP_URL`, Resend, adresów e-mail i `CRON_SECRET`. Prywatny podgląd Sites nie odbiera publicznych callbacków operatora płatności. Produkcja wymaga publicznego endpointu webhooka, weryfikacji domeny nadawcy oraz konfiguracji ponawiania kolejki.

Szczegóły serwera: `docs/BACKEND.md`. Reguły odzyskane z pierwotnego projektu: `docs/AUDIT.md`. Teksty prawne wymagające aktualizacji przed produkcją: `docs/legal-source.md`. Nie migrowano historycznych danych klientów ani rezerwacji.
