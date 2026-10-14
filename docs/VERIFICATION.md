# Weryfikacja migracji Next.js / Vercel — 14 października 2026

## Wynik

Projekt działa na natywnym Next.js 16.3.8 App Router, bez Vinext, Vite i wykonawczych zależności Cloudflare. Frontend i API uruchamiają się razem przez `next start`. Zachowano zatwierdzony wygląd strony głównej, animacje, trzykolumnowy wybór auta i szerokie ekrany danych oraz podsumowania.

- `npm test`: **21 testów zaliczonych**. Obejmują reguły rezerwacji, podpisy P24, migracje PostgreSQL, 64-bitowe daty, zapis i duplikaty rezerwacji, upsert adresów, limity zapytań, JSONB, transakcje, kolejkę e-maili i kontrolę pochodzenia żądań Next.js/Vercel.
- `npm run build`: **zaliczony**, produkcyjny build Next.js z kontrolą TypeScript, bez ostrzeżeń bundlera.
- `npm run db:migrate`: **zaliczony lokalnie**. Nowa baza korzysta z PostgreSQL; lokalnie działa trwały PGlite. Testy wykonują SQL na silniku PostgreSQL PGlite, bez atrapy bazy.
- `npm run test:integration` przeciwko produkcyjnemu `next start`: **zaliczony** z rzeczywistym TomTom i nagłówkami pochodzenia odpowiadającymi przeglądarce.

## Rzeczywiste adresy i trasa

- `Opole` zwraca miejscowość.
- `Opole, Ozimska 2` zwraca `Ozimska 2, 45-057 Opole`.
- Kraków Airport → Ozimska 2: około **179,9 km, 115 min, 1249 zł** dla Economic Sedan w chwili testu. Czas zależy od danych drogowych. Wycena pochodzi z serwera.
- Zweryfikowano oba kierunki transferu, zapis rezerwacji testowej oraz odczyt jej statusu bez ujawnienia danych kontaktowych. Płatność i wysyłka e-maila nie zostały uruchomione.

## Przeglądarka

Sprawdzono produkcyjną aplikację pod `http://127.0.0.1:5183`:

- Wybór rzeczywistego adresu Floriańska 3, wybór Premium Sedan, formularz pasażera i podsumowanie.
- Odświeżenie podsumowania oraz Wstecz/Dalej zachowują trasę, wybrany samochód i wpisane dane testowe.
- Przy szerokości 1375 px: mapa po lewej, samochody w środku, podsumowanie po prawej. Trzy kafelki samochodów mieszczą się bez przewijania listy; brak poziomego przewijania strony.
- Ekrany danych i potwierdzenia zachowują mapę nad podsumowaniem po lewej oraz treść po prawej.
- Przy szerokości 390 px: układ mobilny bez poziomego przewijania.
- Brak błędów i ostrzeżeń w konsoli podczas sprawdzanego przebiegu.

Zrzut: `outputs/nextjs-migration-preview.jpg`.

## Pole telefonu — poprawka 14 października 2026

Pole telefonu ma osobny wybór kraju z flagami i prefiksami, wyszukiwanie po nazwie kraju lub kierunkowym oraz krajowy numer bez ręcznego dopisywania prefiksu. Flagi SVG są dołączone do aplikacji. Zapis dla API pozostaje pełnym numerem międzynarodowym; wybrany kraj jest dodatkowo zapamiętywany wyłącznie w szkicu formularza.

W produkcyjnym `next start` sprawdzono:

- Polska + `600123456` → `+48600123456` w podsumowaniu.
- Wielka Brytania + `07700900123` → `+447700900123` w podsumowaniu.
- Wklejenie pełnego numeru brytyjskiego nie powiela prefiksu.
- Zbyt krótki numer blokuje przejście do podsumowania.
- Odświeżenie zachowuje numer i flagę; wybór kraju pozostaje również przy pustym polu numeru.
- Wyszukiwanie po `+48`, wybór klawiaturą, polskie i angielskie etykiety oraz lista krajów przy szerokości 390 px.

Ponowny build produkcyjny i 21 istniejących testów zaliczone. Zrzut: `outputs/phone-country-picker.jpg`. Poprawka jest częścią wersji Next.js i nie została opublikowana w dotychczasowej wersji Sites.

## Zakres weryfikacji i wdrożenie

Użytkownik opublikował migrację pod `https://ptaxi-olive.vercel.app/` z commitu `702f0e2`. Obecny adres Sites nadal pokazuje wcześniejszą wersję. Nie przenoszono historycznych danych D1 ani danych rzeczywistych klientów.

Po skonfigurowaniu PostgreSQL trzeba zastosować `drizzle/postgres` i sprawdzić wdrożenie z docelową bazą. Nie testowano połączenia z zewnętrzną bazą PostgreSQL, ponieważ nie została udostępniona. Kod blokuje lokalną bazę plikową na Vercel.

Po dodaniu przez użytkownika klucza TomTom `/api/config` zgłasza `mapsMode: live`. Endpointy `/api/locations?q=Opole` i `/api/locations?q=airport` nadal odpowiadają 503 przed wywołaniem TomTom, podczas limitowania zapytań w PostgreSQL. Użytkownik potwierdził, że baza nie została podłączona.

Dodano `npm run build:vercel` jako komendę wdrożenia: sprawdza brakujące zmienne, stosuje migracje i dopiero wtedy uruchamia build Next.js. Brak konfiguracji lub błąd migracji zatrzymuje publikację; wartości sekretów nie trafiają do komunikatów. Osobno sprawdzono odrzucenie brakującej konfiguracji produkcyjnej i niepoprawnego URL bazy.

`DEMO_MODE=true` pozostaje aktywne. Testy P24 stosują atrapy odpowiedzi operatora; nie zastępują próby P24 sandbox. Przed płatnościami produkcyjnymi pozostają konfiguracja P24, Resend, domeny, chronionego ponawiania e-maili i kontrolowana próba operatora płatności.
