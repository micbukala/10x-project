# Plan implementacji widoku Dashboard - Welcome Screen

## 1. Przegląd

Widok Dashboard Welcome Screen to ekran powitalny wyświetlany nowym użytkownikom aplikacji AI SciSum, którzy nie mają jeszcze żadnych zapisanych podsumowań. Jego głównym celem jest:
- Przedstawienie wartości aplikacji i jej możliwości
- Zademonstruowanie struktury podsumowania (6 sekcji)
- Zachęcenie użytkownika do utworzenia pierwszego podsumowania poprzez wyraźne przyciski Call-to-Action
- Ułatwienie pierwszych kroków w aplikacji bez formalnego tutoriala

Widok zastępuje pustą listę podsumowań i jest automatycznie ukrywany po utworzeniu pierwszego podsumowania.

## 2. Routing widoku

Widok nie ma dedykowanej ścieżki - jest częścią głównego Dashboard pod ścieżką `/dashboard` (lub `/` po zalogowaniu).

**Logika wyświetlania:**
- Dashboard sprawdza liczbę podsumowań użytkownika
- Jeśli `summaries.length === 0` → renderuje `DashboardWelcomeScreen`
- Jeśli `summaries.length > 0` → renderuje `SummaryList`

**Nawigacja z widoku:**
- Przycisk "Generuj podsumowanie AI" → `/generate-ai`
- Przycisk "Stwórz ręcznie" → `/editor/new`

## 3. Struktura komponentów

```
Dashboard (Astro Page - /src/pages/dashboard.astro)
└── DashboardContent (React - warunkowe renderowanie)
    ├── [jeśli summaries.length === 0]
    │   └── DashboardWelcomeScreen (React Container)
    │       ├── WelcomeHero (Astro - statyczny)
    │       │   ├── Heading (h1)
    │       │   ├── Description (p)
    │       │   └── FeaturesList (ul)
    │       ├── CTAButtons (React - interaktywne)
    │       │   ├── Button "Generuj podsumowanie AI" (Shadcn/ui)
    │       │   └── Button "Stwórz ręcznie" (Shadcn/ui)
    │       └── DemoSummary (Astro - statyczny)
    │           └── Card (Shadcn/ui)
    │               ├── CardHeader (tytuł demo)
    │               └── CardContent (6 sekcji)
    └── [jeśli summaries.length > 0]
        └── SummaryList (implementacja w przyszłości)
```

## 4. Szczegóły komponentów

### DashboardWelcomeScreen (React Container)

**Opis:** Główny komponent kontenerowy organizujący układ ekranu powitalnego. Odpowiada za układ strony i kompozycję podkomponentów.

**Główne elementy:**
- Kontener główny: `<div>` z klasami Tailwind do centrowania i responsive layout
- Sekcja hero z opisem wartości
- Sekcja z przyciskami CTA
- Sekcja z przykładem struktury podsumowania

**Obsługiwane interakcje:**
- Brak bezpośrednich - deleguje do komponentów potomnych

**Obsługiwana walidacja:**
- Brak - komponent prezentacyjny

**Typy:**
```typescript
interface DashboardWelcomeScreenProps {
  aiUsage: UserAiUsageDTO;
}
```

**Propsy:**
- `aiUsage: UserAiUsageDTO` - dane o wykorzystaniu AI przekazywane do CTAButtons

---

### WelcomeHero (Astro - statyczny)

**Opis:** Sekcja hero wyświetlająca wartość aplikacji i jej główne funkcje. Zawiera tytuł, opis i listę kluczowych możliwości.

**Główne elementy:**
- `<h1>` - główny nagłówek "Zacznij swoją naukową podróż z AI SciSum"
- `<p>` - opis wartości aplikacji
- `<ul>` - lista funkcji/korzyści:
  - Automatyczne generowanie podsumowań z AI
  - Ręczne tworzenie i edycja notatek
  - Ustrukturyzowany format (6 sekcji)
  - Bezpieczne przechowywanie w chmurze

**Obsługiwane interakcje:**
- Brak (komponent statyczny)

**Obsługiwana walidacja:**
- Brak

**Typy:**
- Brak (statyczna treść)

**Propsy:**
- Brak

---

### CTAButtons (React)

