# Podsumowanie architektury UI dla MVP - AI SciSum

## Decyzje projektowe

### Wizualizacja i nawigacja
1. **Licznik użycia AI**: Progress bar z reprezentacją liczbową (np. "3/5") w nagłówku, nieaktywny przycisk z tooltipem przy osiągnięciu limitu
2. **Struktura nawigacji**: Boczny pasek z logo, przyciskiem "Nowe podsumowanie" (dropdown AI/manualne), licznikiem AI i menu użytkownika. Menu hamburger na mobile
3. **Tryb ciemny**: Zaimplementowany w MVP z wykorzystaniem Tailwind dark mode

### Ekrany i komponenty
4. **Ekran powitalny**: Krótkie wyjaśnienie funkcji, dwa przyciski CTA ("Stwórz podsumowanie AI" i "Stwórz podsumowanie ręcznie"), skrócone demo podsumowania
5. **Interfejs generowania AI**: Dwukolumnowy layout - pole tekstowe po lewej (bez limitu maksymalnego, z autoskalowaniem), statyczny podgląd struktury po prawej ze wskaźnikiem długości tekstu
6. **Lista podsumowań**: Widok kart z metadanymi (tytuł, data, typ AI/manual), menu Edytuj/Usuń z potwierdzeniem. Brak sortowania/wyszukiwania w MVP
7. **Edytor podsumowań**: System zakładek dla 6 sekcji, prosty rich-text editor bez zewnętrznych bibliotek, stały nagłówek z edytowalnym tytułem i przyciskiem zapisu

### Przepływy i interakcje
8. **Autentykacja**: Modalne okna z przełączaniem (login/rejestracja/reset), komponenty Shadcn/ui z walidacją real-time, automatyczne logowanie po rejestracji z prostym onboardingiem
9. **Wskaźnik postępu**: Jednoetapowy komunikat "Generowanie podsumowania"
10. **Obsługa błędów**: System toast notifications z personalizacją na podstawie kodów błędów API
11. **Zarządzanie zmianami**: Manualny zapis z ostrzeżeniem o niezapisanych zmianach, brak autosave
12. **Reset limitu AI**: Automatyczny powrót do 0/5 bez specjalnego komunikatu
13. **Animacje**: Minimalistyczne podejście do transitions

### Responsywność
14. **Strategia mobile-first**: Tailwind breakpointy (sm: 640px, md: 768px, lg: 1024px)
15. **Optymalizacje mobile**: Ukryty boczny pasek, pełnoekranowy edytor z zakładkami, większe touch targets

## Architektura techniczna

### Stack technologiczny
- **Astro 5**: Framework dla statycznych elementów i routing
- **React 19**: Komponenty interaktywne
- **TypeScript 5**: Statyczne typowanie
- **Tailwind 4**: Stylowanie z dark mode
- **Shadcn/ui**: Biblioteka komponentów UI
- **Supabase**: Backend, autentykacja, PostgreSQL

### Kluczowe zasady
- Minimalizm technologiczny - brak dodatkowych bibliotek poza stackiem
- Najprostsze rozwiązania dla MVP
- Mobile-first design
- Dark mode od początku
- Minimalistyczne animacje

## Kluczowe widoki

### 1. Autentykacja
- Modalne okna React (login, rejestracja, reset hasła)
- Walidacja real-time z Zod schemas
- Post-rejestracja: auto-login + onboarding message: *"Witaj w AI SciSum! Możesz generować do 5 podsumowań AI miesięcznie. Zacznij od wklejenia treści artykułu lub stwórz notatki ręcznie."*

### 2. Dashboard

**Nowi użytkownicy** (ekran powitalny):
- Krótki opis wartości produktu
- Dwa przyciski CTA
- Przykładowe podsumowanie (skrócone demo 6 sekcji)

**Użytkownicy z danymi**:
- Lista kart podsumowań (tytuł, data, badge AI/Manual)
- Menu akcji na każdej karcie
- Chronologiczny układ bez sortowania

### 3. Generowanie AI

**Desktop**: Dwukolumnowy layout
- Lewa strona: Textarea z autoskalowaniem, licznik znaków, walidacja minimalnej długości
- Prawa strona: Statyczny podgląd struktury (6 sekcji)
- Licznik AI widoczny pod polem
- Stan ładowania: "Generowanie podsumowania..." ze spinnerem

**Mobile**: Pojedyncza kolumna z przełączaniem widoków

### 4. Edytor podsumowań

**Struktura**:
- Stały nagłówek: edytowalne pole tytułu + przycisk "Zapisz"
- 6 zakładek dla sekcji (Cel badań, Metody, Wyniki, Dyskusja, Otwarte pytania, Wnioski)
- Prosty rich-text editor dla każdej sekcji (formatowanie: pogrubienie, kursywa, listy)
- Dirty flag dla niezapisanych zmian
- Ostrzeżenie przed opuszczeniem z niezapisanymi zmianami

**Responsywność**:
- Desktop: zakładki poziome
- Mobile: zakładki pionowe lub dropdown selector

### 5. Nawigacja

**Desktop**: Boczny pasek zawiera:
- Logo/nazwa aplikacji
- Przycisk "Nowe podsumowanie" z dropdown
- Licznik AI z progress bar
- Menu użytkownika z avatar

**Mobile**: 
- Kompaktowy nagłówek (hamburger, logo, licznik, avatar)
- Drawer z nawigacją po kliknięciu hamburger

## Integracja z API

