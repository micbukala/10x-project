# Plan implementacji widoku Dashboard - Lista podsumowań

## 1. Przegląd

Widok Dashboard - Lista podsumowań jest głównym widokiem aplikacji po zalogowaniu użytkownika. Jego celem jest wyświetlenie wszystkich zapisanych podsumowań użytkownika w przejrzystej, interaktywnej liście z możliwością edycji, usuwania oraz wyświetlenia informacji o zużyciu limitu AI. W przypadku braku podsumowań wyświetlany jest ekran powitalny (Empty State) zachęcający do stworzenia pierwszego podsumowania.

## 2. Routing widoku

Widok powinien być dostępny pod główną ścieżką aplikacji dla zalogowanych użytkowników:

```
/dashboard
```

Alternatywnie, jeśli dashboard jest domyślnym widokiem po zalogowaniu:

```
/
```

## 3. Struktura komponentów

```
DashboardPage (Astro)
├── DashboardLayout (Astro)
│   ├── Sidebar (Astro/React)
│   │   ├── Logo
│   │   ├── NewSummaryDropdown (React)
│   │   ├── AIUsageCounter (React)
│   │   └── UserMenu (React)
│   └── MainContent
│       └── SummaryListContainer (React)
│           ├── PageHeader
│           ├── SummaryList (React)
│           │   ├── SummaryCard (React) [multiple]
│           │   │   ├── Card (shadcn/ui)
│           │   │   ├── Badge (shadcn/ui)
│           │   │   └── DropdownMenu (shadcn/ui)
│           │   │       ├── EditAction
│           │   │       └── DeleteAction
│           │   └── DeleteConfirmationDialog (React)
│           └── EmptyState (React)
```

## 4. Szczegóły komponentów

### DashboardPage (Astro)

**Opis komponentu:**
Główny komponent strony Dashboard, odpowiedzialny za zarządzanie layoutem, weryfikację autentykacji i dostarczenie początkowych danych do komponentów React.

**Główne elementy:**
- Layout wrapper
- Server-side authentication check
- Initial data fetching (summaries list, AI usage)
- SummaryListContainer (React component)

**Obsługiwane interakcje:**
- Brak (komponent statyczny Astro)

**Obsługiwana walidacja:**
- Weryfikacja autentykacji użytkownika po stronie serwera
- Przekierowanie do logowania jeśli brak sesji

**Typy:**
- `SummaryListResponseDTO`
- `UserAiUsageDTO`

**Propsy:**
- Brak (główny komponent strony)

---

### SummaryListContainer (React)

**Opis komponentu:**
Kontener zarządzający logiką biznesową widoku listy podsumowań. Obsługuje pobieranie danych, zarządzanie stanem, paginację oraz koordynuje interakcje użytkownika (edycja, usuwanie).

**Główne elementy:**
- `<div className="container mx-auto p-6">`
- PageHeader z tytułem "Moje podsumowania"
- Conditional rendering: `SummaryList` lub `EmptyState`
- `DeleteConfirmationDialog`

**Obsługiwane interakcje:**
- Inicjalne załadowanie danych z API
- Obsługa paginacji
- Inicjowanie usuwania podsumowania
- Nawigacja do edycji podsumowania
- Odświeżanie listy po usunięciu

**Obsługiwana walidacja:**
- Sprawdzenie czy lista podsumowań jest pusta
- Walidacja odpowiedzi API

**Typy:**
- `SummaryListResponseDTO`
- `SummaryListItemDTO[]`
- `PaginationDTO`

**Propsy:**
```typescript
interface SummaryListContainerProps {
  initialSummaries: SummaryListResponseDTO;
  initialAiUsage: UserAiUsageDTO;
}
```

---

### SummaryList (React)

**Opis komponentu:**
Prezentacyjny komponent wyświetlający listę kart podsumowań w układzie grid responsywnym.

**Główne elementy:**
- `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`
- Mapowanie `summaries` do komponentów `SummaryCard`
- Loading state (skeleton cards)

**Obsługiwane interakcje:**
- Przekazywanie callbacków do kart podsumowań

**Obsługiwana walidacja:**
- Sprawdzenie czy tablica summaries nie jest pusta

**Typy:**
- `SummaryListItemDTO[]`

**Propsy:**
```typescript
interface SummaryListProps {
  summaries: SummaryListItemDTO[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}
```

---

### SummaryCard (React)

**Opis komponentu:**
Karta prezentująca pojedyncze podsumowanie z tytułem, datą utworzenia, badge'em wskazującym typ tworzenia (AI/Manual) oraz menu akcji.

**Główne elementy:**
- `Card` (shadcn/ui) jako wrapper
- `CardHeader` z tytułem (klikalne do edycji)
- `CardContent` z metadanymi:
  - Data utworzenia (formatowana)
  - Data ostatniej aktualizacji (formatowana)
  - Nazwa modelu AI (jeśli AI-generated)
- `Badge` wskazujący typ tworzenia
- `DropdownMenu` z akcjami (Edytuj, Usuń)

**Obsługiwane interakcje:**
- Kliknięcie na tytuł/kartę → nawigacja do edytora
- Kliknięcie "Edytuj" w menu → nawigacja do edytora
- Kliknięcie "Usuń" w menu → otwarcie dialogu potwierdzenia

