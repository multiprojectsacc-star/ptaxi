# Personal Taxi — audyt źródeł i założenia migracji

Przejrzano aplikację w `/Users/marco/Onesta Group/Personal taxi/www` oraz jej istniejący przepływ rezerwacji. Poniższe ścieżki źródłowe są względne wobec tego katalogu. Dokument nie zawiera kluczy API, haseł ani danych klientów.

## Zakres nowej aplikacji

Zgodnie z aktualnym poleceniem właściciela rezerwacje dotyczą wyłącznie transferu **z lotniska Kraków-Balice (KRK) pod wybrany adres albo z adresu na KRK**. Strona otrzymuje nowy projekt graficzny; zachowane zostaje oryginalne logo. Interfejs i API działają w jednym projekcie. Pierwsza wersja rozlicza rezerwacje w PLN; polski i angielski są językami interfejsu.

## Zweryfikowane reguły biznesowe

| Element | Fakt ze źródeł | Źródło |
| --- | --- | --- |
| Economic Sedan | 4 pasażerów; 129 PLN za trasę do 20 km | `src/components/sedancomponent.tsx:39`, `:140` |
| Premium Sedan | 4 pasażerów; 169 PLN za trasę do 20 km | `src/components/premiumsedancomponent.tsx:39`, `:139` |
| Mini Van | 8 pasażerów; 149 PLN za trasę do 20 km | `src/components/vancomponent.tsx:37`, `:113` |
| Dopłata za dystans | 7 PLN za każdy km powyżej 20 km | `src/components/chooseparams.tsx:172` |
| Podstawa dystansu | Pierwsza trasa samochodowa TomTom; `Math.round(lengthInMeters / 1000)` | `src/components/tomtom.tsx:128` |
| Wyprzedzenie | Minimum 16 godzin | `src/pages/_app.tsx:131` |
| Pasażerowie | Główna wyszukiwarka: od 1 do 8; domyślnie 2 | `src/components/MainPage/Search/search.tsx:84`, `src/pages/_app.tsx:152` |
| Combi | Opcja dla obu sedanów; brak dopłaty w kodzie | `src/components/sedancomponent.tsx:64`, `src/components/premiumsedancomponent.tsx:63` |
| Oczekiwanie na lotnisku | Monitorowanie lotu oraz oczekiwanie do 60 minut po przylocie | `src/components/aboutuscomponets/watingtimePL.tsx:14` |
| Oczekiwanie pod adresem | Do 15 minut; kontakt z klientem w razie problemów | `src/components/aboutuscomponets/watingtimehotelPL.tsx:14` |
| Odbiór z lotniska | Tabliczka z nazwiskiem w hali przylotów | `src/data/faq.json:9` |
| Płatność | Przelewy24; zapis zamówienia, przekierowanie, weryfikacja i email | `src/pages/ordering/payment.tsx:59`, `src/pages/ordering/verify.tsx:75`, `src/pages/api/sendnotificationTaxi.tsx:43` |
| Logo | Używany plik `public/logo_personal_2.png` | `src/components/Header/header.tsx:31` |

Oryginalne ceny EUR wynosiły 30 / 40 / 35 EUR, z dopłatą 1,62 EUR za km powyżej 20 km i zaokrągleniem końcowej ceny do pełnego euro. Nie była to dynamiczna konwersja PLN. Nie należy wyświetlać cen EUR jako automatycznego przeliczenia tego starego cennika.

### Bagaż

- Economic Sedan: do 4 średnich **lub** 2 dużych walizek.
- Premium Sedan: wersja angielska podaje 4 średnie / 2 duże; polska 4 średnie / 4 duże. Konserwatywnym opisem do czasu potwierdzenia pojemności są 2 duże walizki.
- Mini Van: do 7 średnich **lub** 4 dużych walizek.
- Nietypowy bagaż jest polem opisowym. Źródła nie zawierają cennika ani automatycznego przelicznika nietypowego bagażu.
- Liczby różnych rozmiarów walizek nie oznaczają, że mieszczą się jednocześnie. Nie znaleziono kompletnej reguły mieszania bagażu.

Źródła: `src/components/sedancomponent.tsx:140`, `src/components/premiumsedancomponent.tsx:139`, `src/components/premiumsedancomponentPL.tsx:138`, `src/components/vancomponent.tsx:113`.

