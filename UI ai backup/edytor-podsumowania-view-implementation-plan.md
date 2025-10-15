# Plan implementacji widoku Edytor podsumowania

## 1. Przegląd

Widok Edytor podsumowania umożliwia użytkownikom tworzenie nowych manualnych podsumowań artykułów naukowych oraz edycję istniejących podsumowań (zarówno manualnych, jak i wygenerowanych przez AI). Widok oferuje ustrukturyzowany edytor z sześcioma predefiniowanymi sekcjami: Cel badań, Metody, Wyniki, Dyskusja, Otwarte pytania i Wnioski. Kluczowe funkcjonalności to: edytowalny tytuł, śledzenie niezapisanych zmian (dirty flag), automatyczne zapisywanie do bazy danych oraz ostrzeżenie przed opuszczeniem strony z niezapisanymi zmianami.

## 2. Routing widoku

- **Tworzenie nowego podsumowania:** `/summaries/new`
- **Edycja istniejącego podsumowania:** `/summaries/[id]` (gdzie `id` to UUID podsumowania)

Routing będzie obsługiwany przez Astro z dynamicznymi ścieżkami:
- `src/pages/summaries/new.astro` - dla nowych podsumowań
- `src/pages/summaries/[id].astro` - dla edycji istniejących podsumowań

## 3. Struktura komponentów

```
SummaryEditorPage (Astro)
├── SummaryEditor (React)
    ├── EditorHeader (React)
    │   ├── TitleInput (React)
    │   └── SaveButton (shadcn/ui Button)
    ├── EditorTabs (shadcn/ui Tabs)
    │   ├── TabsList
    │   │   ├── TabsTrigger (x6 - dla każdej sekcji)
    │   └── TabsContent (x6)
    │       └── RichTextEditor (React)
    ├── DirtyFlagIndicator (React)
    └── BeforeUnloadWarning (React hook effect)
```

## 4. Szczegóły komponentów

### SummaryEditorPage (Astro)

**Opis:** Główna strona Astro obsługująca routing i pobieranie początkowych danych dla edytora. Dla nowych podsumowań inicjalizuje pusty szablon, dla istniejących pobiera dane z API.

**Główne elementy:**
- Logika server-side do weryfikacji autentykacji użytkownika
- Pobieranie danych podsumowania (dla trybu edycji) poprzez `GET /api/summaries/:id`
- Inicjalizacja pustego szablonu (dla trybu tworzenia)
- Layout aplikacji z głównym komponentem React `SummaryEditor`

**Obsługiwane interakcje:**
- Weryfikacja autentykacji przed renderowaniem
- Przekierowanie do logowania jeśli użytkownik nie jest zalogowany
- Obsługa błędów ładowania danych (404, 403)

**Warunki walidacji:**
- Sprawdzenie czy użytkownik jest zalogowany (locals.user)
- W trybie edycji: walidacja formatu UUID parametru `id`
- W trybie edycji: sprawdzenie czy podsumowanie istnieje i należy do użytkownika

**Typy:**
- `SummaryDetailDTO` (dla trybu edycji)
- `SummaryContentDTO` (struktura zawartości)
- `ApiErrorDTO` (obsługa błędów)

**Propsy:** N/A (strona Astro)

---

### SummaryEditor (React)

**Opis:** Główny komponent kontenerowy zarządzający stanem edytora, logiką zapisywania i koordynacją podkomponentów. Odpowiada za zarządzanie stanem formularza, śledzenie zmian i komunikację z API.

**Główne elementy:**
- `<form>` element jako kontener
- `EditorHeader` - nagłówek z tytułem i przyciskiem zapisu
- `EditorTabs` - zakładki z sekcjami treści
- `DirtyFlagIndicator` - wskaźnik niezapisanych zmian
- Toast notifications dla komunikatów zwrotnych

**Obsługiwane interakcje:**
- Inicjalizacja formularza z danymi przekazanymi z Astro
- Śledzenie zmian w polach (dirty tracking)
- Obsługa zapisywania formularza (POST dla nowych, PATCH dla istniejących)
- Blokada nawigacji przy niezapisanych zmianach
- Wyświetlanie komunikatów sukcesu/błędu

**Warunki walidacji:**
- Tytuł nie może być pusty (min 1 znak po trim)
- Tytuł max 500 znaków
- Każda sekcja content max 50,000 znaków
- Co najmniej jedno pole musi być wypełnione aby zapisać

**Typy:**
- `EditorFormData` (ViewModel)
- `CreateManualSummaryCommand` (request dla POST)
- `UpdateSummaryCommand` (request dla PATCH)
- `SummaryDetailDTO` (response)

**Propsy:**
```typescript
interface SummaryEditorProps {
  initialData?: SummaryDetailDTO; // undefined dla nowego, wypełnione dla edycji
  mode: 'create' | 'edit';
  summaryId?: string; // wymagane dla mode='edit'
}
```

---

### EditorHeader (React)

**Opis:** Sticky nagłówek zawierający edytowalny tytuł podsumowania i przycisk zapisywania. Pozostaje widoczny podczas przewijania strony.