**Opis:** Sekcja z dwoma głównymi przyciskami akcji umożliwiającymi utworzenie pierwszego podsumowania. Obsługuje nawigację i sprawdza dostępność funkcji AI.

**Główne elementy:**
- Kontener: `<div>` z układem flex/grid dla responsive design
- Button 1: "Generuj podsumowanie AI" (Shadcn/ui Button - variant="default")
  - Ikona: AI/Sparkles icon
  - Badge z licznikiem: "{remaining}/5 dostępnych"
- Button 2: "Stwórz ręcznie" (Shadcn/ui Button - variant="outline")
  - Ikona: Edit/PencilLine icon

**Obsługiwane interakcje:**
- `onClick` Button 1 → nawigacja do `/generate-ai`
- `onClick` Button 2 → nawigacja do `/editor/new`
- `onMouseEnter` (disabled Button 1) → pokazanie Tooltip z informacją o limicie

**Obsługiwana walidacja:**
- Sprawdzenie `aiUsage.can_generate`:
  - `true` → Button 1 aktywny
  - `false` → Button 1 disabled z Tooltip "Limit generacji wyczerpany. Odnowienie: {reset_date}"
- Sprawdzenie `aiUsage.remaining_generations`:
  - Wyświetlenie liczby w badge

**Typy:**
```typescript
interface CTAButtonsProps {
  aiUsage: UserAiUsageDTO;
  isLoading?: boolean;
}
```

**Propsy:**
- `aiUsage: UserAiUsageDTO` - dane o limicie AI
- `isLoading?: boolean` - stan ładowania (opcjonalny)

---

### DemoSummary (Astro - statyczny)

**Opis:** Komponent prezentujący przykładową strukturę podsumowania naukowego. Pokazuje wszystkie 6 sekcji z krótkimi przykładowymi tekstami, aby użytkownik rozumiał, czego się spodziewać.

**Główne elementy:**
- Card (Shadcn/ui) jako kontener
- CardHeader:
  - CardTitle: "Przykładowa struktura podsumowania"
  - CardDescription: "Każde podsumowanie zawiera 6 standardowych sekcji"
- CardContent:
  - 6 sekcji, każda z:
    - `<h3>` - etykieta sekcji (np. "Cel badań")
    - `<p>` - przykładowy tekst (2-3 zdania)

**Sekcje demo (w kolejności):**
1. **Cel badań** - przykład: "Celem badania było określenie wpływu..."
2. **Metody** - przykład: "Wykorzystano metodę eksperymentalną z grupą kontrolną..."
3. **Wyniki** - przykład: "Zaobserwowano statystycznie istotny wzrost..."
4. **Dyskusja** - przykład: "Wyniki sugerują, że..."
5. **Otwarte pytania** - przykład: "Dalsze badania powinny zbadać..."
6. **Wnioski** - przykład: "Badanie potwierdza hipotezę..."

**Obsługiwane interakcje:**
- Brak (komponent read-only)

**Obsługiwana walidacja:**
- Brak

**Typy:**
```typescript
// Statyczna struktura - typ referencyjny
type DemoSection = {
  key: keyof SummaryContentDTO;
  label: string;
  preview: string;
};
```

**Propsy:**
- Brak (statyczna treść hardcoded)

---

### Dashboard (Astro Page - komponent nadrzędny)

**Opis:** Główna strona Dashboard odpowiedzialna za pobieranie danych i warunkowe renderowanie Welcome Screen lub SummaryList.

**Główne elementy:**
- Layout wrapper
- Sidebar/Header (nawigacja)
- Główna sekcja z warunkowym renderowaniem:
  - Loading state (Spinner)
  - Error state (komunikat błędu)
  - DashboardWelcomeScreen (jeśli brak podsumowań)
  - SummaryList (jeśli są podsumowania)

**Obsługiwane interakcje:**
- Obsługa stanu ładowania
- Obsługa błędów API
- Przekazywanie danych do komponentów potomnych

**Obsługiwana walidacja:**
- Sprawdzenie `summaries.length`:
  - `=== 0` → renderuj WelcomeScreen
  - `> 0` → renderuj SummaryList
- Sprawdzenie autoryzacji (middleware)

