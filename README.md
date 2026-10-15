# Personal Taxi — Next.js / Vercel

Jedna aplikacja Next.js 16.3.8 App Router, React 19 i TypeScript. Frontend oraz API uruchamiają się w Next.js. Zachowano aktualny wygląd strony głównej, animacje i szerokie układy wszystkich kroków rezerwacji. Vinext, Vite oraz zależności wykonawcze Cloudflare zostały usunięte.

## Uruchomienie lokalne

Wymagany Node.js 24.

```sh
npm ci
cp .env.example .env.local
npm run db:migrate
npm run dev
```

W `.env.local` ustaw `TOMTOM_API_KEY`, aby korzystać z rzeczywistych adresów i tras. Klucz pozostaje wyłącznie na serwerze. Lokalnie `PGLITE_DATA_DIR=.data/personal-taxi` uruchamia trwałą bazę PostgreSQL PGlite bez instalacji dodatkowego serwera. Alternatywnie ustaw `DATABASE_URL` do zwykłego PostgreSQL.

```sh
npm run typecheck
npm test
npm run build
npm start
```

`npm run dev`, `npm run build` i `npm start` uruchamiają odpowiednio `next dev`, `next build` i `next start`.

## Wdrożenie na Vercel

1. Zaimportuj projekt do Vercel z ustawieniem Framework: **Next.js**. Katalogiem głównym jest ten folder.
2. Dodaj bazę PostgreSQL, np. Neon z Vercel Marketplace. Ustaw serwerową zmienną `DATABASE_URL` z połączeniem przez pooler. Na Vercel lokalna baza plikowa jest celowo zablokowana.
3. Dodaj `TOMTOM_API_KEY`, `DEMO_MODE=true` i `SERVICE_RADIUS_KM=0`. Pozostałe zmienne opisuje `.env.example`. Nie używaj `NEXT_PUBLIC_*` dla sekretów.
4. Wdróż projekt. `vercel.json` uruchamia `npm run build:vercel`: sprawdza obecność konfiguracji, stosuje migracje z `drizzle/postgres` i buduje Next.js. Brak `DATABASE_URL` / `TOMTOM_API_KEY` lub błąd migracji zatrzymuje wdrożenie. Wartości sekretów nie są drukowane.
5. Tabele powstaną automatycznie podczas wdrożenia — nie trzeba wklejać SQL do panelu bazy. Do ręcznej migracji służy `npm run db:migrate` z docelowym `DATABASE_URL`. Nie uruchamiaj migracji historycznego D1 z `docs/legacy-d1`.
6. Ustaw `APP_URL` na docelową domenę HTTPS. Do płatności potrzebny jest publicznie dostępny `/api/payments/notify`.

Nie kopiuj `.env.local`, `.dev.vars` ani `.data` do repozytorium. Konfiguracja Vercel i archiwum źródłowe pomijają te pliki. Istniejąca publikacja Sites pozostaje osobną, wcześniejszą wersją; ten projekt jest przygotowany do wdrożenia na Vercel. Dotychczasowe dane D1 nie zostały przeniesione do nowej bazy.

Samo dodanie klucza TomTom nie wystarczy: wyszukiwanie używa PostgreSQL do limitowania zapytań i przechowywania zweryfikowanych adresów. W Vercel otwórz projekt → Storage → Create Database, dodaj integrację Neon/PostgreSQL i połącz bazę z projektem dla Production. Upewnij się, że zmienna nazywa się dokładnie `DATABASE_URL`, bez własnego prefiksu, po czym wykonaj Redeploy.

## Rezerwacja

- `/` — kierunek, adres, termin, pasażerowie i bagaż.
- `/rezerwacja/samochod` — samochód, rzeczywista mapa i wycena.
- `/rezerwacja/dane` — dane pasażera, lot, uwagi, kombi i faktura.
- `/rezerwacja/podsumowanie` — kontrola danych i potwierdzenie.
- `/rezerwacja/status?token=…` — trwały status konkretnej rezerwacji.

Wspólny interfejs znajduje się w `components/PersonalTaxi.tsx`; strony App Router importują ten sam komponent. Formularz i oferta są przywracane po odświeżeniu w tej samej karcie. Oferta wygasa po 15 minutach. Serwer ponownie sprawdza cenę i dostępność przed zapisem.