**Główne elementy:**
- `<header>` z klasami sticky positioning (Tailwind)
- `TitleInput` - pole do edycji tytułu
- `SaveButton` - przycisk zapisu ze stanem loading
- Badge lub tekst wskazujący typ podsumowania (AI/Manual)

**Obsługiwane interakcje:**
- Edycja tytułu z walidacją w czasie rzeczywistym
- Wyświetlanie stanu zapisywania (loading spinner)
- Automatyczne focus na tytule przy tworzeniu nowego podsumowania

**Warunki walidacji:**
- Tytuł wymagany (nie może być pusty)
- Tytuł max 500 znaków
- Walidacja w czasie rzeczywistym z komunikatami błędów

**Typy:**
- `string` dla tytułu
- `boolean` dla stanu isDirty
- `boolean` dla stanu isSaving

**Propsy:**
```typescript
interface EditorHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  isDirty: boolean;
  creationType?: 'manual' | 'ai';
}
```

---

### TitleInput (React)

**Opis:** Pole tekstowe do edycji tytułu podsumowania z walidacją i komunikatami błędów.

**Główne elementy:**
- `<input type="text">` z obsługą controlled component
- Label z wymaganym wskaźnikiem (*)
- Komunikat błędu walidacji
- Licznik znaków (opcjonalnie)

**Obsługiwane interakcje:**
- onChange z debouncing dla aktualizacji stanu
- Walidacja po stracie focusu (onBlur)
- Wyświetlanie błędów walidacji

**Warunki walidacji:**
- Nie może być puste po trim
- Maksymalnie 500 znaków
- Wyświetlanie błędów inline pod polem

**Typy:**
- `string` dla wartości
- `string | null` dla błędu walidacji

**Propsy:**
```typescript
interface TitleInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}
```

---

### SaveButton (shadcn/ui Button)

**Opis:** Przycisk zapisywania z obsługą stanów disabled, loading i visual feedback.

**Główne elementy:**
- Button component z shadcn/ui
- Loading spinner (gdy isSaving=true)
- Ikona sukcesu (gdy ostatni zapis się powiódł)

**Obsługiwane interakcje:**
- Kliknięcie wywołuje funkcję zapisu
- Disabled gdy brak zmian lub trwa zapisywanie
- Loading state podczas wykonywania zapisu

**Warunki walidacji:**
- Disabled gdy isDirty=false (brak zmian)
- Disabled gdy isSaving=true (trwa zapisywanie)
- Disabled gdy formularz zawiera błędy walidacji

**Typy:**
- `boolean` dla isDirty, isSaving, hasErrors

**Propsy:**
```typescript
interface SaveButtonProps {
  onClick: () => Promise<void>;
  disabled: boolean;
  isLoading: boolean;
}
```

---

### EditorTabs (shadcn/ui Tabs)

**Opis:** Komponent zakładek zawierający sześć sekcji podsumowania naukowego. Każda zakładka zawiera dedykowany edytor tekstu.

**Główne elementy:**
- `Tabs` root component (shadcn/ui)
- `TabsList` - lista przycisków zakładek
- `TabsTrigger` (x6) - przyciski dla każdej sekcji
- `TabsContent` (x6) - panele zawartości z edytorami

**Obsługiwane interakcje:**
- Przełączanie między zakładkami
- Zapamiętywanie aktywnej zakładki
- Wskaźniki wypełnienia sekcji (opcjonalnie)

**Warunki walidacji:**
- Każda sekcja maksymalnie 50,000 znaków
- Walidacja przekazywana do RichTextEditor

**Typy:**
- `SummaryContentDTO` dla wszystkich sekcji
- `string` dla aktywnej zakładki

**Propsy:**
```typescript
interface EditorTabsProps {
  content: SummaryContentDTO;
  onChange: (field: keyof SummaryContentDTO, value: string) => void;
  errors?: Partial<Record<keyof SummaryContentDTO, string>>;
  disabled?: boolean;
}
```

**Lista sekcji:**
1. Cel badań (research_objective)
2. Metody (methods)
3. Wyniki (results)
4. Dyskusja (discussion)
5. Otwarte pytania (open_questions)
6. Wnioski (conclusions)

---

### RichTextEditor (React)

**Opis:** Edytor WYSIWYG do wprowadzania i formatowania treści w poszczególnych sekcjach. W MVP może być prostym textarea, w przyszłości biblioteka jak Tiptap lub Lexical.

**Główne elementy:**
- `<textarea>` (MVP) lub rich text editor component
- Toolbar z podstawowym formatowaniem (opcjonalnie)
- Licznik znaków
- Komunikat błędu walidacji

**Obsługiwane interakcje:**
- Wprowadzanie i edycja tekstu
- Formatowanie tekstu (opcjonalnie w MVP)
- Autosave draft (opcjonalnie poza MVP)
- Walidacja długości treści