**Typy:**
```typescript
interface DashboardState {
  summaries: SummaryListItemDTO[];
  aiUsage: UserAiUsageDTO;
  isLoading: boolean;
  error: ApiErrorDTO | null;
}
```

**Propsy:**
- Brak (strona Astro pobiera dane server-side lub w useEffect)

## 5. Typy

### Istniejące typy z types.ts (wykorzystywane):

```typescript
// Odpowiedź z listy podsumowań
interface SummaryListResponseDTO {
  summaries: SummaryListItemDTO[];
  pagination: PaginationDTO;
}

// Pojedyncze podsumowanie w liście
interface SummaryListItemDTO {
  id: string;
  title: string;
  creation_type: Enums<"summary_creation_type">;
  ai_model_name: string | null;
  created_at: string;
  updated_at: string;
}

// Struktura zawartości podsumowania (referencja dla demo)
interface SummaryContentDTO {
  research_objective: string;
  methods: string;
  results: string;
  discussion: string;
  open_questions: string;
  conclusions: string;
}

// Dane o wykorzystaniu AI
interface UserAiUsageDTO {
  can_generate: boolean;
  usage_count: number;
  monthly_limit: number;
  remaining_generations: number;
  period_start: string;
  period_end: string;
}

// Standardowy błąd API
interface ApiErrorDTO {
  error: {
    code: ApiErrorCode;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
  };
}
```

### Nowe typy ViewModel (do utworzenia):

```typescript
// Propsy dla DashboardWelcomeScreen
interface DashboardWelcomeScreenProps {
  aiUsage: UserAiUsageDTO;
}

// Propsy dla CTAButtons
interface CTAButtonsProps {
  aiUsage: UserAiUsageDTO;
  isLoading?: boolean;
}

// Stan Dashboard (zarządzanie lokalne)
interface DashboardState {
  summaries: SummaryListItemDTO[];
  aiUsage: UserAiUsageDTO | null;
  isLoading: boolean;
  error: ApiErrorDTO | null;
}

// Statyczne demo podsumowania (hardcoded content)
interface DemoSummarySection {
  key: keyof SummaryContentDTO;
  label: string;
  preview: string;
}

// Konfiguracja Demo Summary
const DEMO_SUMMARY_SECTIONS: DemoSummarySection[] = [
  {
    key: 'research_objective',
    label: 'Cel badań',
    preview: 'Celem badania było określenie wpływu...'
  },
  // ... pozostałe sekcje
];
```

## 6. Zarządzanie stanem

### Strategia zarządzania stanem:

**Poziom Dashboard (rodzic):**
- Stan lokalny React (useState) dla:
  - `summaries: SummaryListItemDTO[]` - lista podsumowań
  - `aiUsage: UserAiUsageDTO | null` - dane o limicie AI
  - `isLoading: boolean` - stan ładowania
  - `error: ApiErrorDTO | null` - błędy API

**Poziom Welcome Screen (dziecko):**
- Brak własnego stanu
- Otrzymuje dane przez propsy od Dashboard
- Komponenty Astro (WelcomeHero, DemoSummary) są statyczne

**Poziom CTAButtons (dziecko):**
- Minimalny lokalny stan:
  - `isNavigating: boolean` - stan podczas nawigacji (opcjonalny)

### Custom Hook: useDashboardData

**Lokalizacja:** `/src/components/hooks/useDashboardData.ts`

**Cel:** Centralizacja logiki pobierania danych dla Dashboard

**Interfejs:**
```typescript
function useDashboardData() {
  return {
    summaries: SummaryListItemDTO[];
    aiUsage: UserAiUsageDTO | null;
    isLoading: boolean;
    error: ApiErrorDTO | null;
    refetch: () => Promise<void>;
  };
}
```

**Implementacja:**
- Równoległe wywołania API: `GET /api/summaries` i `GET /api/users/ai-usage`
- Użycie `Promise.all()` dla optymalnej wydajności
- Obsługa błędów dla każdego endpointu niezależnie
- Automatyczne wywołanie przy montowaniu komponentu
- Funkcja `refetch()` dla manualnego odświeżenia

**Przykład użycia:**
```typescript
const { summaries, aiUsage, isLoading, error } = useDashboardData();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

return summaries.length === 0 
  ? <DashboardWelcomeScreen aiUsage={aiUsage} />
  : <SummaryList summaries={summaries} />;
```

