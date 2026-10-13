# Weryfikacja nowego projektu — 13 października 2026

Projekt zastępuje poprzednią propozycję. Nowy interfejs ma jasny ekran startowy, pionowy formularz i osobne adresy stron rezerwacji. Wybór auta nie korzysta z modala.

- Klucz TomTom z oryginalnego projektu zweryfikowany bez ujawnienia wartości; skonfigurowany jako sekret serwera.
- `Opole` zwraca miejscowość. `Opole, Ozimska 2` zwraca `Ozimska 2, 45-057 Opole`.
- Rzeczywista trasa Kraków Airport → Ozimska 2: około 179,9 km i 105 min w chwili testu. Trasa powrotna również wyznaczana przez TomTom. Cena wynika z odzyskanego cennika.
- Test integracyjny `tests/live-maps.integration.mjs`: wyszukiwanie, routing, cena serwera i zapis testowej rezerwacji — zaliczone.
- 11 testów reguł i podpisów płatności — zaliczone.
- TypeScript i build — zaliczone.
- Przeglądarka: adres, wybór Premium na `/rezerwacja/samochod`, przejście do `/rezerwacja/dane`, odświeżenie oraz przyciski Wstecz/Dalej przywracają ekran i trasę.

Płatności pozostają testowe. Nie wykonano rzeczywistej płatności ani wysyłki e-maila.
