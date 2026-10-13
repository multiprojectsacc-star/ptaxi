# Pochodzenie treści regulaminu i polityki prywatności

Plik `lib/legal-content.json` zawiera cztery istniejące teksty, odzyskane z poprzedniego projektu:

| Klucz | Plik źródłowy | Początek bloku |
| --- | --- | --- |
| `terms.pl` | `/Users/marco/Onesta Group/Personal taxi/www/src/pages/terms.tsx` | wiersz 292, `ref={RODO_PL}` |
| `terms.en` | ten sam plik | wiersz 50, `ref={RODO_EN}` |
| `privacy.pl` | `/Users/marco/Onesta Group/Personal taxi/www/src/pages/policy.tsx` | wiersz 524, `ref={RODO_PL}` |
| `privacy.en` | ten sam plik | wiersz 50, `ref={RODO_EN}` |

Usunięto wyłącznie znaczniki JSX/HTML, wcięcia i techniczne łamanie wierszy. Encje HTML zostały odkodowane, a znaczniki `br` zamienione na podziały akapitów. Tekst nie był aktualizowany, tłumaczony, skracany ani dostosowywany do nowej aplikacji.

## Status odzyskanych tekstów

- Polski regulamin wskazuje wejście w życie **31 października 2023 r.**
- Angielska wersja regulaminu kończy się na części VI. Polska zawiera również VII „Reklamacje”, VIII „Odpowiedzialność”, IX „Ochrona danych osobowych” i X „Postanowienia końcowe”. Nowy plik zachowuje ten stan; brakujących postanowień nie dopisano.
- Polityka prywatności opisuje między innymi konta użytkownika, nagrywanie rozmów, vouchery, marketing, cookies oraz różne formy płatności. Sama obecność tych zdań w tekście źródłowym nie dowodzi, że funkcje istnieją w nowej aplikacji.
- W źródłach występują różne adresy kontaktowe: stopka podaje `biuro@inter-dywiz.pl`, a regulamin między innymi `biuro@personaltaxi.pl`. Nie scalono ich arbitralnie w jeden nowy adres.
- Odzyskanie tekstów nie jest potwierdzeniem ich aktualności ani zgodności z nowym sposobem realizacji rezerwacji. Przed produkcyjnym uruchomieniem właściciel powinien dostarczyć zatwierdzone, spójne wersje PL i EN dla rzeczywistej usługi.

## Wykorzystanie w interfejsie

Teksty można wyświetlić jako zwykły tekst z zachowaniem akapitów. Nie wymagają renderowania HTML ani `dangerouslySetInnerHTML`. Import:

```ts
import legalContent from '@/lib/legal-content.json';

const text = legalContent.terms.pl;
```

W repozytorium zachowano treści źródłowe na potrzeby przeglądu i migracji. Aktualizacja ich merytorycznej zawartości powinna stanowić świadomą decyzję właściciela, a nie uboczny efekt zmiany projektu graficznego.