## 7. Integracja API

### API Call 1: Pobieranie listy podsumowań

**Endpoint:** `GET /api/summaries`

**Query Parameters:**
```typescript
{
  page: 1,
  limit: 10,
  sort: 'created_at',
  order: 'desc'
}
```

**Request Type:** Brak body, tylko query params

**Response Type:** `SummaryListResponseDTO`
```typescript
{
  summaries: SummaryListItemDTO[],
  pagination: PaginationDTO
}
```

**Wykorzystanie odpowiedzi:**
- `summaries.length === 0` → wyświetl Welcome Screen
- `summaries.length > 0` → wyświetl SummaryList

**Obsługa błędów:**
- 401 Unauthorized → redirect do logowania
- 500 Server Error → wyświetl komunikat błędu z przyciskiem retry
- Network Error → wyświetl komunikat offline

---

### API Call 2: Pobieranie danych o wykorzystaniu AI

**Endpoint:** `GET /api/users/ai-usage`

**Request Type:** Brak parametrów

**Response Type:** `UserAiUsageDTO`
```typescript
{
  can_generate: boolean,
  usage_count: number,
  monthly_limit: number,
  remaining_generations: number,
  period_start: string,
  period_end: string
}
```

**Wykorzystanie odpowiedzi:**
- `can_generate === false` → disable przycisk "Generuj AI"
- `remaining_generations` → wyświetl w badge na przycisku
- `period_end` → wyświetl w Tooltip jako data odnowienia

**Obsługa błędów:**
- Jeśli API zwróci błąd → ustaw `can_generate = false` (bezpieczne domyślnie)
- Pokaż komunikat w Tooltip: "Sprawdzanie limitu niedostępne"

---

### Strategia równoległych wywołań:

```typescript
const fetchDashboardData = async () => {
  try {
    const [summariesRes, aiUsageRes] = await Promise.all([
      fetch('/api/summaries?page=1&limit=10'),
      fetch('/api/users/ai-usage')
    ]);
    
    const summaries = await summariesRes.json();
    const aiUsage = await aiUsageRes.json();
    
    return { summaries: summaries.summaries, aiUsage };
  } catch (error) {
    // handle error
  }
};
```

## 8. Interakcje użytkownika

### Interakcja 1: Kliknięcie "Generuj podsumowanie AI"

**Trigger:** Użytkownik klika przycisk "Generuj podsumowanie AI"

**Warunek wstępny:** 
- `aiUsage.can_generate === true`
- `aiUsage.remaining_generations > 0`

**Przebieg:**
1. Użytkownik klika przycisk
2. Event handler: `onClick={() => navigate('/generate-ai')}`
3. Nawigacja do widoku generowania AI
4. (Opcjonalnie) Stan loading podczas nawigacji

**Feedback wizualny:**
- Hover state: zmiana koloru przycisku
- Active state: wciśnięcie przycisku
- (Opcjonalnie) Loading spinner podczas nawigacji
- Smooth transition (Astro View Transitions API)

**Obsługa przypadków brzegowych:**
- Jeśli `can_generate === false`:
  - Przycisk disabled
  - Tooltip: "Limit wyczerpany. Odnowienie: {period_end}"
  - Cursor: not-allowed

---

### Interakcja 2: Kliknięcie "Stwórz ręcznie"

**Trigger:** Użytkownik klika przycisk "Stwórz ręcznie"

**Warunek wstępny:** Brak (zawsze dostępne)

**Przebieg:**
1. Użytkownik klika przycisk
2. Event handler: `onClick={() => navigate('/editor/new')}`
3. Nawigacja do edytora z pustym szablonem

**Feedback wizualny:**
- Hover state: zmiana stylu outline button
- Active state: wciśnięcie
- Smooth transition

---

### Interakcja 3: Hover nad disabled "Generuj AI"

**Trigger:** Najechanie myszą na disabled przycisk

**Warunek:** `can_generate === false`

**Przebieg:**
1. Użytkownik najeżdża na disabled przycisk
2. Wyświetla się Tooltip (Shadcn/ui)
3. Tooltip zawiera:
   - "Limit generacji wyczerpany"
   - "Wykorzystano: {usage_count}/{monthly_limit}"
   - "Odnowienie: {formatted_period_end}"