**Obsługiwana walidacja:**
- Walidacja formatu daty przed wyświetleniem
- Sprawdzenie czy ai_model_name istnieje przed wyświetleniem

**Typy:**
- `SummaryListItemDTO`
- `Enums<"summary_creation_type">`

**Propsy:**
```typescript
interface SummaryCardProps {
  summary: SummaryListItemDTO;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}
```

---

### DeleteConfirmationDialog (React)

**Opis komponentu:**
Modalny dialog potwierdzenia usunięcia podsumowania, zapobiegający przypadkowemu usunięciu danych.

**Główne elementy:**
- `AlertDialog` (shadcn/ui)
- `AlertDialogContent` z:
  - `AlertDialogHeader` (tytuł + opis)
  - `AlertDialogDescription` (ostrzeżenie o nieodwracalności)
  - `AlertDialogFooter` z przyciskami:
    - `Button` variant="outline" (Anuluj)
    - `Button` variant="destructive" (Usuń)
- Loading state podczas usuwania

**Obsługiwane interakcje:**
- Otwarcie/zamknięcie dialogu
- Potwierdzenie usunięcia (wywołanie API DELETE)
- Anulowanie akcji
- Obsługa stanu ładowania podczas API call

**Obsługiwana walidacja:**
- Blokada wielokrotnego kliknięcia podczas usuwania (disabled state)
- Walidacja odpowiedzi API

**Typy:**
- `DeleteSummaryResponseDTO`
- `ApiErrorDTO`

**Propsy:**
```typescript
interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  summaryTitle: string;
  isDeleting: boolean;
}
```

---

### EmptyState (React)

**Opis komponentu:**
Ekran powitalny wyświetlany gdy użytkownik nie ma jeszcze żadnych podsumowań. Zawiera komunikat zachęcający i przyciski CTA.

**Główne elementy:**
- `<div className="flex flex-col items-center justify-center min-h-[400px] text-center">`
- Ikona (np. DocumentIcon lub FileTextIcon)
- Nagłówek "Zacznij tworzyć podsumowania"
- Opis wartości aplikacji
- Dwa przyciski CTA:
  - "Generuj z AI" (primary)
  - "Stwórz ręcznie" (secondary)

**Obsługiwane interakcje:**
- Kliknięcie "Generuj z AI" → przekierowanie do `/generate-ai`
- Kliknięcie "Stwórz ręcznie" → przekierowanie do `/editor/new`

**Obsługiwana walidacja:**
- Sprawdzenie limitu AI przed enabled/disabled przycisku "Generuj z AI"

**Typy:**
- `UserAiUsageDTO` (dla sprawdzenia limitu)

**Propsy:**
```typescript
interface EmptyStateProps {
  canGenerateAi: boolean;
  onCreateAi: () => void;
  onCreateManual: () => void;
}
```

---

### AIUsageCounter (React)

**Opis komponentu:**
Komponent wyświetlający aktualny stan wykorzystania limitu AI w postaci licznika i progress bara.

**Główne elementy:**
- `<div>` z tekstem "Wykorzystano w tym miesiącu: X/Y"
- `Progress` (shadcn/ui) wskazujący procent wykorzystania
- Tooltip z dodatkowymi informacjami (data resetu)

**Obsługiwane interakcje:**
- Hover → wyświetlenie tooltipa z datą odnowienia limitu

**Obsługiwana walidacja:**
- Walidacja czy usage_count <= monthly_limit
- Obliczenie procentu wykorzystania

**Typy:**
- `UserAiUsageDTO`

**Propsy:**
```typescript
interface AIUsageCounterProps {
  aiUsage: UserAiUsageDTO;
}
```

---

### NewSummaryDropdown (React)

**Opis komponentu:**
Dropdown menu z opcjami tworzenia nowego podsumowania (AI lub manualne).

**Główne elementy:**
- `DropdownMenu` (shadcn/ui)
- `DropdownMenuTrigger` - przycisk "Nowe podsumowanie"
- `DropdownMenuContent` z opcjami:
  - "Generuj z AI" (z ikoną, disabled gdy brak limitu)
  - "Stwórz ręcznie" (z ikoną)

**Obsługiwane interakcje:**
- Kliknięcie "Generuj z AI" → nawigacja do `/generate-ai`
- Kliknięcie "Stwórz ręcznie" → nawigacja do `/editor/new`

**Obsługiwana walidacja:**
- Sprawdzenie `can_generate` przed włączeniem opcji AI
- Wyświetlenie tooltipa gdy AI disabled

**Typy:**
- `UserAiUsageDTO`

**Propsy:**
```typescript
interface NewSummaryDropdownProps {
  aiUsage: UserAiUsageDTO;
}
```

## 5. Typy

### Istniejące typy (z `src/types.ts`):