**Warunki walidacji:**
- Maksymalnie 50,000 znaków
- Wyświetlanie licznika gdy zbliża się limit (np. powyżej 45,000)
- Blokada wprowadzania gdy osiągnięto limit

**Typy:**
- `string` dla zawartości
- `string | null` dla błędu

**Propsy:**
```typescript
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  error?: string;
  disabled?: boolean;
  label: string;
}
```

---

### DirtyFlagIndicator (React)

**Opis:** Wizualny wskaźnik informujący użytkownika o niezapisanych zmianach w formularzu.

**Główne elementy:**
- Małe badge lub tekst "Niezapisane zmiany"
- Ikona (opcjonalnie)
- Animacja przy zmianie stanu

**Obsługiwane interakcje:**
- Automatyczne pokazywanie gdy isDirty=true
- Ukrywanie po zapisaniu
- Opcjonalnie: wskaźnik czasu ostatniego zapisu

**Warunki walidacji:**
- Nie dotyczy (tylko wyświetlanie)

**Typy:**
- `boolean` dla isDirty
- `Date | null` dla lastSaved (opcjonalnie)

**Propsy:**
```typescript
interface DirtyFlagIndicatorProps {
  isDirty: boolean;
  lastSaved?: Date;
}
```

---

### BeforeUnloadWarning (React hook/effect)

**Opis:** Hook lub komponent bez UI zarządzający ostrzeżeniem przeglądarki przed opuszczeniem strony z niezapisanymi zmianami.

**Główne elementy:**
- useEffect z obsługą window.onbeforeunload
- useEffect z obsługą Astro router (jeśli dotyczy)
- Cleanup przy unmount

**Obsługiwane interakcje:**
- Wykrywanie próby opuszczenia strony (close tab, refresh, navigation)
- Wyświetlanie natywnego dialogu przeglądarki
- Pozwolenie na nawigację po zapisaniu (isDirty=false)

**Warunki walidacji:**
- Aktywne tylko gdy isDirty=true
- Wyłączone po zapisaniu lub jawnej rezygnacji

**Typy:**
- `boolean` dla isDirty

**Propsy:**
```typescript
interface UseBeforeUnloadWarningProps {
  isDirty: boolean;
  message?: string;
}
```

## 5. Typy

### ViewModel Types

```typescript
/**
 * Stan formularza edytora - wewnętrzna reprezentacja danych
 */
interface EditorFormData {
  title: string;
  content: SummaryContentDTO;
}

/**
 * Stan walidacji formularza
 */
interface EditorValidationErrors {
  title?: string;
  content?: Partial<Record<keyof SummaryContentDTO, string>>;
}

/**
 * Pełny stan edytora
 */
interface EditorState {
  data: EditorFormData;
  errors: EditorValidationErrors;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  activeTab: keyof SummaryContentDTO;
}
```

### API Types (z types.ts)

**Request types:**
- `CreateManualSummaryCommand` - dla POST /api/summaries
- `UpdateSummaryCommand` - dla PATCH /api/summaries/:id

**Response types:**
- `SummaryDetailDTO` - dla GET i odpowiedzi POST/PATCH
- `ApiErrorDTO` - dla błędów

**Shared types:**
- `SummaryContentDTO` - struktura zawartości podsumowania

### Validation Types

```typescript
/**
 * Konfiguracja walidacji pól
 */
interface FieldValidationConfig {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => string | null;
}

/**
 * Mapa konfiguracji walidacji dla wszystkich pól
 */
type ValidationConfig = {
  title: FieldValidationConfig;
  content: Record<keyof SummaryContentDTO, FieldValidationConfig>;
};
```

## 6. Zarządzanie stanem

### Custom Hook: `useSummaryEditor`

Zalecane utworzenie dedykowanego hooka zarządzającego całą logiką edytora:

```typescript
function useSummaryEditor(initialData?: SummaryDetailDTO, mode: 'create' | 'edit', summaryId?: string) {
  // Stan formularza
  const [formData, setFormData] = useState<EditorFormData>({
    title: initialData?.title || '',
    content: initialData?.content || createEmptyContent(),
  });
  
  // Stan UI
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<EditorValidationErrors>({});
  const [activeTab, setActiveTab] = useState<keyof SummaryContentDTO>('research_objective');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Funkcje pomocnicze
  const createEmptyContent = (): SummaryContentDTO => ({
    research_objective: '',
    methods: '',
    results: '',
    discussion: '',
    open_questions: '',
    conclusions: '',
  });
  
  // Walidacja
  const validateField = (field: string, value: string): string | null => {
    // Logika walidacji
  };
  
  const validateForm = (): boolean => {
    // Pełna walidacja formularza
  };
  
  // Obsługa zmian
  const updateTitle = (title: string) => {
    setFormData(prev => ({ ...prev, title }));
    setIsDirty(true);
  };
  
  const updateContent = (field: keyof SummaryContentDTO, value: string) => {
    setFormData(prev => ({
      ...prev,
      content: { ...prev.content, [field]: value }
    }));
    setIsDirty(true);
  };
  
  // Zapis
  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      if (mode === 'create') {
        const response = await fetch('/api/summaries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
          } as CreateManualSummaryCommand),
        });
        
        if (!response.ok) throw new Error('Failed to create summary');
        
        const data: SummaryDetailDTO = await response.json();
        // Przekierowanie do edycji
        window.location.href = `/summaries/${data.id}`;
      } else {
        const response = await fetch(`/api/summaries/${summaryId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
          } as UpdateSummaryCommand),
        });
        
        if (!response.ok) throw new Error('Failed to update summary');
        
        setIsDirty(false);
        setLastSaved(new Date());
        // Toast notification
      }
    } catch (error) {
      // Obsługa błędów
    } finally {
      setIsSaving(false);
    }
  };
  
  return {
    formData,
    isDirty,
    isSaving,
    errors,
    activeTab,
    lastSaved,
    updateTitle,
    updateContent,
    setActiveTab,
    handleSave,
  };
}
```

### Struktura stanu

- **formData**: Dane formularza (tytuł + content)
- **isDirty**: Flaga niezapisanych zmian
- **isSaving**: Flaga procesu zapisywania
- **errors**: Obiekt z błędami walidacji
- **activeTab**: Aktywna zakładka edytora
- **lastSaved**: Timestamp ostatniego zapisu

### Biblioteki do zarządzania stanem

Dla MVP wystarczy lokalny stan React (useState). Opcjonalnie można rozważyć:
- **React Hook Form** - jeśli formularz stanie się bardziej złożony
- **Zustand** - dla globalnego stanu aplikacji (jeśli potrzebny)

## 7. Integracja API

### Endpoint: GET /api/summaries/:id (tryb edycji)

**Kiedy:** Przy wejściu na stronę edycji istniejącego podsumowania

**Request:**
- Method: GET
- Path: `/api/summaries/${id}`
- Headers: Cookie z sesją użytkownika (automatycznie)

**Response:** 
```typescript
// Success (200)
SummaryDetailDTO {
  id: string;
  title: string;
  content: SummaryContentDTO;
  creation_type: 'manual' | 'ai';
  ai_model_name: string | null;
  created_at: string;
  updated_at: string;
}

// Error (404)
ApiErrorDTO {
  error: {
    code: 'NOT_FOUND';
    message: 'Summary not found';
  }
}

// Error (403)
ApiErrorDTO {
  error: {
    code: 'FORBIDDEN';
    message: 'Permission denied';
  }
}
```

**Obsługa:**
- Wywołanie w getStaticProps/getServerSideProps (Astro server-side)
- Przekazanie danych jako props do komponentu React
- Obsługa błędów 404 i 403 poprzez przekierowanie lub error page

---

### Endpoint: POST /api/summaries (tryb tworzenia)

**Kiedy:** Po kliknięciu "Zapisz" w nowym podsumowaniu

**Request:**
- Method: POST
- Path: `/api/summaries`
- Headers: 
  - Content-Type: application/json
  - Cookie (sesja)
- Body:
```typescript
CreateManualSummaryCommand {
  title: string; // 1-500 znaków
  content: SummaryContentDTO; // wszystkie pola wymagane
}
```

**Response:**
```typescript
// Success (201)
SummaryDetailDTO {
  id: string;
  title: string;
  content: SummaryContentDTO;
  creation_type: 'manual';
  ai_model_name: null;
  created_at: string;
  updated_at: string;
}

// Error (400)
ApiErrorDTO {
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    field?: string;
    details?: object;
  }
}
```

**Obsługa:**
- Po sukcesie: przekierowanie do `/summaries/${response.id}` (tryb edycji)
- Toast notification o sukcesie
- Po błędzie: wyświetlenie komunikatu błędu, pozostanie w formularzu

---

### Endpoint: PATCH /api/summaries/:id (zapisywanie zmian)

**Kiedy:** Po kliknięciu "Zapisz" w istniejącym podsumowaniu

**Request:**
- Method: PATCH
- Path: `/api/summaries/${id}`
- Headers:
  - Content-Type: application/json
  - Cookie (sesja)
- Body (partial update):
```typescript
UpdateSummaryCommand {
  title?: string;
  content?: Partial<SummaryContentDTO>;
}
```

**Response:**
```typescript
// Success (200)
SummaryDetailDTO {
  id: string;
  title: string;
  content: SummaryContentDTO;
  creation_type: 'manual' | 'ai';
  ai_model_name: string | null;
  created_at: string;
  updated_at: string;
}