Każdy transfer ma jeden koniec na Kraków Airport. Wyszukiwanie obejmuje Polskę, bez sztywnego limitu kilometrów. Minimum wyprzedzenia wynosi 16 godzin. Zachowano taryfy, limity pasażerów i bagażu z poprzedniej wersji.

## Wycieczki prywatne

`/travels` to nowy katalog z ofertami `/travels/auschwitz-birkenau`, `/travels/zakopane` i `/travels/wieliczka`. Każda oferta ma osobne kroki `rezerwacja`, `dane` i `podsumowanie`; powrót z płatności prowadzi do `/travels/status?token=…`. `/pl/travels` przekierowuje do polskiego katalogu. Obsługiwane są wersje PL/EN.

Cennik w `lib/tours.ts` zachowuje ceny całego samochodu (Sedan / Premium / Van): Auschwitz 600 / 790 / 890 zł, Zakopane 890 / 990 / 1090 zł, Wieliczka 290 / 320 / 350 zł. Transport obejmuje dojazd, oczekiwanie (odpowiednio 210 / 300 / 180 minut) i powrót. Bilety, przewodnik oraz posiłki nie są wliczone. Zdjęcia pochodzą z materiałów poprzedniego projektu; układ i teksty opracowano na nowo.

Odbiór jest dostępny w Krakowie i gminie Zabierzów, także na lotnisku. To osobny obszar stałych ofert wycieczek, nie ograniczenie transferów lotniskowych. Klient podaje **początek wizyty**, a serwer oblicza wcześniejszy odbiór według rzeczywistej trasy, minimalnego zapasu i czasu przyjazdu przed wejściem. Rezerwacja wymaga min. 16 godzin do odbioru. Godziny powrotu są orientacyjne. Jeśli adres jest jeszcze nieznany, formularz oznacza go jako do ustalenia, a mapę i odbiór szacuje z centrum Krakowa.

Nowy endpoint korzysta z istniejących tabel ofert/rezerwacji, Przelewy24 i kolejki e-maili; nie wymaga dodatkowej migracji. Tryb demonstracyjny i istniejąca konfiguracja płatności pozostają wspólne z transferami.

## Mapy i płatności

`TOMTOM_API_KEY` włącza rzeczywiste wyszukiwanie adresów i drogową trasę. `DEMO_MODE=true` zapisuje wyłącznie rezerwację testową: bez zamówienia samochodu, płatności i e-maila. Tryby map i płatności są niezależne.

Płatności pozostają testowe. Włączenie `DEMO_MODE=false` wymaga kompletu zmiennych Przelewy24, nadawcy Resend, `APP_URL` i `CRON_SECRET`. Przed uruchomieniem płatności trzeba wykonać kontrolowaną próbę P24 sandbox oraz skonfigurować zewnętrzne wywołania chronionego `POST /api/internal/email-retry`.

## Weryfikacja

`npm test` sprawdza reguły biznesowe oraz operacje na prawdziwym silniku PostgreSQL PGlite: migracje, 64-bitowe znaczniki czasu, zapis i duplikaty rezerwacji, upsert adresów, limity zapytań, JSONB, transakcje i idempotencję kolejki e-maili. Testy P24 używają atrap odpowiedzi operatora i nie wykonują płatności.

Przy uruchomionym Next.js, aktywnym kluczu TomTom i `DEMO_MODE=true`:

```sh
TEST_BASE_URL=http://127.0.0.1:5183 npm run test:integration
```

Test sprawdza Opole, Ozimską 2, obie strony transferu, kwotę obliczoną przez serwer oraz zapis rezerwacji testowej. `TEST_BASE_URL=http://127.0.0.1:5183 npm run test:tours:integration` dodatkowo sprawdza rzeczywisty odbiór w Krakowie, odrzucenie Opola w stałej ofercie wycieczki, trasę, cenę i zapis wycieczki demonstracyjnej. Oba testy odmawiają pracy poza trybem demo.

Kontrakt API: `docs/BACKEND.md`. Reguły odzyskane z pierwotnego kodu: `docs/AUDIT.md`. Dokumenty prawne: `docs/legal-source.md`.