```typescript
// Lista podsumowań - pojedynczy element
interface SummaryListItemDTO {
  id: string;
  title: string;
  creation_type: Enums<"summary_creation_type">; // 'ai' | 'manual'
  ai_model_name: string | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// Paginacja
interface PaginationDTO {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
}

// Kompletna odpowiedź GET /api/summaries
interface SummaryListResponseDTO {
  summaries: SummaryListItemDTO[];
  pagination: PaginationDTO;
}

// Query params dla GET /api/summaries
interface SummaryListQueryParams {
  page?: number;
  limit?: number;
  sort?: "created_at" | "updated_at" | "title";
  order?: "asc" | "desc";
  creation_type?: Enums<"summary_creation_type">;
}

// AI Usage info
interface UserAiUsageDTO {
  can_generate: boolean;
  usage_count: number;
  monthly_limit: number;
  remaining_generations: number;
  period_start: string; // ISO 8601
  period_end: string; // ISO 8601
}

// Odpowiedź DELETE /api/summaries/:id
interface DeleteSummaryResponseDTO {
  message: string;
  deleted_id: string;
}

// Błędy API
interface ApiErrorDTO {
  error: {
    code: ApiErrorCode;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
  };
}
```

### Nowe typy - ViewModels dla komponentów:

```typescript
// ViewModel dla sformatowanej karty podsumowania
interface SummaryCardViewModel {
  id: string;
  title: string;
  creationType: 'ai' | 'manual';
  creationTypeLabel: string; // "AI" lub "Ręczne"
  creationTypeBadgeVariant: 'default' | 'secondary'; // dla Badge
  aiModelName: string | null;
  formattedCreatedAt: string; // "15 paź 2025, 14:30"
  formattedUpdatedAt: string; // "15 paź 2025, 14:30"
  relativeCreatedAt: string; // "2 dni temu"
  showAiModelBadge: boolean;
}

// Stan dialogu usuwania
interface DeleteDialogState {
  isOpen: boolean;
  summaryId: string | null;
  summaryTitle: string;
  isDeleting: boolean;
}

// Stan listy podsumowań
interface SummaryListState {
  summaries: SummaryListItemDTO[];
  pagination: PaginationDTO;
  isLoading: boolean;
  error: ApiErrorDTO | null;
}

// Stan filtrów i sortowania
interface ListFiltersState {
  page: number;
  limit: number;
  sort: "created_at" | "updated_at" | "title";
  order: "asc" | "desc";
  creation_type?: "ai" | "manual";
}
```

### Typy pomocnicze:

```typescript
// Callback types
type OnEditHandler = (summaryId: string) => void;
type OnDeleteHandler = (summaryId: string) => void;
type OnDeleteConfirmHandler = () => Promise<void>;

// Navigation helpers
type NavigateToEditor = (summaryId: string) => void;
type NavigateToGenerateAi = () => void;
type NavigateToCreateManual = () => void;
```

## 6. Zarządzanie stanem

### Stan lokalny w `SummaryListContainer`:

```typescript
// Stan listy podsumowań
const [summaries, setSummaries] = useState<SummaryListItemDTO[]>(initialSummaries.summaries);
const [pagination, setPagination] = useState<PaginationDTO>(initialSummaries.pagination);
const [isLoading, setIsLoading] = useState(false);

// Stan AI usage (może być w kontekście globalnym)
const [aiUsage, setAiUsage] = useState<UserAiUsageDTO>(initialAiUsage);

// Stan dialogu usuwania
const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
  isOpen: false,
  summaryId: null,
  summaryTitle: '',
  isDeleting: false,
});

// Stan błędów
const [error, setError] = useState<ApiErrorDTO | null>(null);
```

### Custom Hook: `useSummaryList`

Rekomendacja: Wydzielenie logiki zarządzania listą do custom hooka dla lepszej organizacji kodu i możliwości reużycia.

```typescript
// src/components/hooks/useSummaryList.ts
interface UseSummaryListReturn {
  summaries: SummaryListItemDTO[];
  pagination: PaginationDTO;
  isLoading: boolean;
  error: ApiErrorDTO | null;
  refreshList: () => Promise<void>;
  changePage: (page: number) => Promise<void>;
  deleteSummary: (summaryId: string) => Promise<void>;
}

function useSummaryList(
  initialData: SummaryListResponseDTO
): UseSummaryListReturn {
  // Implementacja logiki:
  // - Przechowywanie stanu
  // - Funkcja refreshList - pobieranie danych z API
  // - Funkcja changePage - zmiana strony paginacji
  // - Funkcja deleteSummary - usuwanie podsumowania i odświeżenie listy
}
```

### Custom Hook: `useDeleteConfirmation`

```typescript
// src/components/hooks/useDeleteConfirmation.ts
interface UseDeleteConfirmationReturn {
  isOpen: boolean;
  summaryId: string | null;
  summaryTitle: string;
  isDeleting: boolean;
  openDialog: (id: string, title: string) => void;
  closeDialog: () => void;
  confirmDelete: () => Promise<void>;
}

function useDeleteConfirmation(
  onDeleteSuccess: (deletedId: string) => void
): UseDeleteConfirmationReturn {
  // Implementacja logiki dialogu usuwania
}
```

## 7. Integracja API

### GET /api/summaries

**Endpoint:** `GET /api/summaries`

**Query Parameters:**
```typescript
const params: SummaryListQueryParams = {
  page: 1,
  limit: 12,
  sort: "created_at",
  order: "desc",
  creation_type?: "ai" | "manual" // opcjonalnie
};
```

**Request:**
```typescript
const response = await fetch(
  `/api/summaries?${new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
    sort: params.sort,
    order: params.order,
    ...(params.creation_type && { creation_type: params.creation_type })
  })}`
);

if (!response.ok) {
  const errorData: ApiErrorDTO = await response.json();
  throw new Error(errorData.error.message);
}

const data: SummaryListResponseDTO = await response.json();
```