**Feedback wizualny:**
- Tooltip pojawia się z animacją fade-in
- Pozycjonowanie: nad przyciskiem (top)
- Kursor: not-allowed

---

### Interakcja 4: Przeglądanie Demo Summary

**Trigger:** Użytkownik scrolluje do sekcji DemoSummary

**Warunek:** Brak

**Przebieg:**
1. Użytkownik scrolluje lub widzi sekcję
2. Odczytuje przykładową strukturę podsumowania
3. Rozumie, czego się spodziewać po utworzeniu podsumowania

**Feedback wizualny:**
- Statyczny wyświetlacz (brak interakcji)
- (Opcjonalnie) Subtle fade-in animation przy scroll

## 9. Warunki i walidacja

### Warunek 1: Wyświetlanie Welcome Screen (Dashboard)

**Opis:** Decyzja, czy pokazać Welcome Screen czy SummaryList

**Weryfikacja:**
```typescript
summaries.length === 0
```

**Źródło danych:** Response z `GET /api/summaries`

**Wpływ na UI:**
- `true` → renderuj `<DashboardWelcomeScreen />`
- `false` → renderuj `<SummaryList />`

**Komponent:** Dashboard (główna strona)

---

### Warunek 2: Dostępność przycisku "Generuj AI" (CTAButtons)

**Opis:** Czy użytkownik może używać funkcji generowania AI

**Weryfikacja:**
```typescript
aiUsage.can_generate === true && aiUsage.remaining_generations > 0
```

**Źródło danych:** Response z `GET /api/users/ai-usage`

**Wpływ na UI:**
- `true` → przycisk aktywny (enabled)
- `false` → przycisk nieaktywny (disabled) + Tooltip z wyjaśnieniem

**Komponent:** CTAButtons

---

### Warunek 3: Wyświetlanie licznika generacji (CTAButtons)

**Opis:** Pokazanie użytkownikowi pozostałych generacji

**Weryfikacja:**
```typescript
aiUsage.remaining_generations >= 0
```

**Źródło danych:** `UserAiUsageDTO.remaining_generations`

**Wpływ na UI:**
- Wyświetl badge na przycisku: "{remaining_generations}/5 dostępnych"
- Kolor badge:
  - `remaining > 2` → zielony/normalny
  - `remaining <= 2` → żółty (warning)
  - `remaining === 0` → czerwony (danger)

**Komponent:** CTAButtons

---

### Warunek 4: Stan ładowania (Dashboard)

**Opis:** Wyświetlanie loading state podczas pobierania danych

**Weryfikacja:**
```typescript
isLoading === true
```

**Źródło danych:** Stan lokalny podczas wywołań API

**Wpływ na UI:**
- `true` → wyświetl `<LoadingSpinner />` lub skeleton
- `false` → wyświetl właściwą zawartość

**Komponent:** Dashboard

---

### Warunek 5: Stan błędu (Dashboard)

**Opis:** Obsługa błędów z API

**Weryfikacja:**
```typescript
error !== null
```

**Źródło danych:** Catch block podczas wywołań API

**Wpływ na UI:**
- `true` → wyświetl `<ErrorMessage error={error} />` z przyciskiem retry
- `false` → wyświetl normalną zawartość

**Komponent:** Dashboard

## 10. Obsługa błędów

### Błąd 1: Niepowodzenie GET /api/summaries

**Scenariusz:** API zwraca błąd podczas pobierania listy podsumowań

**Możliwe kody błędów:**
- `401 UNAUTHORIZED` - wygasła sesja
- `500 INTERNAL_ERROR` - błąd serwera
- Network error - brak połączenia

**Obsługa:**
```typescript
if (error.code === 'UNAUTHORIZED') {
  // Redirect do logowania
  navigate('/login');
  return;
}

// Inne błędy
return (
  <ErrorState 
    message="Nie udało się pobrać podsumowań"
    action={
      <Button onClick={refetch}>
        Spróbuj ponownie
      </Button>
    }
  />
);
```

**UI Feedback:**
- Komunikat błędu z ikoną
- Przycisk "Spróbuj ponownie"
- Możliwość wylogowania (w przypadku 401)

