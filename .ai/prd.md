```markdown
# Dokument wymagań produktu (PRD) - AI SciSum
## 1. Przegląd produktu
AI SciSum to aplikacja internetowa zaprojektowana w celu pomocy naukowcom, studentom i profesjonalistom w szybkim przyswajaniu kluczowych informacji z artykułów naukowych. Użytkownicy mogą wkleić tekst artykułu, aby otrzymać automatycznie wygenerowane, ustrukturyzowane podsumowanie. Aplikacja oferuje również możliwość manualnego tworzenia i edytowania notatek, a wszystkie podsumowania są przechowywane na koncie użytkownika w celu łatwego dostępu. Celem produktu jest znaczne skrócenie czasu potrzebnego na analizę literatury naukowej i poprawa efektywności pracy badawczej.

## 2. Problem użytkownika
Analiza artykułów naukowych jest procesem niezwykle czasochłonnym. Badacze i studenci często muszą przeglądać dziesiątki publikacji, aby znaleźć te najbardziej relevantne dla swojej pracy. Istniejące streszczenia (abstrakty) są często niewystarczające, ponieważ nie oddają pełnego kontekstu badań, metodologii czy kluczowych wyników, co może prowadzić do błędnej interpretacji i straty czasu. Brakuje narzędzia, które w szybki i ustrukturyzowany sposób przedstawiałoby esencję artykułu, pozwalając użytkownikowi na świadomą decyzję o dalszej, dogłębnej lekturze.

## 3. Wymagania funkcjonalne
*   System Kont Użytkowników:
    *   Rejestracja użytkownika za pomocą adresu e-mail i hasła.
    *   Logowanie i wylogowywanie.
    *   Funkcjonalność resetowania zapomnianego hasła.
    *   Możliwość trwałego usunięcia konta wraz ze wszystkimi powiązanymi danymi.
*   Generowanie Podsumowań przez AI:
    *   Pole tekstowe do wklejenia pełnej treści artykułu naukowego.
    *   Generowanie podsumowania przez AI o predefiniowanej strukturze (Cel badań, Metody, Wyniki, Dyskusja, Otwarte pytania, Wnioski).
    *   Automatyczne generowanie edytowalnego tytułu podsumowania na podstawie treści.
    *   Wyświetlanie komunikatu o statusie podczas przetwarzania tekstu.
*   Manualne Tworzenie Podsumowań:
    *   Możliwość stworzenia pustego szablonu podsumowania z gotową strukturą do ręcznego wypełnienia.
*   Zarządzanie Podsumowaniami:
    *   Panel użytkownika z listą wszystkich zapisanych podsumowań.
    *   Możliwość przeglądania, edycji i usuwania istniejących podsumowań.
*   Edytor Podsumowań:
    *   Edytor tekstu (WYSIWYG) do modyfikacji treści podsumowań (zarówno wygenerowanych przez AI, jak i tworzonych manualnie).
    *   Możliwość zapisania zmian w podsumowaniu.
    *   Ostrzeżenie przeglądarki przy próbie opuszczenia strony z niezapisanymi zmianami.
*   Limit Użycia:
    *   Limit 5 podsumowań generowanych przez AI na użytkownika miesięcznie.
    *   Widoczny licznik pokazujący aktualne wykorzystanie limitu (np. "3/5").
    *   Blokada funkcji generowania po wyczerpaniu limitu z odpowiednim komunikatem.
*   Obsługa Błędów:
    *   Wyświetlanie zrozumiałych komunikatów dla użytkownika w przypadku problemów z generowaniem podsumowania (np. błąd API).
*   Wymagania prawne i ograniczenia:
    *   Dane osobowe użytkowników i podsumowań przechowywane zgodnie z RODO

## 4. Granice produktu
### Co wchodzi w zakres MVP
*   Pełna funkcjonalność systemu kont użytkowników (rejestracja, logowanie, reset hasła, usuwanie konta).
*   Generowanie podsumowań wyłącznie z tekstu wklejanego przez użytkownika.
*   Manualne tworzenie podsumowań od zera.
*   Przeglądanie, edycja (w edytorze WYSIWYG) i usuwanie podsumowań.
*   Limit 5 generacji AI na użytkownika miesięcznie.
*   Aplikacja dostępna wyłącznie w wersji webowej.
*   Ekran powitalny dla nowych użytkowników zamiast pustej listy.

### Co NIE wchodzi w zakres MVP
*   Import artykułów za pomocą identyfikatora DOI lub przez wgrywanie plików (np. PDF).
*   Automatyczne parsowanie i czyszczenie wklejonego tekstu.
*   System tagowania i filtrowania podsumowań.
*   Współdzielenie podsumowań lub kolekcji między użytkownikami.
*   Załączanie i wyświetlanie figur, tabel czy grafik z artykułów.
*   Dedykowane aplikacje mobilne (iOS, Android).
*   Formalny samouczek (onboarding) krok po kroku.
*   Funkcja automatycznego zapisu w edytorze.

## 5. Historyjki użytkowników
### Zarządzanie Kontem
*   ID: US-001
*   Tytuł: Rejestracja nowego użytkownika
*   Opis: Jako nowy użytkownik, chcę móc założyć konto za pomocą mojego adresu e-mail i hasła, aby móc zapisywać i zarządzać moimi podsumowaniami.
*   Kryteria akceptacji:
    *   Formularz rejestracji zawiera pola na adres e-mail, hasło i potwierdzenie hasła.
    *   System waliduje poprawność formatu adresu e-mail.
    *   System wymaga, aby hasła w obu polach były identyczne.
    *   Po pomyślnej rejestracji jestem automatycznie zalogowany i przekierowany do panelu głównego.
    *   W przypadku, gdy e-mail jest już zajęty, wyświetlany jest odpowiedni komunikat błędu.

*   ID: US-002
*   Tytuł: Logowanie użytkownika
*   Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto, podając e-mail i hasło, aby uzyskać dostęp do moich zapisanych podsumowań.
*   Kryteria akceptacji:
    *   Formularz logowania zawiera pola na adres e-mail i hasło.
    *   Po pomyślnym zalogowaniu jestem przekierowywany do panelu z listą moich podsumowań.
    *   W przypadku podania błędnych danych logowania, wyświetlany jest stosowny komunikat.

*   ID: US-003
*   Tytuł: Resetowanie hasła
*   Opis: Jako zarejestrowany użytkownik, który zapomniał hasła, chcę móc zresetować swoje hasło poprzez e-mail, aby odzyskać dostęp do konta.
*   Kryteria akceptacji:
    *   Na stronie logowania znajduje się link "Zapomniałem hasła".
    *   Po jego kliknięciu i podaniu mojego adresu e-mail, otrzymuję na skrzynkę wiadomość z linkiem do resetu hasła.
    *   Link jest unikalny i ma ograniczony czas ważności.
    *   Po kliknięciu w link jestem przekierowany na stronę, gdzie mogę ustawić nowe hasło.

*   ID: US-004
*   Tytuł: Usuwanie konta
*   Opis: Jako użytkownik, chcę mieć możliwość trwałego usunięcia mojego konta i wszystkich moich danych z systemu.
*   Kryteria akceptacji:
    *   W ustawieniach konta znajduje się opcja "Usuń konto".
    *   Po kliknięciu przycisku system prosi o potwierdzenie decyzji (np. poprzez modal lub wpisanie hasła).
    *   Po potwierdzeniu moje konto oraz wszystkie moje podsumowania są trwale usuwane z bazy danych.

### Tworzenie i Zarządzanie Podsumowaniami
*   ID: US-005
*   Tytuł: Generowanie podsumowania przez AI
*   Opis: Jako zalogowany użytkownik, chcę wkleić tekst artykułu naukowego i wygenerować jego ustrukturyzowane podsumowanie, aby szybko zrozumieć jego treść.
*   Kryteria akceptacji:
    *   Na stronie głównej znajduje się pole tekstowe do wklejenia treści.
    *   Po wklejeniu tekstu i kliknięciu przycisku "Generuj podsumowanie", wyświetlany jest komunikat 'Trwa analiza tekstu i generowanie podsumowania...'.
    *   Po zakończeniu procesu jestem przekierowany do widoku edytora z wygenerowanym podsumowaniem.
    *   Podsumowanie zawiera sekcje: Cel badań, Metody, Wyniki, Dyskusja, Otwarte pytania, Wnioski.
    *   Tytuł podsumowania jest generowany automatycznie i jest edytowalny.
    *   Licznik użycia AI zostaje zaktualizowany (zmniejszony o 1).

*   ID: US-006
*   Tytuł: Manualne tworzenie podsumowania
*   Opis: Jako zalogowany użytkownik, chcę móc stworzyć puste, ustrukturyzowane podsumowanie, aby samodzielnie wypełnić je notatkami.
*   Kryteria akceptacji:
    *   Na stronie głównej znajduje się przycisk "Stwórz puste podsumowanie".
    *   Po jego kliknięciu jestem przekierowany do widoku edytora z pustym szablonem podsumowania.
    *   Szablon zawiera puste sekcje: Cel badań, Metody, Wyniki, Dyskusja, Otwarte pytania, Wnioski oraz puste pole na tytuł.

*   ID: US-007
*   Tytuł: Edycja i zapisywanie podsumowania
*   Opis: Jako użytkownik, chcę móc edytować treść każdej sekcji podsumowania oraz jego tytuł, a następnie zapisać zmiany.
*   Kryteria akceptacji:
    *   W widoku edytora mogę modyfikować tekst we wszystkich polach.
    *   Przycisk "Zapisz" jest aktywny, gdy wprowadzę jakieś zmiany.
    *   Po kliknięciu "Zapisz" zmiany są trwale zapisywane w bazie danych, a ja pozostaję w widoku edycji z komunikatem potwierdzającym zapis.

*   ID: US-008
*   Tytuł: Wyświetlanie listy podsumowań
*   Opis: Jako zalogowany użytkownik, chcę widzieć listę wszystkich moich zapisanych podsumowań, aby móc łatwo do nich wrócić.
*   Kryteria akceptacji:
    *   Panel główny wyświetla listę wszystkich moich podsumowań.
    *   Każdy element listy zawiera tytuł podsumowania.
    *   Kliknięcie na element listy przenosi mnie do widoku edycji danego podsumowania.
    *   Jeśli nie mam żadnych podsumowań, widzę ekran powitalny z wezwaniem do działania "Stwórz swoje pierwsze podsumowanie".

*   ID: US-009
*   Tytuł: Usuwanie podsumowania
*   Opis: Jako użytkownik, chcę móc usunąć wybrane podsumowanie z mojej listy.
*   Kryteria akceptacji:
    *   Na liście podsumowań przy każdym elemencie znajduje się opcja "Usuń".
    *   Po kliknięciu system prosi o potwierdzenie usunięcia.
    *   Po potwierdzeniu podsumowanie jest trwale usuwane z mojej listy i z bazy danych.

### Ograniczenia i Scenariusze Brzegowe
*   ID: US-010
*   Tytuł: Zarządzanie limitem użycia AI
*   Opis: Jako użytkownik, chcę być informowany o moim miesięcznym limicie generowania podsumowań przez AI i co się stanie po jego wyczerpaniu.
*   Kryteria akceptacji:
    *   W interfejsie widoczny jest licznik mojego zużycia, np. "Wykorzystano w tym miesiącu: 3/5".
    *   Gdy limit zostanie wyczerpany (5/5), przycisk "Generuj podsumowanie" staje się nieaktywny.
    *   Po najechaniu na nieaktywny przycisk wyświetla się tooltip wyjaśniający, że limit został osiągnięty i kiedy zostanie odnowiony.

*   ID: US-011
*   Tytuł: Obsługa błędów generowania AI
*   Opis: Jako użytkownik, w przypadku problemu technicznego podczas generowania podsumowania, chcę otrzymać jasny komunikat o błędzie.
*   Kryteria akceptacji:
    *   Jeśli API AI zwróci błąd, proces generowania zostaje przerwany.
    *   Użytkownikowi wyświetlany jest zrozumiały komunikat, np. "Nie udało się wygenerować podsumowania. Spróbuj ponownie później."
    *   Licznik użycia AI nie zostaje zmniejszony w przypadku nieudanej próby.

*   ID: US-012
*   Tytuł: Ostrzeżenie przed utratą niezapisanych zmian
*   Opis: Jako użytkownik, który wprowadził zmiany w edytorze i próbuje opuścić stronę bez zapisywania, chcę zobaczyć ostrzeżenie, aby uniknąć przypadkowej utraty pracy.
*   Kryteria akceptacji:
    *   Jeśli w edytorze są niezapisane zmiany, próba zamknięcia karty/przeglądarki lub nawigacji do innej strony wywołuje standardowe ostrzeżenie przeglądarki.
    *   Ostrzeżenie daje mi wybór, czy chcę opuścić stronę, czy na niej pozostać.

## 6. Metryki sukcesu
*   Wskaźnik Akceptacji AI: 75% podsumowań wygenerowanych przez AI jest akceptowanych przez użytkownika.
    *   Sposób pomiaru: Będziemy to mierzyć przez analizę zapisów podsumowań. Podsumowanie zostanie sklasyfikowane jako "zaakceptowane", jeśli użytkownik zapisze je, dokonując edycji mniej niż 15% jego oryginalnej treści (mierzone liczbą znaków).
*   Wskaźnik Adopcji AI: 75% wszystkich tworzonych podsumowań jest inicjowanych z użyciem funkcji AI.
    *   Sposób pomiaru: W momencie tworzenia podsumowania w bazie danych zostanie zapisana flaga (`created_by: "ai"` lub `created_by: "manual"`). Metryka będzie obliczana jako stosunek podsumowań z flagą "ai" do wszystkich utworzonych podsumowań.
```