**Response Type:** `SummaryListResponseDTO`

**Error Handling:**
- 401 Unauthorized → przekierowanie do logowania
- 400 Validation Error → wyświetlenie komunikatu błędu
- 500 Internal Error → wyświetlenie ogólnego komunikatu błędu

---

### DELETE /api/summaries/:id

**Endpoint:** `DELETE /api/summaries/:id`

**Path Parameters:**
- `id`: string (UUID)

**Request:**
```typescript
const response = await fetch(`/api/summaries/${summaryId}`, {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
  },
});

if (!response.ok) {
  const errorData: ApiErrorDTO = await response.json();
  throw new Error(errorData.error.message);
}

const data: DeleteSummaryResponseDTO = await response.json();
```

**Response Type:** `DeleteSummaryResponseDTO`

**Error Handling:**
- 401 Unauthorized → przekierowanie do logowania
- 404 Not Found → komunikat "Podsumowanie nie zostało znalezione"
- 403 Forbidden → komunikat "Nie masz uprawnień do usunięcia tego podsumowania"
- 500 Internal Error → komunikat "Nie udało się usunąć podsumowania"

---

### GET /api/users/ai-usage

**Endpoint:** `GET /api/users/ai-usage`

**Request:**
```typescript
const response = await fetch('/api/users/ai-usage');

if (!response.ok) {
  const errorData: ApiErrorDTO = await response.json();
  throw new Error(errorData.error.message);
}

const data: UserAiUsageDTO = await response.json();
```

**Response Type:** `UserAiUsageDTO`

**Error Handling:**
- 401 Unauthorized → przekierowanie do logowania
- 500 Internal Error → wyświetlenie wartości domyślnych lub komunikatu błędu

## 8. Interakcje użytkownika

### 1. Przeglądanie listy podsumowań
- **Akcja:** Użytkownik wchodzi na stronę Dashboard
- **Oczekiwany rezultat:** 
  - Lista podsumowań zostaje załadowana i wyświetlona w układzie grid
  - Każda karta pokazuje tytuł, datę, badge typu i menu akcji
  - Jeśli brak podsumowań → EmptyState

### 2. Kliknięcie w kartę podsumowania (nawigacja do edycji)
- **Akcja:** Użytkownik klika na tytuł lub obszar karty podsumowania
- **Oczekiwany rezultat:**
  - Nawigacja do `/editor/${summaryId}` lub `/summaries/${summaryId}/edit`
  - Załadowanie widoku edytora z danymi podsumowania

### 3. Edycja przez menu dropdown
- **Akcja:** Użytkownik klika ikonę trzech kropek → "Edytuj"
- **Oczekiwany rezultat:**
  - Nawigacja do edytora (jak wyżej)

### 4. Inicjowanie usuwania
- **Akcja:** Użytkownik klika ikonę trzech kropek → "Usuń"
- **Oczekiwany rezultat:**
  - Otwarcie `DeleteConfirmationDialog`
  - Dialog pokazuje tytuł podsumowania do usunięcia
  - Przyciski "Anuluj" i "Usuń" są aktywne

### 5. Potwierdzenie usunięcia
- **Akcja:** Użytkownik klika "Usuń" w dialogu
- **Oczekiwany rezultat:**
  - Przyciski zostają zablokowane (isDeleting = true)
  - Wyświetlenie loading spinner na przycisku
  - Wywołanie DELETE API
  - Po sukcesie:
    - Toast notification "Podsumowanie zostało usunięte"
    - Zamknięcie dialogu
    - Odświeżenie listy (usunięcie karty z UI)
  - Po błędzie:
    - Toast notification z komunikatem błędu
    - Dialog pozostaje otwarty
    - Przyciski zostają odblokowane

### 6. Anulowanie usuwania
- **Akcja:** Użytkownik klika "Anuluj" w dialogu lub klika poza dialog
- **Oczekiwany rezultat:**
  - Dialog zostaje zamknięty
  - Żadne zmiany na liście

### 7. Tworzenie nowego podsumowania AI
- **Akcja:** Użytkownik klika "Nowe podsumowanie" → "Generuj z AI"
- **Warunek:** `aiUsage.can_generate === true`
- **Oczekiwany rezultat:**
  - Nawigacja do `/generate-ai`

### 8. Tworzenie nowego podsumowania manualnego
- **Akcja:** Użytkownik klika "Nowe podsumowanie" → "Stwórz ręcznie"
- **Oczekiwany rezultat:**
  - Nawigacja do `/editor/new`

### 9. Próba generowania AI przy wyczerpaniu limitu
- **Akcja:** Użytkownik hover nad "Generuj z AI" gdy `aiUsage.can_generate === false`
- **Oczekiwany rezultat:**
  - Opcja jest disabled (wyszarzona)
  - Tooltip pokazuje: "Osiągnięto limit 5 generacji w tym miesiącu. Limit odnowi się [data]"

### 10. Paginacja
- **Akcja:** Użytkownik klika przycisk "Następna strona" lub numer strony
- **Oczekiwany rezultat:**
  - Wywołanie API z nowym parametrem `page`
  - Loading state podczas ładowania
  - Wyświetlenie nowych kart podsumowań
  - Scroll do góry strony