---

### Błąd 2: Niepowodzenie GET /api/users/ai-usage

**Scenariusz:** API zwraca błąd podczas pobierania danych AI

**Obsługa:**
- Nie blokuj wyświetlania Welcome Screen
- Ustaw domyślnie `can_generate = false` (bezpieczne)
- Wyświetl komunikat w Tooltip: "Nie można sprawdzić limitu. Spróbuj później."
- Przycisk "Generuj AI" disabled

**UI Feedback:**
- Przycisk disabled z wyjaśnieniem
- Komunikat w Tooltip
- Możliwość użycia "Stwórz ręcznie" (zawsze działa)

---

### Błąd 3: Błąd sieci (Network Error)

**Scenariusz:** Brak połączenia z internetem

**Obsługa:**
```typescript
if (!navigator.onLine) {
  return <OfflineMessage />;
}
```

**UI Feedback:**
- Ikona offline
- Komunikat: "Brak połączenia z internetem"
- Informacja: "Sprawdź połączenie i odśwież stronę"

---

### Błąd 4: Wygasła sesja (401 podczas działania)

**Scenariusz:** Sesja użytkownika wygasła podczas przeglądania

**Obsługa:**
- Middleware Astro wykrywa 401
- Redirect do `/login` z query param `?redirect=/dashboard`
- Po zalogowaniu → powrót do Dashboard

**UI Feedback:**
- Toast notification: "Sesja wygasła. Zaloguj się ponownie."
- Automatyczny redirect

---

### Błąd 5: Nieprawidłowa odpowiedź API (Validation Error)

**Scenariusz:** API zwraca dane w nieoczekiwanym formacie

**Obsługa:**
```typescript
// Walidacja typu odpowiedzi
if (!Array.isArray(response.summaries)) {
  throw new Error('Invalid API response format');
}

// Type guard
if (!isSummaryListResponse(response)) {
  // Fallback
  return { summaries: [], pagination: defaultPagination };
}
```

**UI Feedback:**
- Graceful degradation
- Wyświetl pusty stan lub błąd
- Log błędu dla debugowania

## 11. Kroki implementacji

### Krok 1: Przygotowanie typów i struktury
1. Dodaj nowe typy ViewModels do pliku `/src/types.ts`:
   - `DashboardWelcomeScreenProps`
   - `CTAButtonsProps`
   - `DashboardState`
   - `DemoSummarySection`
2. Stwórz stałą `DEMO_SUMMARY_SECTIONS` z przykładową treścią w języku polskim

### Krok 2: Implementacja custom hooka useDashboardData
1. Utwórz plik `/src/components/hooks/useDashboardData.ts`
2. Zaimplementuj logikę równoległego pobierania danych:
   - `GET /api/summaries?page=1&limit=10`
   - `GET /api/users/ai-usage`
3. Dodaj obsługę błędów dla każdego endpointu
4. Zwróć stan: `{ summaries, aiUsage, isLoading, error, refetch }`

### Krok 3: Utworzenie komponentu DemoSummary (Astro)
1. Utwórz `/src/components/DemoSummary.astro`
2. Zaimportuj Card, CardHeader, CardContent z Shadcn/ui
3. Wykorzystaj `DEMO_SUMMARY_SECTIONS` do renderowania sekcji
4. Zastosuj style Tailwind dla layoutu:
   - Grid/Flex dla sekcji
   - Responsywny design (mobile: 1 kolumna, desktop: 2 kolumny)
5. Dodaj ARIA labels dla dostępności

### Krok 4: Utworzenie komponentu WelcomeHero (Astro)
1. Utwórz `/src/components/WelcomeHero.astro`
2. Dodaj struktur HTML:
   - `<h1>` z tytułem aplikacji
   - `<p>` z opisem wartości
   - `<ul>` z listą funkcji (4 elementy)
3. Zastosuj style Tailwind:
   - Centrowanie tekstu
   - Gradient dla nagłówka (opcjonalnie)
   - Spacing i typography
4. Dodaj ikony dla listy funkcji (opcjonalnie)

