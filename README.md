# Personal Taxi

Nowa strona transferów z lotniska Kraków-Balice i na lotnisko: polski i angielski interfejs, wyszukiwanie adresów, wycena trasy, wybór samochodu, dane pasażera, podsumowanie i integracja płatności. Frontend i API znajdują się w jednym projekcie. Oryginalne logo zostało zachowane.

**Domyślnie działa tryb demonstracyjny.** Korzysta z przykładowych lokalizacji i szacunkowych tras; nie obciąża płatnością, nie wysyła wiadomości i nie zamawia samochodu. Nie należy utożsamiać uruchomionego podglądu z aktywacją produkcyjnych płatności.

## Uruchomienie lokalne

Wymagany Node.js co najmniej 22.13; do uruchamiania testów TypeScript bez dodatkowej konfiguracji zalecany Node.js 24. Polecenia wykonuj z katalogu projektu. Nie uruchamiaj dwóch instalacji zależności jednocześnie.

```sh
npm run install:ci
cp .env.example .dev.vars
npm run build
```

Pozostaw `DEMO_MODE=true`. Zastosuj do lokalnej bazy dostarczoną migrację **raz**, przed pierwszą rezerwacją:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_thick_joystick.sql
npm run dev
```

Podgląd deweloperski uruchamia się domyślnie pod `http://localhost:5173`; użyj adresu wypisanego przez proces. Po zbudowaniu `npm start` uruchamia lokalny podgląd gotowego Workera, bez publikacji strony. Oba podglądy korzystają z danych w `.wrangler/state`.

`.dev.vars` jest ignorowany przez Git. Zawiera konfigurację środowiska, a nie ustawienia publicznego frontendu. Nie umieszczaj sekretów w zmiennych `NEXT_PUBLIC_*`. Projekt nie wymaga uruchomienia starego backendu ani połączenia ze starą bazą klientów.

## Architektura

| Miejsce | Odpowiedzialność |
| --- | --- |
| `app/page.tsx`, `app/globals.css` | Strona i przebieg rezerwacji PL/EN |
| `app/api/` | Wyszukiwanie, wyceny, rezerwacje, status, webhook płatności |
| `lib/booking.ts` | Publiczne reguły taryfy i metadane pojazdów |
| `lib/server/` | Walidacja, TomTom, Przelewy24, email i zapis rezerwacji |
| `db/schema.ts`, `drizzle/` | Schemat i migracje trwałej bazy Cloudflare D1 |
| `tests/backend.test.ts` | Testy reguł i integralności płatności |
| `public/images/` | Logo, zdjęcia i grafiki |

Projekt korzysta z React, TypeScript i routingu App Router obsługiwanego przez Vinext/Vite. Interfejs oraz endpointy API są dostarczane przez jeden Cloudflare Worker. D1 przechowuje wyniki wyszukiwania, wyceny, rezerwacje i kolejkę emaili. Konfiguracja Sites wiąże bazę pod nazwą `DB`; szczegóły znajdują się w `.openai/hosting.json` i `vite.config.ts`.

Cena pochodzi z serwera i jest zapisywana w groszach. W produkcji dystans pochodzi z TomTom. Płatność może otrzymać status `paid` dopiero po zweryfikowanym webhooku Przelewy24 i weryfikacji serwer–serwer. Powrót przeglądarki z płatności sam nie potwierdza jej wykonania.

## Reguły usługi

- Dokładnie jeden koniec każdej trasy to Kraków Airport (KRK); drugi to wybrany adres w Polsce. Brak sztywnego limitu promienia.
- Minimum 16 godzin wyprzedzenia, termin prezentowany w czasie Polski.
- Sedan i Premium: do 4 pasażerów; Mini Van: do 8.
- Ceny PLN do 20 zaokrąglonych kilometrów drogi: 129 / 169 / 149 zł; kolejne kilometry po 7 zł.
- Bagaż: do 4 średnich lub 2 dużych walizek w sedanie; do 7 średnich lub 4 dużych w vanie. Nietypowy bagaż należy opisać.
- Combi dostępne dla sedanów. Pierwsza wersja rozlicza wyłącznie PLN.

Pełne ustalenia i rozbieżności w starym kodzie: [docs/AUDIT.md](docs/AUDIT.md). Kontrakt API, konfiguracja integracji i zachowanie kolejki: [docs/BACKEND.md](docs/BACKEND.md).

## Sprawdzenie zmian

```sh
node --test tests/backend.test.ts
npx tsc --noEmit
npm run build
```

Przejdź również cały przepływ w przeglądarce: oba kierunki i języki, wyszukanie i zmiana adresu, wybór auta, pasażerów i bagażu, dane kontaktowe, zgoda, rezerwacja demonstracyjna i sprawdzenie statusu. Sprawdź odrzucenie przeszłego terminu, zbyt małego auta, wygasłej wyceny oraz ponownego użycia tej samej wyceny. Same testy lokalne nie potwierdzają poprawności zewnętrznych kont i konfiguracji produkcyjnej.

Po zmianie schematu `npm run db:generate` generuje kolejną migrację. Zastosuj tylko nowe migracje, kolejno. Migracja lokalnego podglądu nie modyfikuje bazy produkcyjnej.

## Przed uruchomieniem rzeczywistych rezerwacji

1. Ustaw poprawne dane TomTom, Przelewy24, `APP_URL`, Resend i skrzynki operatora według `.env.example`. Wymień sekrety, które znajdowały się w poprzednim kodzie.
2. Zapewnij trwałe powiązanie D1 oraz publicznie dostępny adres webhooka `/api/payments/notify`. Prywatny podgląd Sites nie nadaje się do odbierania produkcyjnego callbacku P24.
3. Przetestuj pełną płatność na osobnych danych **P24 sandbox**: rejestrację, przekierowanie, zweryfikowany callback, odczyt statusu oraz ponowiony callback bez duplikowania maili.
4. Zweryfikuj domenę nadawcy Resend. Skonfiguruj zadanie wywołujące `/api/internal/email-retry` z sekretem `CRON_SECRET` i monitorowanie kolejki wiadomości. Resend zastępuje stare SMTP; nie jest aktywowany automatycznie.
5. Potwierdź dane firmy, aktualne ceny i pojemności bagażników oraz treści prawne. [docs/legal-source.md](docs/legal-source.md) opisuje odzyskane dokumenty; oryginalny angielski regulamin jest niekompletny. Kopia archiwalna znajduje się w `lib/legal-content.json`.
6. Dopiero po sprawdzeniu integracji ustaw `DEMO_MODE=false`, właściwe dane produkcyjne i `P24_SANDBOX=false`. Wykonaj końcową kontrolę statusów i wysyłki na środowisku docelowym.

Nie przeniesiono historycznych rezerwacji ani danych klientów. Nie dodano kont pasażerów, panelu dyspozytora, rozliczeń EUR ani automatycznej rezerwacji kursu powrotnego. Oba kierunki można rezerwować osobno. Nowe zdjęcia przedstawiają przykładowe samochody danej klasy.