## 9. Warunki i walidacja

### 1. Wyświetlanie EmptyState vs Lista
- **Komponent:** `SummaryListContainer`
- **Warunek:** `summaries.length === 0 && !isLoading`
- **Efekt:** Renderowanie `EmptyState` zamiast `SummaryList`

### 2. Dostępność przycisku "Generuj z AI"
- **Komponenty:** `NewSummaryDropdown`, `EmptyState`
- **Warunek:** `aiUsage.can_generate === true`
- **Efekt:** Przycisk/opcja enabled, w przeciwnym razie disabled z tooltipem

### 3. Wyświetlanie badge'a modelu AI
- **Komponent:** `SummaryCard`
- **Warunek:** `summary.creation_type === 'ai' && summary.ai_model_name !== null`
- **Efekt:** Wyświetlenie dodatkowego badge'a z nazwą modelu

### 4. Blokada wielokrotnego usuwania
- **Komponent:** `DeleteConfirmationDialog`
- **Warunek:** `isDeleting === true`
- **Efekt:** Przyciski disabled, wyświetlenie spinner na przycisku "Usuń"

### 5. Walidacja formatu UUID przed usunięciem
- **Komponent:** `SummaryListContainer` (w funkcji deleteSummary)
- **Warunek:** Sprawdzenie czy `summaryId` jest poprawnym UUID przed wywołaniem API
- **Efekt:** Jeśli niepoprawny → wyświetlenie błędu bez wywołania API

### 6. Walidacja odpowiedzi API
- **Komponenty:** Wszystkie wywołujące API
- **Warunek:** Sprawdzenie `response.ok` i struktury danych
- **Efekt:** 
  - Success → przetworzenie danych
  - Error → wyświetlenie komunikatu błędu w Toast

### 7. Formatowanie dat
- **Komponent:** `SummaryCard`
- **Warunek:** Sprawdzenie czy `created_at` i `updated_at` są poprawnymi datami ISO 8601
- **Efekt:** 
  - Valid → formatowanie do "15 paź 2025, 14:30"
  - Invalid → wyświetlenie "-" lub komunikatu błędu

### 8. Progress bar AI usage
- **Komponent:** `AIUsageCounter`
- **Warunek:** Obliczenie `(usage_count / monthly_limit) * 100`
- **Efekt:** 
  - Procent wykorzystania wizualizowany w progress bar
  - Zmiana koloru przy 80%+ (warning) i 100% (danger)

### 9. Paginacja - dostępność przycisków
- **Komponent:** Pagination controls
- **Warunek:** 
  - "Poprzednia" disabled gdy `pagination.current_page === 1`
  - "Następna" disabled gdy `pagination.current_page === pagination.total_pages`
- **Efekt:** Odpowiednie przyciski disabled

### 10. Retry przy błędzie sieci
- **Komponenty:** API calls
- **Warunek:** Wykrycie błędu sieciowego (network error)
- **Efekt:** Wyświetlenie przycisku "Spróbuj ponownie" w komunikacie błędu

## 10. Obsługa błędów

### 1. Błąd ładowania listy podsumowań

**Scenariusz:** API GET /api/summaries zwraca błąd

**Obsługa:**
- Wyświetlenie komunikatu błędu w miejscu listy
- Komponent `ErrorState` z komunikatem: "Nie udało się załadować podsumowań"
- Przycisk "Spróbuj ponownie" wywołujący refreshList()
- Log błędu w konsoli dla debugowania

**Kod przykładowy:**
```typescript
try {
  const data = await fetchSummaries(params);
  setSummaries(data.summaries);
} catch (error) {
  console.error('Failed to load summaries:', error);
  setError({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Nie udało się załadować podsumowań. Spróbuj ponownie.',
    }
  });
}
```

---

### 2. Błąd usuwania podsumowania

**Scenariusz:** API DELETE /api/summaries/:id zwraca błąd

**Obsługa:**
- Toast notification z komunikatem błędu
- Dialog pozostaje otwarty
- Przyciski zostają odblokowane (isDeleting = false)
- Specyficzne komunikaty dla różnych kodów błędów:
  - 404: "Podsumowanie nie zostało znalezione"
  - 403: "Nie masz uprawnień do usunięcia tego podsumowania"
  - 500: "Nie udało się usunąć podsumowania. Spróbuj ponownie"

**Kod przykładowy:**
```typescript
try {
  await deleteSummaryAPI(summaryId);
  toast.success('Podsumowanie zostało usunięte');
  refreshList();
} catch (error) {
  const apiError = error as ApiErrorDTO;
  const message = getDeleteErrorMessage(apiError.error.code);
  toast.error(message);
} finally {
  setIsDeleting(false);
}
```

---

### 3. Błąd autentykacji (401)

**Scenariusz:** Użytkownik nie jest zalogowany lub sesja wygasła

**Obsługa:**
- Automatyczne przekierowanie do strony logowania
- Zapisanie aktualnej ścieżki w localStorage dla redirect po zalogowaniu
- Toast notification: "Sesja wygasła. Zaloguj się ponownie"

**Kod przykładowy:**
```typescript
if (response.status === 401) {
  localStorage.setItem('redirectAfterLogin', window.location.pathname);
  toast.error('Sesja wygasła. Zaloguj się ponownie');
  window.location.href = '/login';
  return;
}
```