### Dane rezerwacji

Dotychczasowy formularz zbierał trasę, współrzędne obu punktów, termin, pasażerów, auto, combi, imię, nazwisko, email, telefon z prefiksem i akceptację polityki prywatności oraz regulaminu. Opcjonalne były numer lotu, opis nietypowego bagażu oraz uwagi dla kierowcy. Występował także wybór formy grzecznościowej. Źródła nie zawierają rezerwacji powrotnej ani działającego wyboru fotelików dziecięcych.

Źródła: `src/components/MainPage/Search/orderpersonaldetails.tsx:91`, `src/components/chooseparams.tsx:145`.

## Istotne rozbieżności względem opisu projektu

**Nie znaleziono limitu 60 km.** Stary `tomtom.tsx` przyjmował dowolną trasę, jeśli przynajmniej jeden koniec należał do gminy Kraków/Krakow/Zabierzów. Nie wymuszał lotniska i nie sprawdzał promienia. W toku realizacji właściciel potwierdził brak sztywnego limitu promienia w nowej aplikacji; nie należy dodawać arbitralnej blokady 60 km.

Źródła: `src/components/tomtom.tsx:72`, `:429`.

Wyszukiwanie TomTom obejmowało PL i DE, maksymalnie 10 wyników, po ponad 3 znakach i 150 ms opóźnienia. Odrzucało wyniki typu Geography i wszystkie adresy bez numeru ulicy. Jedynie dla początku trasy zamieniało słowo „cracow” na „Krakow”. Lotniska otrzymywały nazwę KRK wskutek błędnego warunku z zawsze prawdziwą alternatywą tekstową — to nie było skuteczne filtrowanie do KRK.

Źródła: `src/components/tomtom.tsx:69`, `:202`, `:224`, `:233`, `:261`, `:417`.

## Błędy starego przepływu, których nie należy przenosić

- Polskie pole liczby pasażerów w kroku rezerwacji dopuszczało 40, mimo że główna wyszukiwarka kończyła się na 8. Wybór zbyt małego auta nie był skutecznie blokowany.
- Limit terminu zapisano jako UTC w polu oczekującym czasu lokalnego, powodując przesunięcie godzin.
- Stan formularza istniał jedynie w pamięci React i mógł znikać po odświeżeniu lub przekierowaniu.
- Angielski zapis zamówienia zawsze zapisywał walutę EUR; pomijał wybrany samochód, pasażerów i combi. Polski ekran płatności używał funkcji zapisu wycieczek i pomijał istotne dane transferu.
- Kwota i dane podpisu płatności zbyt mocno zależały od klienta. Cena, uprawniona trasa, pojemność auta i termin powinny być sprawdzane ponownie na serwerze.
- Zapisane w źródłach sekrety nie powinny trafiać do kodu klienta ani repozytorium nowej aplikacji. Nowa konfiguracja powinna pochodzić ze zmiennych środowiskowych.
- Stopka wymieniała również PayPal, Google Pay i Apple Pay, ale nie znaleziono osobnych integracji tych metod. Nie należy deklarować dostępności na podstawie samego tekstu stopki.
- Formularz kontaktowy i część FAQ były niedokończone. Nie należy kopiować atrap formularzy ani pytań zastępczych.

## Treść firmowa ze źródeł

Stopka wskazuje: **Inter-Dywiz Sp. z o.o.**, ul. Lotnicza 6/2, NIP 6751496482, `biuro@inter-dywiz.pl`. Są to dane z dostarczonego kodu, a nie niezależna weryfikacja aktualnych danych rejestrowych. Źródło: `src/components/Footer/footer.tsx:32`.

## Uruchomienie produkcyjne

Gotowy interfejs oraz lokalny przebieg rezerwacji nie potwierdzają działania rozliczeń produkcyjnych. Do uruchomienia rzeczywistych płatności wymagane są aktualne dane Przelewy24, prawidłowy publiczny adres powrotu i webhooka, trwała baza danych, konfiguracja TomTom i wysyłki email oraz test transakcji w środowisku testowym. Status „opłacono” musi wynikać z poprawnie zweryfikowanego powiadomienia operatora płatności.