### Krok 5: Utworzenie komponentu CTAButtons (React)
1. Utwórz `/src/components/CTAButtons.tsx`
2. Zaimportuj:
   - Button z Shadcn/ui
   - Tooltip z Shadcn/ui
   - Ikony (Sparkles, PencilLine) z lucide-react
3. Zaimplementuj logikę:
   - Sprawdzanie `aiUsage.can_generate`
   - Nawigację do `/generate-ai` i `/editor/new`
   - Warunkowe disable przycisku AI
4. Dodaj Tooltip dla disabled state
5. Dodaj badge z licznikiem generacji
6. Zastosuj responsive layout (stack na mobile, row na desktop)

### Krok 6: Utworzenie komponentu DashboardWelcomeScreen (React)
1. Utwórz `/src/components/DashboardWelcomeScreen.tsx`
2. Skomponuj layout z trzech sekcji:
   - `<WelcomeHero />` (import z Astro)
   - `<CTAButtons aiUsage={aiUsage} />`
   - `<DemoSummary />` (import z Astro)
3. Zastosuj Tailwind classes dla layoutu:
   - Container z max-width
   - Vertical spacing między sekcjami
   - Padding i margin responsywne
4. Dodaj semantic HTML: `<main>`, `<section>`

### Krok 7: Integracja z Dashboard (Astro page)
1. Otwórz/utwórz `/src/pages/dashboard.astro`
2. Zaimportuj:
   - `DashboardWelcomeScreen` (React)
   - `useDashboardData` hook
3. Dodaj logikę pobierania danych:
   ```typescript
   const { summaries, aiUsage, isLoading, error } = useDashboardData();
   ```
4. Zaimplementuj warunkowe renderowanie:
   ```typescript
   {isLoading && <LoadingSpinner />}
   {error && <ErrorState error={error} />}
   {!isLoading && !error && (
     summaries.length === 0 
       ? <DashboardWelcomeScreen aiUsage={aiUsage} client:load />
       : <SummaryList summaries={summaries} />
   )}
   ```
5. Dodaj Astro View Transitions dla płynnych przejść

### Krok 8: Obsługa błędów i stanów brzegowych
1. Utwórz komponenty pomocnicze:
   - `/src/components/LoadingSpinner.tsx`
   - `/src/components/ErrorState.tsx`
   - `/src/components/OfflineMessage.tsx`
2. Zaimplementuj obsługę 401 w middleware
3. Dodaj toast notifications dla błędów

### Krok 9: Stylowanie i responsywność
1. Zdefiniuj responsive breakpoints w Tailwind config (jeśli potrzeba)
2. Przetestuj layout na różnych rozmiarach ekranu:
   - Mobile (320px-640px)
   - Tablet (640px-1024px)
   - Desktop (1024px+)
3. Zastosuj mobile-first approach
4. Sprawdź dark mode (jeśli implementowany)

### Krok 10: Dostępność (a11y)
1. Dodaj ARIA labels:
   - `aria-label` dla przycisków z ikonami
   - `role="main"` dla głównej sekcji
   - `aria-live` dla komunikatów błędów
2. Sprawdź keyboard navigation:
   - Tab order
   - Focus visible states
   - Enter/Space dla przycisków
3. Przetestuj z screen readerem
4. Sprawdź contrast ratio (minimum WCAG AA)

### Krok 11: Testowanie i debugowanie
1. Przetestuj scenariusze:
   - Nowy użytkownik (0 podsumowań)
   - Użytkownik z wyczerpnym limitem AI
   - Użytkownik z dostępnym limitem AI
   - Błędy API (mock w dev)
   - Brak internetu
2. Sprawdź performance:
   - Czas ładowania
   - Bundle size
   - Core Web Vitals
3. Przetestuj nawigację między widokami

### Krok 12: Dokumentacja i finalizacja
1. Dodaj komentarze JSDoc do komponentów
2. Zaktualizuj README z informacją o nowym widoku
3. Dodaj screenshot do dokumentacji (opcjonalnie)
4. Code review i refactoring
5. Merge do głównej gałęzi

---

**Uwagi końcowe:**
- Używaj TypeScript strict mode dla bezpieczeństwa typów
- Wszystkie teksty w języku polskim
- Wykorzystaj Astro View Transitions dla UX
- Przetestuj z rzeczywistymi danymi API przed deployment