---

### 4. Błąd walidacji (400)

**Scenariusz:** Niepoprawne parametry zapytania lub dane

**Obsługa:**
- Wyświetlenie komunikatu błędu z informacją o niepoprawnym polu
- Fallback do wartości domyślnych parametrów
- Log błędu walidacji w konsoli

**Kod przykładowy:**
```typescript
if (response.status === 400) {
  const errorData: ApiErrorDTO = await response.json();
  console.error('Validation error:', errorData.error.details);
  toast.error(errorData.error.message);
  // Reset to default params
  setParams(DEFAULT_QUERY_PARAMS);
}
```

---

### 5. Błąd sieci (Network Error)

**Scenariusz:** Brak połączenia z internetem lub serwer nie odpowiada

**Obsługa:**
- Wykrycie `TypeError: Failed to fetch`
- Wyświetlenie komunikatu: "Brak połączenia z internetem. Sprawdź swoje połączenie"
- Przycisk "Spróbuj ponownie"
- Ikona offline w UI

**Kod przykładowy:**
```typescript
try {
  const response = await fetch(url);
  // ...
} catch (error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    toast.error('Brak połączenia z internetem. Sprawdź swoje połączenie');
    setIsOnline(false);
  }
}
```

---

### 6. Błąd ładowania AI Usage

**Scenariusz:** API GET /api/users/ai-usage zwraca błąd

**Obsługa:**
- Wyświetlenie wartości domyślnych (fallback)
- Komunikat w konsoli
- Ukrycie licznika lub wyświetlenie "Nie dostępne"
- Brak blokowania głównego UI

**Kod przykładowy:**
```typescript
try {
  const aiUsage = await fetchAiUsage();
  setAiUsage(aiUsage);
} catch (error) {
  console.warn('Failed to load AI usage:', error);
  setAiUsage({
    can_generate: false,
    usage_count: 0,
    monthly_limit: 5,
    remaining_generations: 0,
    period_start: new Date().toISOString(),
    period_end: new Date().toISOString(),
  });
}
```

---

### 7. Błąd parsowania daty

**Scenariusz:** created_at lub updated_at ma niepoprawny format

**Obsługa:**
- Wyświetlenie "-" w miejscu daty
- Log warning w konsoli
- Aplikacja działa normalnie

**Kod przykładowy:**
```typescript
function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.warn('Invalid date format:', dateString);
    return '-';
  }
}
```

---

### 8. Pusta lista po usunięciu ostatniego elementu

**Scenariusz:** Użytkownik usuwa ostatnie podsumowanie na liście

**Obsługa:**
- Po pomyślnym usunięciu sprawdzenie czy `summaries.length === 0`
- Automatyczne wyświetlenie `EmptyState`
- Smooth transition

**Kod przykładowy:**
```typescript
const handleDeleteSuccess = (deletedId: string) => {
  const newSummaries = summaries.filter(s => s.id !== deletedId);
  setSummaries(newSummaries);
  
  if (newSummaries.length === 0) {
    // EmptyState zostanie automatycznie renderowany
  }
};
```

---

### 9. Timeout API

**Scenariusz:** API nie odpowiada w rozsądnym czasie

**Obsługa:**
- Ustawienie timeoutu na 30 sekund
- Po przekroczeniu → abort request
- Komunikat: "Żądanie przekroczyło limit czasu. Spróbuj ponownie"

**Kod przykładowy:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
  // ...
} catch (error) {
  if (error.name === 'AbortError') {
    toast.error('Żądanie przekroczyło limit czasu. Spróbuj ponownie');
  }
}
```

---

### 10. Optymistyczne usuwanie z rollbackiem

**Scenariusz:** Dla lepszego UX usuwamy kartę natychmiast, ale musimy obsłużyć błąd

**Obsługa:**
- Optymistyczne usunięcie karty z UI
- Wywołanie API DELETE
- W przypadku błędu:
  - Przywrócenie karty na listę
  - Toast z komunikatem błędu
  - Rollback do poprzedniego stanu

**Kod przykładowy:**
```typescript
const handleDelete = async (summaryId: string) => {
  const previousSummaries = [...summaries];
  
  // Optimistic update
  setSummaries(summaries.filter(s => s.id !== summaryId));
  
  try {
    await deleteSummaryAPI(summaryId);
    toast.success('Podsumowanie zostało usunięte');
  } catch (error) {
    // Rollback
    setSummaries(previousSummaries);
    toast.error('Nie udało się usunąć podsumowania');
  }
};
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików i typów
1. Utworzenie pliku widoku: `src/pages/dashboard.astro`
2. Utworzenie katalogu komponentów: `src/components/dashboard/`
3. Dodanie nowych typów ViewModel do `src/types.ts` lub utworzenie `src/components/dashboard/types.ts`
4. Utworzenie katalogu dla custom hooks: `src/components/hooks/`

**Rezultat:** Podstawowa struktura katalogów i plików gotowa do implementacji.

---

### Krok 2: Implementacja strony Astro (server-side)
1. Utworzenie `src/pages/dashboard.astro`
2. Implementacja server-side authentication check:
   ```typescript
   const { supabase, user } = Astro.locals;
   if (!user) return Astro.redirect('/login');
   ```
