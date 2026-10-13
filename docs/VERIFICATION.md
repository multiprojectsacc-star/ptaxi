# Weryfikacja — 13 października 2026

- 11 testów jednostkowych reguł rezerwacji i podpisów P24: zaliczone.
- TypeScript bez błędów; build Vinext zakończony powodzeniem.
- Test API demo: trasa Zakopane 112,4 km, brak limitu 60 km, wycena 793 zł dla vana, odrzucenie zbyt małego auta i terminu poniżej 16 h, odrzucenie podmienionego ID adresu, cena i status ustalone przez serwer, zapis kompletu danych, brak podwójnej rezerwacji, odczyt przez losowy token, blokada callbacku w demo.
- Przeglądarka: wyszukanie Hotelu Starego, wybór Premium 169 zł, formularz pasażera, podsumowanie, zapis rezerwacji demonstracyjnej i odczyt po pełnym odświeżeniu.
- Widoki 390 × 844 i 1440 × 1000: brak poziomego przepełnienia w widoku mobilnym, wszystkie obrazy załadowane; sprawdzony przełącznik PL/EN.
- `tests/api-smoke.mjs` uruchamiać wyłącznie na trybie demo, po migracji lokalnej D1.

Nie wykonano prawdziwej płatności, zapytania produkcyjnego TomTom ani wysyłki przez Resend. Integracje wymagają konfiguracji środowiska i próby P24 sandbox przed udostępnieniem rzeczywistych rezerwacji.

Obraz `public/images/airport-transfer.png` został wygenerowany przez ImageGen na potrzeby tej propozycji; jest ilustracją transferu, nie dokumentacją faktycznej floty lub terminalu. Logo i zdjęcia klas pojazdów pochodzą z dostarczonego projektu.
