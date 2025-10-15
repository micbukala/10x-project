Oczywiście, oto zaktualizowana wersja z numeracją przepływów i myślnikami dla widoków:

# AI SciSum - aplikacja do generowania podsumowań artykułów naukowych

## 1. Przegląd struktury UI

Aplikacja będzie miała strukturę SPA z następującymi głównymi obszarami:
*   Autentykacja (modalne okna)
*   Dashboard (główny widok po zalogowaniu)
*   Generowanie AI (dedykowany widok)
*   Edytor podsumowań (dedykowany widok)
*   Nawigacja (sidebar desktop, hamburger mobile)

## 2. Lista widoków i ich cele

Zidentyfikowane widoki:
*   Strona logowania/rejestracji (modalne okna)
*   Dashboard z ekranem powitalnym (dla nowych użytkowników)
*   Dashboard z listą podsumowań (dla użytkowników z danymi)
*   Widok generowania AI
*   Widok edytora podsumowań
*   Widok resetowania hasła
*   Ustawienia konta (usuwanie konta)

**Komponenty wspólne:**
*   Nagłówek/Sidebar z licznikiem AI
*   Menu użytkownika
*   Toast notifications
*   Loading states
*   Error states

## 3. Podróż użytkownika - główne przepływy

### Przepływ 1: Nowy użytkownik tworzy pierwsze podsumowanie AI
1.  Landing → Rejestracja (modal)
2.  Auto-login + onboarding message
3.  Dashboard z ekranem powitalnym
4.  Klik "Stwórz podsumowanie AI"
5.  Widok generowania → wkleja tekst
6.  Klik "Generuj" → loading state
7.  Przekierowanie do edytora z wygenerowanym podsumowaniem
8.  Edycja (opcjonalna) → Zapisz
9.  Przekierowanie do Dashboard z listą (1 podsumowanie)

### Przepływ 2: Użytkownik tworzy manualne podsumowanie
1.  Dashboard
2.  Klik "Stwórz puste podsumowanie"
3.  Edytor z pustym szablonem (6 sekcji)
4.  Wypełnia sekcje i tytuł
5.  Zapisz
6.  Powrót do Dashboard

### Przepływ 3: Edycja istniejącego podsumowania
1.  Dashboard z listą
2.  Klik na kartę podsumowania lub "Edytuj"
3.  Edytor ładuje dane
4.  Modyfikacja treści (dirty flag aktywny)
5.  Zapisz → Toast success
6.  Możliwość kontynuacji edycji lub powrotu

### Przepływ 4: Usuwanie podsumowania
1.  Dashboard
2.  Klik "Usuń" na karcie
3.  Modal potwierdzenia
4.  Potwierdzenie → usunięcie
5.  Toast success + odświeżenie listy

### Przepływ 5: Osiągnięcie limitu AI
1.  Użytkownik ma 5/5 wykorzystanych generacji
2.  Licznik pokazuje 5/5, progress bar pełny
3.  Przycisk "Generuj AI" jest disabled
4.  Tooltip wyjaśnia limit i datę odnowienia
5.  Możliwość tworzenia manualnych podsumowań

### Przepływ 6: Reset hasła
1.  Modal logowania
2.  Klik "Zapomniałem hasła"
3.  Modal/widok z polem email
4.  Wysłanie linku → komunikat
5.  Email → klik w link
6.  Strona z formularzem nowego hasła
7.  Ustawienie hasła → sukces → logowanie

## 4. Struktura nawigacji

**Desktop:**
```text
┌─────────────┬──────────────────────────────────┐
│             │  Main Content Area               │
│  Sidebar    │                                  │
│  - Logo     │  [Dashboard / Generate / Editor] │
│  - Nowe     │                                  │
│    (drop)   │                                  │
│  - Licznik  │                                  │
│  - Avatar   │                                  │
│    (menu)   │                                  │
│             │                                  │
└─────────────┴──────────────────────────────────┘
```

**Mobile:**
```text
┌──────────────────────────────────┐
│ [☰] Logo    [3/5] [Avatar]      │
├──────────────────────────────────┤
│                                  │
│  Main Content Area               │
│  (full width)                    │
│                                  │
└──────────────────────────────────┘
```

**Drawer (po kliknięciu ☰):**
*   Nowe podsumowanie (AI/Manual)
*   Licznik szczegóły
*   Ustawienia konta
*   Wyloguj

## 5. Główna nawigacja

*   **Dashboard** (główna strona)
*   **Generowanie AI** (dedykowana ścieżka)
*   **Edytor** (dynamiczna ścieżka z ID)
*   **Ustawienia** (profil, usuwanie konta)

**Dropdown "Nowe podsumowanie":**
*   Generuj z AI
*   Stwórz ręcznie

**Menu użytkownika (avatar):**
*   Profil
*   Ustawienia
*   Wyloguj

## 6. Kluczowe komponenty dla każdego widoku

### Widok: Autentykacja (modalne okna)
-   **AuthModal** (Dialog Shadcn)
-   **LoginForm** (Input, Button)
-   **RegisterForm** (Input, Button)
-   **ResetPasswordForm** (Input, Button)
-   Form validation indicators
-   Loading states

### Widok: Dashboard - Welcome Screen
-   **WelcomeHero** (opis wartości)
-   **CTA Buttons** (2 przyciski)
-   **DemoSummary** (przykład struktury)

### Widok: Dashboard - Lista podsumowań
-   **SummaryList** (container)
-   **SummaryCard** (Card z: tytuł, data, badge AI/Manual, menu akcji)
-   **DropdownMenu** (Edytuj, Usuń)
-   **DeleteConfirmationDialog**
-   **EmptyState** (jeśli brak danych)

### Widok: Generowanie AI
**Desktop:**
-   Two-column layout
-   **Textarea** z autoskalowaniem
-   **CharCounter**
-   **ValidationMessage**
-   **StructurePreview** (statyczny)
-   **AIUsageCounter**
-   **GenerateButton**
-   **LoadingState** ("Generowanie...")

**Mobile:**
-   Single column
-   Przełącznik widoku (tekst/struktura)

### Widok: Edytor podsumowań
-   **StickyHeader** (tytuł edytowalny + przycisk Zapisz)
-   **Tabs** (6 sekcji)
-   **RichTextEditor** dla każdej sekcji
-   **DirtyFlagIndicator**
-   **SaveButton** (disabled gdy brak zmian)
-   **BeforeUnloadWarning**

### Komponenty wspólne
-   **Sidebar** (desktop)
-   **Header** (mobile)
-   **AIUsageCounter** (Progress + liczba)
-   **UserMenu** (Avatar + Dropdown)
-   **ToastNotification**
-   **LoadingSpinner**
-   **ErrorMessage**