3. Pobranie początkowych danych:
   - GET `/api/summaries` (pierwsza strona)
   - GET `/api/users/ai-usage`
4. Przekazanie danych do komponentu React `SummaryListContainer`
5. Dodanie layoutu (Layout.astro)

**Rezultat:** Strona dashboard renderuje się po stronie serwera z początkowymi danymi.

---

### Krok 3: Implementacja custom hook `useSummaryList`
1. Utworzenie `src/components/hooks/useSummaryList.ts`
2. Implementacja stanu: summaries, pagination, isLoading, error
3. Implementacja funkcji `refreshList()`:
   - Fetch GET /api/summaries z aktualnymi parametrami
   - Obsługa błędów
   - Update stanu
4. Implementacja funkcji `changePage(page: number)`
5. Implementacja funkcji `deleteSummary(id: string)`
6. Export hooka

**Rezultat:** Hook zarządzający stanem listy jest gotowy do użycia.

---

### Krok 4: Implementacja custom hook `useDeleteConfirmation`
1. Utworzenie `src/components/hooks/useDeleteConfirmation.ts`
2. Implementacja stanu dialogu: isOpen, summaryId, summaryTitle, isDeleting
3. Implementacja funkcji `openDialog(id, title)`
4. Implementacja funkcji `closeDialog()`
5. Implementacja funkcji `confirmDelete()`:
   - Wywołanie DELETE API
   - Obsługa błędów
   - Callback onDeleteSuccess
6. Export hooka

**Rezultat:** Hook zarządzający dialogiem usuwania jest gotowy.

---

### Krok 5: Implementacja komponentu `SummaryCard`
1. Utworzenie `src/components/dashboard/SummaryCard.tsx`
2. Import komponentów shadcn/ui: Card, Badge, DropdownMenu
3. Implementacja struktury HTML z Card wrapper
4. Dodanie formatowania dat (funkcja helper)
5. Implementacja badge'a typu (AI/Manual)
6. Implementacja DropdownMenu z akcjami Edytuj/Usuń
7. Obsługa kliknięć (onClick handlers)
8. Dodanie stylów Tailwind
9. Export komponentu

**Rezultat:** Pojedyncza karta podsumowania wyświetla się poprawnie.

---

### Krok 6: Implementacja komponentu `DeleteConfirmationDialog`
1. Utworzenie `src/components/dashboard/DeleteConfirmationDialog.tsx`
2. Import AlertDialog z shadcn/ui
3. Implementacja struktury dialogu:
   - Header z tytułem
   - Description z ostrzeżeniem
   - Footer z przyciskami
4. Obsługa stanu isDeleting (loading spinner)
5. Obsługa kliknięć Anuluj/Usuń
6. Dodanie animacji (z shadcn/ui)
7. Export komponentu

**Rezultat:** Dialog potwierdzenia działa poprawnie.

---

### Krok 7: Implementacja komponentu `SummaryList`
1. Utworzenie `src/components/dashboard/SummaryList.tsx`
2. Implementacja grid layout (responsive)
3. Mapowanie `summaries.map()` do komponentów `SummaryCard`
4. Przekazanie callbacków onEdit i onDelete
5. Implementacja loading state (skeleton cards)
6. Dodanie stylów Tailwind
7. Export komponentu

**Rezultat:** Lista kart renderuje się w układzie grid.

---

### Krok 8: Implementacja komponentu `EmptyState`
1. Utworzenie `src/components/dashboard/EmptyState.tsx`
2. Dodanie ikony (np. z lucide-react)
3. Implementacja tekstu powitalnego
4. Dodanie przycisków CTA:
   - "Generuj z AI" (sprawdzenie can_generate)
   - "Stwórz ręcznie"
5. Obsługa kliknięć (nawigacja)
6. Dodanie stylów Tailwind (centered, responsive)
7. Export komponentu

**Rezultat:** EmptyState wyświetla się gdy brak podsumowań.

---

### Krok 9: Implementacja komponentu `AIUsageCounter`
1. Utworzenie `src/components/dashboard/AIUsageCounter.tsx`
2. Import Progress z shadcn/ui
3. Obliczenie procentu wykorzystania
4. Implementacja tekstu "X/Y"
5. Implementacja progress bara
6. Dodanie tooltipa z datą odnowienia
7. Conditional styling (kolory przy 80%, 100%)
8. Export komponentu

**Rezultat:** Licznik AI wyświetla się poprawnie.

---

### Krok 10: Implementacja komponentu `NewSummaryDropdown`
1. Utworzenie `src/components/dashboard/NewSummaryDropdown.tsx`
2. Import DropdownMenu z shadcn/ui
3. Implementacja struktury menu
4. Dodanie opcji "Generuj z AI" (z warunkiem can_generate)
5. Dodanie opcji "Stwórz ręcznie"
6. Dodanie ikon (lucide-react)
7. Obsługa disabled state i tooltipa dla AI
8. Obsługa kliknięć (nawigacja)
9. Export komponentu

**Rezultat:** Dropdown z opcjami tworzenia działa poprawnie.

---