// Error (400, 404, 403) - jak wyżej
```

**Obsługa:**
- Po sukcesie: 
  - Aktualizacja isDirty na false
  - Aktualizacja lastSaved
  - Toast notification "Zapisano pomyślnie"
- Po błędzie: komunikat błędu, dane pozostają w formularzu

## 8. Interakcje użytkownika

### 1. Wejście do edytora (nowe podsumowanie)

**Akcja:** Użytkownik klika "Stwórz puste podsumowanie" na Dashboard

**Przebieg:**
1. Nawigacja do `/summaries/new`
2. Renderowanie edytora z pustym formularzem
3. Auto-focus na polu tytułu
4. Wszystkie 6 sekcji content puste
5. Przycisk "Zapisz" disabled (brak zmian)

**Stan początkowy:**
- title: ""
- content: wszystkie pola ""
- isDirty: false
- activeTab: 'research_objective'

---

### 2. Wejście do edytora (edycja istniejącego)

**Akcja:** Użytkownik klika na podsumowanie na liście lub "Edytuj"

**Przebieg:**
1. Nawigacja do `/summaries/${id}`
2. Server-side: fetch danych z GET /api/summaries/:id
3. Renderowanie edytora z wypełnionym formularzem
4. Przycisk "Zapisz" disabled (brak zmian)
5. Badge/wskaźnik typu (Manual/AI)

**Stan początkowy:**
- title: z bazy danych
- content: z bazy danych
- isDirty: false
- lastSaved: updated_at z bazy

---

### 3. Edycja tytułu

**Akcja:** Użytkownik wpisuje/modyfikuje tytuł

**Przebieg:**
1. onChange event w TitleInput
2. Walidacja w czasie rzeczywistym:
   - Sprawdzenie długości (max 500)
   - Sprawdzenie czy nie pusty
3. Aktualizacja stanu: isDirty = true
4. Przycisk "Zapisz" staje się aktywny
5. DirtyFlagIndicator pojawia się
6. Błędy walidacji wyświetlane inline

---

### 4. Edycja sekcji content

**Akcja:** Użytkownik wprowadza tekst w RichTextEditor

**Przebieg:**
1. Przełączenie na wybraną zakładkę (jeśli potrzeba)
2. onChange event w RichTextEditor
3. Walidacja długości (max 50,000 znaków)
4. Aktualizacja stanu content[field]
5. isDirty = true
6. Przycisk "Zapisz" aktywny
7. Licznik znaków aktualizowany

---

### 5. Zapisywanie (nowe podsumowanie)

**Akcja:** Użytkownik klika "Zapisz"

**Przebieg:**
1. Walidacja formularza:
   - Tytuł niepusty i ≤500 znaków
   - Wszystkie sekcje ≤50,000 znaków
2. isSaving = true (button loading state)
3. POST /api/summaries z CreateManualSummaryCommand
4. Success:
   - Przekierowanie do `/summaries/${newId}`
   - Toast: "Podsumowanie zapisane pomyślnie"
5. Error:
   - isSaving = false
   - Toast z błędem
   - Pozostanie w formularzu z danymi

---

### 6. Zapisywanie (edycja istniejącego)

**Akcja:** Użytkownik klika "Zapisz"

**Przebieg:**
1. Walidacja jak wyżej
2. isSaving = true
3. PATCH /api/summaries/:id z UpdateSummaryCommand
4. Success:
   - isDirty = false
   - lastSaved = now
   - Toast: "Zmiany zapisane"
   - Pozostanie w edytorze
5. Error:
   - isSaving = false
   - Toast z błędem

---

### 7. Próba opuszczenia z niezapisanymi zmianami

**Akcja:** Użytkownik próbuje:
- Zamknąć kartę
- Odświeżyć stronę
- Nawigować do innej strony

**Przebieg:**
1. beforeunload event handler sprawdza isDirty
2. Jeśli isDirty = true:
   - Natywny dialog przeglądarki: "Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę?"
3. Użytkownik wybiera:
   - "Zostań" → pozostaje w edytorze
   - "Opuść" → nawigacja, dane tracone

---

### 8. Przełączanie między zakładkami

**Akcja:** Użytkownik klika na inną zakładkę sekcji

**Przebieg:**
1. Click event na TabsTrigger
2. Aktualizacja activeTab
3. Załadowanie odpowiedniej zawartości w TabsContent
4. Zachowanie niezapisanych zmian w poprzedniej zakładce

---

### 9. Walidacja w czasie rzeczywistym

**Interakcja:** Użytkownik przekracza limit znaków

**Przebieg:**
1. onChange w polu
2. Sprawdzenie długości
3. Jeśli > maxLength:
   - Wyświetlenie błędu pod polem
   - Licznik znaków czerwony
   - Przycisk "Zapisz" disabled
4. Opcjonalnie: blokada wprowadzania dalszych znaków

## 9. Warunki i walidacja

### Walidacja tytułu (TitleInput)

**Komponenty:** TitleInput, EditorHeader, SummaryEditor

**Warunki:**
- **Wymagane:** Tytuł nie może być pusty po trim
- **Długość:** Min 1 znak, max 500 znaków
- **Timing:** Walidacja onBlur i przed zapisem

**Wpływ na UI:**
- Błąd walidacji wyświetlany pod polem (text-red-600)
- Przycisk "Zapisz" disabled gdy błąd
- Border inputa czerwony przy błędzie

**Komunikaty:**
- "Tytuł jest wymagany" (gdy puste)
- "Tytuł nie może przekraczać 500 znaków" (gdy za długi)

---

### Walidacja sekcji content (RichTextEditor)

**Komponenty:** RichTextEditor, EditorTabs, SummaryEditor

**Warunki:**
- **Długość:** Max 50,000 znaków na sekcję
- **Format:** Akceptowany plain text lub formatted HTML (zależnie od editora)
- **Timing:** Walidacja onChange (dla licznika) i przed zapisem

**Wpływ na UI:**
- Licznik znaków: 
  - Normalny (< 45,000): text-gray-600
  - Ostrzeżenie (45,000-49,999): text-orange-600
  - Błąd (≥50,000): text-red-600
- Border textarea czerwony przy przekroczeniu
- Komunikat błędu pod polem
- Przycisk "Zapisz" disabled

**Komunikaty:**
- "Ta sekcja nie może przekraczać 50,000 znaków (aktualnie: {count})"

---

### Walidacja przed zapisem (SummaryEditor)

**Komponenty:** SummaryEditor (hook useSummaryEditor)

**Warunki:**
- Tytuł niepusty i ≤500 znaków
- Wszystkie 6 sekcji content ≤50,000 znaków
- Co najmniej jedno pole musi różnić się od stanu początkowego (dla edycji)

**Wpływ na UI:**
- Przycisk "Zapisz" disabled gdy:
  - isDirty = false (brak zmian)
  - Istnieją błędy walidacji
  - isSaving = true (trwa zapisywanie)
- Tooltip na disabled button wyjaśniający powód

**Komunikaty:**
- "Wprowadź zmiany aby zapisać" (brak zmian)
- "Popraw błędy przed zapisaniem" (błędy walidacji)

---

### Walidacja dirty flag (BeforeUnloadWarning)

**Komponenty:** BeforeUnloadWarning hook

**Warunki:**
- isDirty = true (są niezapisane zmiany)
- Użytkownik próbuje opuścić stronę

**Wpływ na UI:**
- Natywny dialog przeglądarki z ostrzeżeniem
- Blokada nawigacji do potwierdzenia

**Komunikaty:**
- Standardowy komunikat przeglądarki: "Masz niezapisane zmiany. Czy na pewno chcesz opuścić tę stronę?"

---

### Walidacja API (server-side)

**Wykonywana przez:** Backend (POST/PATCH endpoints)

**Warunki:**
- Duplikacja walidacji frontend (tytuł, content)
- Sprawdzenie własności podsumowania (userId)
- Sprawdzenie istnienia rekordu (dla PATCH)

**Wpływ na UI:**
- Błędy 400: wyświetlenie szczegółów walidacji z API
- Błędy 403: komunikat "Brak uprawnień"
- Błędy 404: komunikat "Podsumowanie nie znalezione"
- Toast notification z treścią błędu

## 10. Obsługa błędów

### 1. Błędy ładowania danych (GET /api/summaries/:id)

**Scenariusz:** Niepowodzenie pobrania danych istniejącego podsumowania

**Możliwe przyczyny:**
- 404: Podsumowanie nie istnieje
- 403: Użytkownik nie ma dostępu
- 401: Brak autentykacji
- 500: Błąd serwera

**Obsługa:**
- **Server-side (Astro):**
  - 404: Przekierowanie do `/summaries` z parametrem `?error=not-found`
  - 403: Przekierowanie do `/summaries` z parametrem `?error=forbidden`
  - 401: Przekierowanie do `/login`
  - 500: Renderowanie error page z możliwością retry
- **UI:**
  - Toast notification z opisem błędu
  - Możliwość powrotu do Dashboard

---

### 2. Błędy walidacji (client-side)

**Scenariusz:** Użytkownik wprowadza nieprawidłowe dane

**Możliwe przypadki:**
- Pusty tytuł
- Tytuł > 500 znaków
- Sekcja content > 50,000 znaków

**Obsługa:**
- Walidacja w czasie rzeczywistym (onChange/onBlur)
- Wyświetlenie komunikatów inline pod polami
- Wizualne oznaczenie błędnych pól (border czerwony)
- Disabled przycisk "Zapisz"
- Brak możliwości submitu formularza

---

### 3. Błędy walidacji (API 400)

**Scenariusz:** Backend odrzuca dane mimo walidacji frontend

**Możliwe przyczyny:**
- Niezgodność walidacji frontend/backend
- Dane zmodyfikowane przed wysłaniem
- Błędy w strukturze JSON

**Obsługa:**
- Parse response JSON z ApiErrorDTO
- Mapowanie błędów do odpowiednich pól formularza
- Wyświetlenie szczegółów błędu w Toast
- Highlight pola z błędem (jeśli field określone)
- Umożliwienie korekty i ponownego zapisu

**Przykład:**
```typescript
if (response.status === 400) {
  const error: ApiErrorDTO = await response.json();
  if (error.error.field === 'title') {
    setErrors(prev => ({ ...prev, title: error.error.message }));
  }
  showToast('error', error.error.message);
}
```

---

### 4. Błędy uprawnień (403)

**Scenariusz:** Użytkownik próbuje edytować cudze podsumowanie

**Obsługa:**
- Toast: "Nie masz uprawnień do edycji tego podsumowania"
- Przekierowanie do `/summaries` po 2 sekundach
- Logowanie incydentu (opcjonalnie)

---

### 5. Błędy zapisu (POST/PATCH)

**Scenariusz:** Niepowodzenie zapisu pomimo poprawnych danych

**Możliwe przyczyny:**
- Błąd bazy danych
- Problemy z połączeniem
- Timeout
- Konflikt danych (race condition)

**Obsługa:**
- Zatrzymanie loading state (isSaving = false)
- Toast: "Nie udało się zapisać podsumowania. Spróbuj ponownie."
- Zachowanie danych w formularzu (brak czyszczenia)
- Możliwość retry (ponowne kliknięcie "Zapisz")
- Opcjonalnie: lokalny backup do localStorage

**Przykład:**
```typescript
catch (error) {
  setIsSaving(false);
  
  // Backup do localStorage
  localStorage.setItem('summary-draft', JSON.stringify(formData));
  
  showToast('error', 'Nie udało się zapisać. Dane zachowane lokalnie.');
}
```

---

### 6. Błędy sieciowe

**Scenariusz:** Brak połączenia z internetem

**Obsługa:**
- Wykrycie błędu fetch (Network error)
- Toast: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
- Ikona offline (opcjonalnie)
- Automatyczny retry po powrocie połączenia (opcjonalnie)

---

### 7. Utrata sesji podczas edycji

**Scenariusz:** Sesja użytkownika wygasła podczas pracy

**Obsługa:**
- API zwraca 401
- Zapisanie draft do localStorage
- Przekierowanie do `/login` z parametrem `?redirect=/summaries/new&draft=true`
- Po ponownym logowaniu: odtworzenie danych z localStorage
- Toast: "Sesja wygasła. Zaloguj się ponownie aby kontynuować."

---

### 8. Edge case: Równoczesna edycja

**Scenariusz:** Użytkownik edytuje to samo podsumowanie w dwóch kartach

**Obsługa (MVP):**
- Ostrzeżenie przy otwarciu drugiej karty (opcjonalnie)
- Ostatni zapis nadpisuje poprzednie (Last-Write-Wins)
- W przyszłości: optimistic locking lub conflict resolution

---

### 9. Błędy walidacji specyficzne dla sekcji

**Scenariusz:** Specyficzne wymagania dla poszczególnych sekcji (przyszłość)

**Możliwa obsługa:**
- Customowa walidacja per sekcja
- Różne limity znaków
- Wymagane pola vs opcjonalne
- Walidacja formatowania (np. lista w "Wyniki")

## 11. Kroki implementacji

### Faza 1: Struktura i routing

1. **Utworzenie struktury plików**
   - `src/pages/summaries/new.astro`
   - `src/pages/summaries/[id].astro`
   - `src/components/SummaryEditor.tsx`

2. **Konfiguracja routingu w Astro**
   - Implementacja dynamicznych ścieżek
   - Middleware dla weryfikacji autentykacji

3. **Utworzenie struktury katalogów komponentów**
   - `src/components/editor/` - dla komponentów edytora
   - `src/components/editor/hooks/` - dla custom hooks

### Faza 2: Komponenty UI (od najmniejszych do największych)

4. **Implementacja komponentów Shadcn/ui**
   - Dodanie Tabs component (jeśli brak): `npx shadcn-ui@latest add tabs`
   - Dodanie Input component (jeśli brak): `npx shadcn-ui@latest add input`
   - Dodanie Textarea component (jeśli brak): `npx shadcn-ui@latest add textarea`
   - Dodanie Badge component: `npx shadcn-ui@latest add badge`
   - Dodanie Toast component: `npx shadcn-ui@latest add toast`

5. **TitleInput component**
   - Implementacja controlled input
   - Walidacja inline
   - Komunikaty błędów
   - Licznik znaków

6. **RichTextEditor component**
   - MVP: `<textarea>` z autosize
   - Walidacja długości
   - Licznik znaków
   - Placeholder tekst

7. **SaveButton component**
   - Wykorzystanie Button z shadcn/ui
   - Loading state z spinnerem
   - Disabled states
   - Tooltip dla disabled state

8. **DirtyFlagIndicator component**
   - Badge lub tekst wskaźnika
   - Animacje show/hide
   - Opcjonalnie: timestamp ostatniego zapisu

### Faza 3: Komponenty kompozytowe

9. **EditorHeader component**
   - Layout sticky header (Tailwind)
   - Integracja TitleInput
   - Integracja SaveButton
   - Badge typu podsumowania

10. **EditorTabs component**
    - Konfiguracja Tabs z shadcn/ui
    - 6 TabsTrigger dla sekcji
    - 6 TabsContent z RichTextEditor
    - Mapowanie danych SummaryContentDTO

### Faza 4: Logika i stan

11. **Custom hook: useSummaryEditor**
    - Stan formularza (title, content)
    - Stan UI (isDirty, isSaving, errors, activeTab)
    - Funkcje update (updateTitle, updateContent)
    - Logika walidacji (validateField, validateForm)
    - Funkcja handleSave z integracją API

12. **Custom hook: useBeforeUnloadWarning**
    - useEffect z window.beforeunload
    - Conditional warning based na isDirty
    - Cleanup on unmount

### Faza 5: Główny kontener

13. **SummaryEditor component**
    - Integracja useSummaryEditor hook
    - Renderowanie EditorHeader
    - Renderowanie EditorTabs
    - Renderowanie DirtyFlagIndicator
    - Integracja useBeforeUnloadWarning
    - Error boundaries

### Faza 6: Strony Astro i integracja

14. **new.astro - strona tworzenia**
    - Weryfikacja autentykacji (server-side)
    - Inicjalizacja pustego stanu
    - Przekazanie props mode='create'
    - Layout aplikacji

15. **[id].astro - strona edycji**
    - Weryfikacja autentykacji
    - Walidacja UUID parametru id
    - Fetch danych z GET /api/summaries/:id
    - Obsługa błędów (404, 403, 500)
    - Przekazanie props mode='edit' i initialData
    - Layout aplikacji

### Faza 7: Integracja API

16. **Implementacja wywołań API w useSummaryEditor**
    - POST /api/summaries dla trybu create
    - PATCH /api/summaries/:id dla trybu edit
    - GET /api/summaries/:id w Astro server-side
    - Obsługa response i errors
    - Parsowanie ApiErrorDTO

17. **Error handling**
    - Try-catch dla fetch
    - Mapowanie błędów API do UI
    - Toast notifications
    - Fallback UI dla błędów

### Faza 8: Walidacja

18. **Walidacja client-side**
    - Implementacja validateField w hook
    - Implementacja validateForm
    - Real-time validation onChange/onBlur
    - Wyświetlanie błędów w UI

19. **Integracja z walidacją API**
    - Parsowanie błędów z backend
    - Mapowanie field errors
    - Wyświetlanie szczegółów walidacji

### Faza 9: UX enhancements

20. **Toast notifications**
    - Konfiguracja Toaster
    - Notifications dla sukcesu zapisu
    - Notifications dla błędów
    - Różne typy (success, error, warning)

21. **Loading states**
    - Skeleton loader dla ładowania danych (opcjonalnie)
    - Loading spinner w SaveButton
    - Disabled state podczas isSaving
    - Optimistic UI updates (opcjonalnie)

22. **Accessibility**
    - ARIA labels dla wszystkich pól
    - Keyboard navigation w Tabs
    - Focus management
    - Screen reader announcements dla błędów

### Faza 10: Testowanie i debugging

23. **Manual testing**
    - Test flow tworzenia nowego podsumowania
    - Test flow edycji istniejącego
    - Test walidacji wszystkich pól
    - Test zapisywania (sukces i błędy)
    - Test beforeunload warning
    - Test przełączania zakładek
    - Test na różnych rozmiarach ekranu (responsive)

24. **Edge cases testing**
    - Bardzo długie tytuły i treści
    - Znaki specjalne w tekście
    - Równoczesna edycja w dwóch kartach
    - Utrata sesji podczas edycji
    - Brak połączenia sieciowego
    - Wolne połączenie (throttling)

25. **Browser compatibility**
    - Test w Chrome, Firefox, Safari, Edge
    - Test beforeunload w różnych przeglądarkach
    - Test responsywności na mobile

### Faza 11: Optymalizacja i polish

26. **Performance optimization**
    - Debouncing dla onChange w polach tekstowych
    - Lazy loading dla RichTextEditor (jeśli heavy)
    - Memoizacja komponentów (React.memo)
    - useCallback dla event handlers

27. **Code cleanup**
    - Refactoring powielającego się kodu
    - Dodanie komentarzy i dokumentacji
    - Type safety check (TypeScript strict mode)
    - Linting i formatting

28. **Final polish**
    - Animacje transitions (Tailwind)
    - Micro-interactions (hover states, focus rings)
    - Konsystentne spacing i typography
    - Final review UX/UI

### Faza 12: Dokumentacja i deployment

29. **Dokumentacja**
    - README dla komponentów
    - Komentarze w kodzie
    - Dokumentacja API integration
    - Storybook dla komponentów (opcjonalnie)

30. **Deployment preparation**
    - Build test
    - Environment variables check
    - Final smoke test na staging
    - Deployment do produkcji

---

## Uwagi końcowe

- **MVP Focus:** W pierwszej iteracji skupić się na podstawowej funkcjonalności (plain textarea zamiast rich text editor)
- **Progressive Enhancement:** Zaawansowane features (auto-save, rich formatting) można dodać w kolejnych iteracjach
- **Accessibility First:** Zapewnić pełną dostępność dla użytkowników korzystających z czytników ekranu
- **Mobile Responsive:** Zapewnić komfortową edycję na urządzeniach mobilnych (większe pola touch targets)
- **Error Recovery:** Implementować lokalny backup do localStorage aby minimalizować ryzyko utraty danych