### Mapowanie endpoint → komponent
- `GET /api/users/me` → AIUsageCounter (mount, po generowaniu)
- `GET /api/users/ai-usage` → GenerateAIForm (przed submit)
- `GET /api/summaries` → SummaryList (mount, po CRUD)
- `GET /api/summaries/:id` → SummaryEditor (mount)
- `POST /api/summaries` → CreateManualForm (submit)
- `POST /api/summaries/generate-ai` → GenerateAIForm (submit)
- `PATCH /api/summaries/:id` → SummaryEditor (zapis)
- `DELETE /api/summaries/:id` → SummaryCard (delete)

### Zarządzanie stanem
- **Autentykacja**: Supabase Auth przez `context.locals.supabase`
- **Licznik AI**: React state, refresh po generacji, auto-reset miesięczny
- **Lista podsumowań**: Server-side rendering, opcjonalne optymistic updates
- **Edytor**: React state dla 6 sekcji, dirty flag, beforeunload listener
- **Toast**: React context z queue i auto-dismiss

### Obsługa błędów
Mapowanie kodów HTTP na user-friendly messages:
- 400: Nieprawidłowe dane
- 401: Sesja wygasła
- 403: Brak dostępu
- 404: Nie znaleziono
- 429: Limit AI wyczerpany
- 500: Błąd serwera

## Accessibility & Security

### Dostępność (WCAG 2.1 AA)
- Shadcn/ui z wbudowanym ARIA
- Keyboard navigation dla wszystkich interakcji
- Kontrast min 4.5:1 (normalny tekst), 3:1 (duży tekst)
- Screen reader support
- Focus management w modals

### Bezpieczeństwo
- JWT tokens przez Supabase Auth
- Protected routes przez Astro middleware
- Row-Level Security (RLS) w Supabase
- Input validation: Zod schemas (frontend + backend)
- CSRF protection przez Supabase session management
- Sanityzacja rich-text content przed zapisem

## Struktura komponentów

```
src/
├── components/
│   ├── ui/                    # Shadcn/ui (Button, Card, Dialog, Toast, Tabs, etc.)
│   ├── layout/                # Header, Sidebar, MobileMenu, Footer
│   ├── auth/                  # AuthModal, LoginForm, RegisterForm, ResetPasswordForm
│   ├── summaries/             # WelcomeScreen, SummaryList, SummaryCard, SummaryEditor, GenerateAIForm
│   ├── common/                # AIUsageCounter, LoadingIndicator, DarkModeToggle, CharCounter
│   └── hooks/                 # useAuth, useSummaries, useAIUsage, useDirtyFlag, useToast
├── pages/
│   ├── index.astro            # Dashboard
│   ├── generate.astro         # AI generation
│   ├── editor/[id].astro      # Edytor
│   └── api/                   # Existing endpoints
├── layouts/
│   └── Layout.astro           # Base layout z dark mode
├── lib/
│   └── services/
│       └── error.service.ts   # Error mapping
└── styles/
    └── global.css             # Tailwind + dark mode vars
```

## Komponenty Shadcn/ui

- **Button**: CTA, akcje, nawigacja
- **Card**: Lista podsumowań
- **Avatar**: Menu użytkownika
- **Dialog**: Auth modals, confirmations
- **Toast**: Notifications
- **Progress**: Licznik AI
- **Tabs**: Edytor sekcji
- **Textarea**: Pole tekstowe
- **Input**: Formularze
- **DropdownMenu**: Nowe podsumowanie, user menu
- **Tooltip**: Disabled buttons, hints
- **Badge**: AI/Manual labels
- **Separator**: Oddzielenie sekcji

## Kluczowe przepływy użytkownika

### 1. Nowy użytkownik → Pierwsze podsumowanie AI
Rejestracja → Auto-login → Onboarding → Welcome screen → Generate page → Wklej tekst → Generuj → Loading → Editor → Zapisz → Dashboard

### 2. Edycja istniejącego podsumowania
Dashboard → Klik "Edytuj" → Editor → Zmiana treści (dirty flag) → Zapisz → Toast success

### 3. Osiągnięcie limitu AI
Licznik 0/5 → Przycisk disabled → Tooltip o limicie → Możliwość utworzenia manualnego podsumowania

## Status nierozwiązanych kwestii

**BRAK** - wszystkie kwestie rozwiązane:
- ✅ Rich-text editor: prosty, bez zewnętrznych bibliotek
- ✅ Sortowanie/wyszukiwanie: nie w MVP
- ✅ Autosave: nie implementowane
- ✅ Onboarding: prosty komunikat tekstowy
- ✅ Przykładowe podsumowanie: skrócone demo
- ✅ Podgląd: statyczny + licznik znaków
- ✅ Limit tekstu: brak maksimum
- ✅ Reset limitu: automatyczny, cichy
- ✅ Animacje: minimalistyczne
- ✅ Dark mode: tak, w MVP

## Następne kroki implementacji

1. Setup projektu (Tailwind dark mode, Shadcn/ui)
2. Komponenty UI podstawowe
3. Autentykacja (modals, forms, Supabase)
4. Layout (sidebar, header, mobile menu, dark mode toggle)
5. Dashboard (welcome screen, lista)
6. Generowanie AI (form, walidacja, loading)
7. Edytor (tabs, rich-text, dirty flag)
8. Licznik AI (progress, API integration)
9. Toast system (notifications, error mapping)
10. Responsywność (testing mobile/tablet/desktop)
11. Accessibility audit
12. Dark mode testing