### Krok 11: Implementacja kontenera `SummaryListContainer`
1. Utworzenie `src/components/dashboard/SummaryListContainer.tsx`
2. Import wszystkich komponentów dzieci
3. Import hooków: useSummaryList, useDeleteConfirmation
4. Inicjalizacja stanu z propsów (initialSummaries, initialAiUsage)
5. Implementacja logiki conditional rendering (EmptyState vs SummaryList)
6. Implementacja handleEdit (nawigacja)
7. Implementacja handleDelete (otwarcie dialogu)
8. Implementacja handleDeleteConfirm (usunięcie + refresh)
9. Dodanie Toast notifications (react-hot-toast lub shadcn/ui toast)
10. Export komponentu

**Rezultat:** Kontener zarządza całym widokiem i jego logiką.

---

### Krok 12: Integracja z stroną Astro
1. W `src/pages/dashboard.astro` import `SummaryListContainer`
2. Przekazanie pobranych danych jako propsy:
   ```astro
   <SummaryListContainer 
     client:load
     initialSummaries={summaries}
     initialAiUsage={aiUsage}
   />
   ```
3. Dodanie error handling dla błędów server-side
4. Sprawdzenie responsywności

**Rezultat:** Widok dashboard w pełni funkcjonalny.

---

### Krok 13: Implementacja nawigacji i routingu
1. Dodanie linków w sidebar/header do `/dashboard`
2. Implementacja nawigacji w `SummaryCard` i `EmptyState`:
   - Do edytora: `/editor/${id}` lub `/summaries/${id}/edit`
   - Do generowania AI: `/generate-ai`
   - Do tworzenia manualnego: `/editor/new`
3. Sprawdzenie czy routing działa poprawnie
4. Dodanie active state dla linku Dashboard

**Rezultat:** Nawigacja między widokami działa płynnie.

---

### Krok 14: Implementacja obsługi błędów i edge cases
1. Dodanie komponentu `ErrorState` dla błędów ładowania
2. Implementacja retry logic w hookach
3. Dodanie obsługi błędów sieci (network offline)
4. Implementacja timeoutu dla API calls
5. Dodanie logowania błędów (console.error)
6. Implementacja rollbacku przy optymistycznym usuwaniu
7. Testowanie różnych scenariuszy błędów

**Rezultat:** Aplikacja obsługuje błędy gracefully.

---

### Krok 15: Dodanie loading states i animacji
1. Implementacja skeleton cards dla loading state
2. Dodanie animacji fade-in dla kart
3. Dodanie spinner na przycisku podczas usuwania
4. Implementacja smooth scroll po zmianie strony
5. Dodanie transitions dla hover states
6. Testowanie płynności animacji

**Rezultat:** UI jest responsywne i przyjemne w użyciu.

---

### Krok 16: Implementacja paginacji (opcjonalne dla MVP)
1. Utworzenie komponentu `Pagination`
2. Implementacja przycisków Poprzednia/Następna
3. Implementacja numerów stron (1, 2, 3, ...)
4. Obsługa disabled states
5. Integracja z `useSummaryList.changePage()`
6. Dodanie scroll to top po zmianie strony
7. Testowanie paginacji

**Rezultat:** Użytkownik może przeglądać wiele stron podsumowań.

---

### Krok 17: Optymalizacja wydajności
1. Dodanie React.memo() dla `SummaryCard`
2. Użycie useCallback dla event handlers
3. Użycie useMemo dla obliczania procentu AI usage
4. Optymalizacja re-renderów
5. Lazy loading dla komponentów (React.lazy)
6. Testowanie wydajności z dużą liczbą kart

**Rezultat:** Widok renderuje się szybko nawet z wieloma kartami.

---

### Krok 18: Accessibility (A11y)
1. Dodanie ARIA labels dla przycisków akcji
2. Implementacja keyboard navigation (Tab, Enter, Escape)
3. Dodanie focus states dla wszystkich interaktywnych elementów
4. Sprawdzenie kontrastu kolorów (WCAG AA)
5. Dodanie screen reader labels
6. Testowanie z keyboard-only navigation
7. Testowanie z screen readerem

**Rezultat:** Widok jest dostępny dla użytkowników z niepełnosprawnościami.

---

### Krok 19: Testy jednostkowe i integracyjne
1. Napisanie testów dla hooków (useSummaryList, useDeleteConfirmation)
2. Napisanie testów dla komponentów (SummaryCard, DeleteDialog)
3. Mockowanie API calls
4. Testowanie error handling
5. Testowanie edge cases (pusta lista, błędy API)
6. Uruchomienie testów i weryfikacja pokrycia

**Rezultat:** Kod jest pokryty testami, mniej bugów.

---

### Krok 20: Finalizacja i dokumentacja
1. Code review kodu
2. Refactoring (usunięcie duplikacji, clean up)
3. Dodanie komentarzy JSDoc
4. Utworzenie dokumentacji komponentów (Storybook opcjonalnie)
5. Aktualizacja README jeśli potrzebne
6. Finalne testy manualne
7. Deploy na staging
8. QA testing

**Rezultat:** Widok jest gotowy do produkcji, dobrze udokumentowany.

---

## Podsumowanie

Powyższy plan implementacji zapewnia kompleksowy przewodnik dla programisty frontendowego do stworzenia widoku Dashboard - Lista podsumowań. Plan uwzględnia wszystkie wymagania funkcjonalne z PRD, user stories oraz szczegóły techniczne integracji z API. Implementacja powinna być przeprowadzana krok po kroku, z testowaniem każdego komponentu przed przejściem do kolejnego kroku.
