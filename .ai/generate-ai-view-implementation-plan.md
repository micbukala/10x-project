# Plan implementacji widoku Generowanie AI

## 1. Przegląd

Widok "Generowanie AI" umożliwia zalogowanym użytkownikom wklejenie pełnego tekstu artykułu naukowego w celu wygenerowania ustrukturyzowanego podsumowania przy użyciu sztucznej inteligencji. Widok wyświetla licznik wykorzystania miesięcznego limitu (5 generacji/miesiąc), pole tekstowe z auto-skalowaniem, podgląd struktury podsumowania oraz przycisk generowania. Po pomyślnym wygenerowaniu, użytkownik jest przekierowywany do edytora z gotowym podsumowaniem. Widok obsługuje scenariusze błędów, w tym wyczerpanie limitu AI, oraz zapewnia responsywny interfejs dla urządzeń mobilnych i desktopowych.

## 2. Routing widoku

**Ścieżka:** `/generate`

**Typ:** Strona Astro z komponentem React dla interaktywności

**Ochrona:** Wymaga uwierzytelnienia użytkownika (middleware sprawdza sesję)

## 3. Struktura komponentów

```
src/pages/generate.astro (Astro page)
└── GenerateAiForm (React, client:load)
    ├── Desktop Layout (hidden on mobile)
    │   ├── Left Column
    │   │   ├── ArticleTextarea
    │   │   ├── CharCounter
    │   │   ├── ValidationMessage
    │   │   └── AIUsageCounter
    │   └── Right Column
    │       ├── StructurePreview
    │       └── GenerateButton (z Tooltip)
    ├── Mobile Layout (hidden on desktop)
    │   ├── AIUsageCounter
    │   ├── MobileViewToggle (Tabs)
    │   ├── Conditional Content
    │   │   ├── [gdy widok = 'input']
    │   │   │   ├── ArticleTextarea
    │   │   │   ├── CharCounter
    │   │   │   └── ValidationMessage
    │   │   └── [gdy widok = 'preview']
    │   │       └── StructurePreview
    │   └── GenerateButton (z Tooltip)
    └── LoadingOverlay (warunkowe renderowanie)
```

## 4. Szczegóły komponentów

### GenerateAiForm (główny komponent React)

- **Opis komponentu:** Główny interaktywny formularz zarządzający całym stanem widoku generowania AI. Odpowiada za pobieranie danych o wykorzystaniu AI, walidację inputu, wywołanie API generowania oraz nawigację do edytora po sukcesie.

- **Główne elementy:**
  - Container `<div>` z responsywnym layoutem (grid na desktop, flex na mobile)
  - Warunkowe renderowanie desktop/mobile layout
  - LoadingOverlay wyświetlany podczas `isGenerating === true`
  - Wszystkie komponenty dzieci wymienione w strukturze

- **Obsługiwane zdarzenia:**
  - `onSubmit` - wywołanie generowania podsumowania
  - `onTextChange` - aktualizacja stanu tekstu artykułu
  - `onMobileViewToggle` - przełączanie widoku na mobile (input/preview)

- **Obsługiwana walidacja:**
  - Minimalna długość tekstu: 100 znaków
  - Sprawdzenie czy `usageData.can_generate === true` przed wysłaniem
  - Walidacja struktury odpowiedzi API

- **Typy:**
  - `GenerateFormState` (local state)
  - `UserAiUsageDTO` (z API)
  - `GenerateAiSummaryCommand` (request)
  - `GenerateAiSummaryResponseDTO` (response)
  - `ApiErrorDTO` (błędy)

- **Propsy:**
  ```typescript
  interface GenerateAiFormProps {
    initialUsageData: UserAiUsageDTO; // przekazane z Astro przez props
  }
  ```

### ArticleTextarea

- **Opis komponentu:** Pole tekstowe z auto-skalowaniem umożliwiające wklejenie treści artykułu naukowego. Wykorzystuje komponent Textarea z Shadcn/ui z dodatkową logiką auto-resize.

- **Główne elementy:**
  - `<Textarea>` z Shadcn/ui
  - Atrybut `placeholder`: "Wklej tutaj pełny tekst artykułu naukowego..."
  - CSS: `min-h-[200px]`, auto-resize do `max-h-[600px]`

- **Obsługiwane zdarzenia:**
  - `onChange` - aktualizacja wartości w parent state

- **Obsługiwana walidacja:**
  - Brak walidacji w samym komponencie (delegowana do rodzica)

- **Typy:**
  - `value: string`

- **Propsy:**
  ```typescript
  interface ArticleTextareaProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    error?: boolean;
  }
  ```

### CharCounter

- **Opis komponentu:** Prosty licznik znaków wyświetlający aktualną długość tekstu. Wizualnie zmienia kolor gdy tekst jest zbyt krótki (< 100 znaków).

- **Główne elementy:**
  - `<span>` lub `<p>` z tekstem: "{count} znaków"
  - Conditional styling: kolor czerwony gdy < 100, normalny gdy >= 100

- **Obsługiwane zdarzenia:**
  - Brak (pure presentational)

- **Obsługiwana walidacja:**
  - Wizualna informacja zwrotna na podstawie długości

- **Typy:**
  - `count: number`

- **Propsy:**
  ```typescript
  interface CharCounterProps {
    count: number;
    minLength?: number; // default 100
  }
  ```

### ValidationMessage

- **Opis komponentu:** Komponent wyświetlający komunikaty walidacyjne i błędy. Obsługuje różne poziomy ważności (error, warning, info).

- **Główne elementy:**
  - `<Alert>` z Shadcn/ui
  - Ikona w zależności od severity
  - Tekst komunikatu

- **Obsługiwane zdarzenia:**
  - Opcjonalne: `onDismiss` dla zamykalnych alertów

- **Obsługiwana walidacja:**
  - N/A (komponent prezentacyjny)

- **Typy:**
  - `ValidationResult` lub `ApiErrorDTO`

- **Propsy:**
  ```typescript
  interface ValidationMessageProps {
    message: string | null;
    severity?: 'error' | 'warning' | 'info';
    dismissible?: boolean;
    onDismiss?: () => void;
  }
  ```

### StructurePreview

- **Opis komponentu:** Statyczny podgląd struktury podsumowania pokazujący 6 sekcji, które zostaną wygenerowane. Służy jako preview oczekiwanego rezultatu.

- **Główne elementy:**
  - `<Card>` z Shadcn/ui
  - Lista 6 sekcji z ikonami:
    1. Cel badań
    2. Metody
    3. Wyniki
    4. Dyskusja
    5. Otwarte pytania
    6. Wnioski
  - Opcjonalnie krótki opis każdej sekcji

- **Obsługiwane zdarzenia:**
  - Brak

- **Obsługiwana walidacja:**
  - N/A

- **Typy:**
  - Brak (statyczny content)

- **Propsy:**
  ```typescript
  interface StructurePreviewProps {
    // brak propsów - całkowicie statyczny
  }
  ```

### AIUsageCounter

- **Opis komponentu:** Wyświetla aktualny status wykorzystania limitu AI (np. "3/5") wraz z progress barem i informacją o dacie odnowienia.

- **Główne elementy:**
  - `<Card>` z Shadcn/ui
  - `<Progress>` bar pokazujący procent wykorzystania
  - Tekst: "Wykorzystano w tym miesiącu: {usage}/{limit}"
  - Mniejszy tekst: "Odnowienie: {resetDate}"

- **Obsługiwane zdarzenia:**
  - Brak

- **Obsługiwana walidacja:**
  - N/A

- **Typy:**
  - `UserAiUsageDTO`

- **Propsy:**
  ```typescript
  interface AIUsageCounterProps {
    usageData: UserAiUsageDTO;
  }
  ```

### GenerateButton

- **Opis komponentu:** Przycisk submit formularz z tooltipem wyjaśniającym dlaczego przycisk jest nieaktywny (gdy limit osiągnięty lub walidacja nie przeszła).

- **Główne elementy:**
  - Wrapper `<TooltipProvider>` i `<Tooltip>` z Shadcn/ui
  - `<Button>` z Shadcn/ui
  - Tekst przycisku: "Generuj podsumowanie"
  - Tooltip content (warunkowy)

- **Obsługiwane zdarzenia:**
  - `onClick` - trigger generowania

- **Obsługiwana walidacja:**
  - Disabled gdy `!canGenerate` lub `textLength < 100`
  - Tooltip pokazuje odpowiedni komunikat

- **Typy:**
  - `disabled: boolean`
  - `tooltipMessage: string | null`

- **Propsy:**
  ```typescript
  interface GenerateButtonProps {
    onClick: () => void;
    disabled: boolean;
    isLoading: boolean;
    tooltipMessage?: string | null;
  }
  ```

### LoadingOverlay

- **Opis komponentu:** Overlay zakrywający cały formularz podczas procesu generowania, wyświetlający spinner i komunikat "Trwa analiza tekstu i generowanie podsumowania...".

- **Główne elementy:**
  - `<div>` z fixed/absolute positioning i backdrop
  - Spinner (można użyć ikony z lucide-react lub Shadcn)
  - Tekst komunikatu

- **Obsługiwane zdarzenia:**
  - Brak (blokuje interakcję)

- **Obsługiwana walidacja:**
  - N/A

- **Typy:**
  - `isVisible: boolean`

- **Propsy:**
  ```typescript
  interface LoadingOverlayProps {
    isVisible: boolean;
    message?: string;
  }
  ```

### MobileViewToggle

- **Opis komponentu:** Tabs umożliwiające przełączanie między widokiem inputu a podglądem struktury na urządzeniach mobilnych.

- **Główne elementy:**
  - `<Tabs>` z Shadcn/ui
  - Dwa TabsTrigger: "Tekst artykułu" i "Struktura podsumowania"
  - TabsContent dla każdego widoku

- **Obsługiwane zdarzenia:**
  - `onValueChange` - zmiana aktywnego taba

- **Obsługiwana walidacja:**
  - N/A

- **Typy:**
  - `activeView: 'input' | 'preview'`

- **Propsy:**
  ```typescript
  interface MobileViewToggleProps {
    activeView: 'input' | 'preview';
    onViewChange: (view: 'input' | 'preview') => void;
    children: React.ReactNode; // TabsContent dla każdego widoku
  }
  ```

## 5. Typy

### Istniejące typy (z src/types.ts):

```typescript
// Dane o wykorzystaniu AI użytkownika
interface UserAiUsageDTO {
  can_generate: boolean;
  usage_count: number;
  monthly_limit: number;
  remaining_generations: number;
  period_start: string;
  period_end: string;
}

// Komenda do generowania AI summary
interface GenerateAiSummaryCommand {
  title: string;
  content: SummaryContentDTO;
  ai_model_name: string;
}

// Struktura contentu podsumowania
interface SummaryContentDTO {
  research_objective: string;
  methods: string;
  results: string;
  discussion: string;
  open_questions: string;
  conclusions: string;
}

// Odpowiedź po wygenerowaniu
interface GenerateAiSummaryResponseDTO extends SummaryDetailDTO {
  remaining_generations: number;
}

// Szczegóły podsumowania
interface SummaryDetailDTO {
  id: string;
  title: string;
  content: SummaryContentDTO;
  creation_type: Enums<"summary_creation_type">;
  ai_model_name: string | null;
  created_at: string;
  updated_at: string;
}

// Struktura błędu API
interface ApiErrorDTO {
  error: {
    code: ApiErrorCode;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
  };
}

// Specyficzny błąd limitu AI
interface AiLimitExceededErrorDTO {
  error: {
    code: "AI_LIMIT_EXCEEDED";
    message: string;
    current_usage: number;
    monthly_limit: number;
    reset_date: string;
  };
}
```

### Nowe typy (ViewModels i pomocnicze):

```typescript
// Stan formularza generowania
interface GenerateFormState {
  articleText: string;
  isGenerating: boolean;
  error: string | null;
  validationError: string | null;
}

// Dane dla wyświetlania usage
interface UsageDisplayData {
  currentUsage: number;
  limit: number;
  remainingGenerations: number;
  progressPercentage: number;
  isLimitReached: boolean;
  resetDate: Date;
}

// Wynik walidacji
interface ValidationResult {
  isValid: boolean;
  message: string | null;
  severity: 'error' | 'warning' | 'info';
}

// Typ widoku mobilnego
type MobileView = 'input' | 'preview';

// Konfiguracja walidacji
interface ValidationConfig {
  minTextLength: number; // 100
  maxTextLength?: number; // opcjonalnie
}
```

## 6. Zarządzanie stanem

### Stan lokalny w GenerateAiForm:

```typescript
const [articleText, setArticleText] = useState<string>('');
const [isGenerating, setIsGenerating] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
const [validationError, setValidationError] = useState<string | null>(null);
const [usageData, setUsageData] = useState<UserAiUsageDTO | null>(initialUsageData);
const [mobileView, setMobileView] = useState<MobileView>('input');
```

### Custom Hook: useAiGeneration

Rekomendowane utworzenie custom hooka do enkapsulacji logiki generowania:

```typescript
function useAiGeneration(initialUsageData: UserAiUsageDTO) {
  const [articleText, setArticleText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageData, setUsageData] = useState(initialUsageData);

  const validateInput = useCallback((text: string): ValidationResult => {
    if (text.length < 100) {
      return {
        isValid: false,
        message: 'Wprowadź dłuższy tekst artykułu (minimum 100 znaków)',
        severity: 'error'
      };
    }
    if (!usageData.can_generate) {
      return {
        isValid: false,
        message: `Osiągnięto miesięczny limit. Odnowienie: ${formatDate(usageData.period_end)}`,
        severity: 'error'
      };
    }
    return { isValid: true, message: null, severity: 'info' };
  }, [usageData]);

  const generateSummary = async () => {
    const validation = validateInput(articleText);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/summaries/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Nowe podsumowanie', // tymczasowy tytuł
          content: {
            research_objective: articleText, // MVP: cały tekst w jednym polu
            methods: '',
            results: '',
            discussion: '',
            open_questions: '',
            conclusions: ''
          },
          ai_model_name: 'anthropic/claude-3.5-sonnet'
        } as GenerateAiSummaryCommand)
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errorData: AiLimitExceededErrorDTO = await response.json();
          throw new Error(errorData.error.message);
        }
        const errorData: ApiErrorDTO = await response.json();
        throw new Error(errorData.error.message);
      }

      const data: GenerateAiSummaryResponseDTO = await response.json();
      
      // Aktualizacja usage data
      setUsageData(prev => prev ? {
        ...prev,
        usage_count: prev.usage_count + 1,
        remaining_generations: data.remaining_generations,
        can_generate: data.remaining_generations > 0
      } : null);

      // Przekierowanie do edytora
      window.location.href = `/editor/${data.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się wygenerować podsumowania. Spróbuj ponownie później.');
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    articleText,
    setArticleText,
    isGenerating,
    error,
    usageData,
    generateSummary,
    validateInput
  };
}
```

### Dlaczego custom hook?

- Enkapsulacja złożonej logiki generowania i walidacji
- Łatwiejsze testowanie
- Reużywalność (potencjalnie w innych miejscach)
- Czystszy kod głównego komponentu

## 7. Integracja API

### Endpoint 1: GET /api/users/ai-usage

**Kiedy wywołać:** 
- Po zamontowaniu strony Astro (server-side)
- Dane przekazane jako props do React komponentu

**Request:**
- Metoda: GET
- Headers: automatyczne (cookie session)
- Body: brak

**Response Type:**
```typescript
UserAiUsageDTO {
  can_generate: boolean;
  usage_count: number;
  monthly_limit: number;
  remaining_generations: number;
  period_start: string; // ISO date
  period_end: string; // ISO date
}
```

**Implementacja w Astro:**
```typescript
// src/pages/generate.astro
---
const response = await fetch(`${Astro.url.origin}/api/users/ai-usage`, {
  headers: {
    cookie: Astro.request.headers.get('cookie') || ''
  }
});

if (!response.ok) {
  return Astro.redirect('/login');
}

const usageData: UserAiUsageDTO = await response.json();
---

<Layout>
  <GenerateAiForm client:load initialUsageData={usageData} />
</Layout>
```

### Endpoint 2: POST /api/summaries/generate-ai

**Kiedy wywołać:**
- Po kliknięciu przycisku "Generuj podsumowanie"
- Po pozytywnej walidacji inputu

**Request Type:**
```typescript
GenerateAiSummaryCommand {
  title: string;
  content: SummaryContentDTO;
  ai_model_name: string;
}
```

**Request Example:**
```json
{
  "title": "Nowe podsumowanie",
  "content": {
    "research_objective": "[pełny tekst artykułu]",
    "methods": "",
    "results": "",
    "discussion": "",
    "open_questions": "",
    "conclusions": ""
  },
  "ai_model_name": "anthropic/claude-3.5-sonnet"
}
```

**Response Type (Success 201):**
```typescript
GenerateAiSummaryResponseDTO {
  id: string;
  title: string;
  content: SummaryContentDTO;
  creation_type: "ai_generated";
  ai_model_name: string;
  created_at: string;
  updated_at: string;
  remaining_generations: number; // WAŻNE: użyj do aktualizacji UI
}
```

**Response Type (Error 403):**
```typescript
AiLimitExceededErrorDTO {
  error: {
    code: "AI_LIMIT_EXCEEDED";
    message: string;
    current_usage: number;
    monthly_limit: number;
    reset_date: string; // ISO date
  }
}
```

**Response Type (Error 400/500):**
```typescript
ApiErrorDTO {
  error: {
    code: ApiErrorCode;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
  }
}
```

**Implementacja w hooku:**
Zobacz sekcję 6 (useAiGeneration hook)

## 8. Interakcje użytkownika

### 1. Wklejanie tekstu artykułu

**Akcja użytkownika:** Użytkownik wkleja lub wpisuje tekst w ArticleTextarea

**Zachowanie systemu:**
- Stan `articleText` aktualizuje się w czasie rzeczywistym
- CharCounter pokazuje aktualną liczbę znaków
- Kolor licznika zmienia się: czerwony gdy < 100 znaków, normalny gdy >= 100
- ValidationMessage pojawia się jeśli tekst zbyt krótki (po próbie submit lub on blur)

### 2. Kliknięcie przycisku "Generuj podsumowanie" (stan poprawny)

**Warunki:**
- `articleText.length >= 100`
- `usageData.can_generate === true`

**Zachowanie systemu:**
1. `setIsGenerating(true)`
2. LoadingOverlay pojawia się z tekstem "Trwa analiza tekstu i generowanie podsumowania..."
3. Wywołanie POST /api/summaries/generate-ai
4. Jeśli sukces:
   - Aktualizacja `usageData` (zmniejszenie remaining_generations)
   - Przekierowanie: `window.location.href = /editor/${summary.id}`
5. Jeśli błąd:
   - `setError(message)`
   - `setIsGenerating(false)`
   - LoadingOverlay znika
   - ValidationMessage pokazuje błąd

### 3. Kliknięcie przycisku gdy limit wyczerpany

**Warunki:**
- `usageData.can_generate === false`
- `usageData.remaining_generations === 0`

**Zachowanie systemu:**
- Przycisk jest disabled (`disabled={!usageData.can_generate}`)
- Kliknięcie nie wywołuje żadnej akcji (event handler nie wywołany)
- Najechanie myszką (hover) pokazuje Tooltip:
  ```
  "Osiągnięto miesięczny limit 5 generacji AI.
  Odnowienie: [data z usageData.period_end]"
  ```

### 4. Kliknięcie przycisku gdy tekst zbyt krótki

**Warunki:**
- `articleText.length < 100`

**Zachowanie systemu:**
- Przycisk jest disabled
- Tooltip pokazuje: "Wprowadź dłuższy tekst artykułu (minimum 100 znaków)"
- Kliknięcie nie wywołuje żadnej akcji

### 5. Przełączanie widoku na mobile

**Akcja użytkownika:** Kliknięcie w tab "Struktura podsumowania" lub "Tekst artykułu"

**Zachowanie systemu:**
- Stan `mobileView` zmienia się na 'preview' lub 'input'
- Conditional rendering pokazuje odpowiednią zawartość:
  - 'input' → ArticleTextarea + CharCounter + ValidationMessage
  - 'preview' → StructurePreview
- Płynna animacja przejścia (transition z Tailwind)

### 6. Błąd sieciowy podczas generowania

**Scenariusz:** Brak internetu lub timeout

**Zachowanie systemu:**
- Catch w bloku try/catch
- `setError("Błąd połączenia. Sprawdź internet i spróbuj ponownie.")`
- `setIsGenerating(false)`
- LoadingOverlay znika
- ValidationMessage pokazuje error alert

## 9. Warunki i walidacja

### Walidacja 1: Minimalna długość tekstu

**Warunek:** `articleText.length >= 100`

**Komponenty dotknięte:**
- ArticleTextarea (wizualny feedback - error state)
- CharCounter (kolor czerwony gdy < 100)
- GenerateButton (disabled gdy false)
- ValidationMessage (pokazuje błąd)

**Wpływ na UI:**
- Gdy `false`: przycisk disabled, tooltip wyjaśnia dlaczego, licznik czerwony
- Gdy `true`: przycisk enabled (o ile inne warunki OK)

### Walidacja 2: Dostępność limitu AI

**Warunek:** `usageData.can_generate === true`

**Komponenty dotknięte:**
- AIUsageCounter (wizualny stan - pełny progress bar gdy limit)
- GenerateButton (disabled gdy false)
- ValidationMessage (opcjonalnie info message)

**Wpływ na UI:**
- Gdy `false`: 
  - Przycisk disabled
  - Tooltip: "Osiągnięto miesięczny limit... Odnowienie: [data]"
  - Progress bar AIUsageCounter pokazuje 100%
- Gdy `true`: przycisk może być enabled

### Walidacja 3: Stan generowania

**Warunek:** `!isGenerating`

**Komponenty dotknięte:**
- GenerateButton (disabled podczas generowania)
- LoadingOverlay (visible podczas generowania)
- Cały formularz (disabled podczas generowania)

**Wpływ na UI:**
- Gdy `isGenerating === true`:
  - LoadingOverlay zakrywa formularz
  - Wszystkie kontrolki disabled
  - Pokazuje spinner i komunikat
- Gdy `isGenerating === false`: normalna interakcja

### Walidacja 4: Struktura odpowiedzi API

**Warunek:** Response zawiera wymagane pola `GenerateAiSummaryResponseDTO`

**Komponenty dotknięte:**
- useAiGeneration hook (logika)

**Wpływ na UI:**
- Gdy valid: przekierowanie do edytora
- Gdy invalid: error message "Nieprawidłowa odpowiedź serwera"

### Walidacja 5: Uwierzytelnienie użytkownika

**Warunek:** User zalogowany (sprawdzane przez middleware)

**Komponenty dotknięte:**
- Cała strona (Astro middleware)

**Wpływ na UI:**
- Gdy niezalogowany: redirect do /login (zanim strona się załaduje)
- Gdy zalogowany: strona renderuje się normalnie

## 10. Obsługa błędów

### Błąd 1: Brak połączenia sieciowego

**Scenariusz:** `fetch()` throw network error

**Obsługa:**
```typescript
catch (err) {
  if (err instanceof TypeError && err.message.includes('fetch')) {
    setError('Błąd połączenia. Sprawdź internet i spróbuj ponownie.');
  }
}
```

**UI:** ValidationMessage z severity='error', czerwony alert

### Błąd 2: Osiągnięcie limitu AI (403 AI_LIMIT_EXCEEDED)

**Scenariusz:** Response status 403, error.code === 'AI_LIMIT_EXCEEDED'

**Obsługa:**
```typescript
if (response.status === 403) {
  const errorData: AiLimitExceededErrorDTO = await response.json();
  setError(`Osiągnięto limit ${errorData.error.monthly_limit} generacji AI. Odnowienie: ${formatDate(errorData.error.reset_date)}`);
  // Aktualizacja usageData aby disable button
  setUsageData(prev => ({ ...prev!, can_generate: false }));
}
```

**UI:** 
- Error message w ValidationMessage
- Button disabled
- AIUsageCounter pokazuje pełny progress

### Błąd 3: Błąd walidacji po stronie API (400 VALIDATION_ERROR)

**Scenariusz:** Response status 400, error.code === 'VALIDATION_ERROR'

**Obsługa:**
```typescript
if (response.status === 400) {
  const errorData: ApiErrorDTO = await response.json();
  setError(errorData.error.message);
  if (errorData.error.field) {
    // Highlight konkretnego pola jeśli API wskazuje
  }
}
```

**UI:** ValidationMessage pokazuje konkretny błąd z API

### Błąd 4: Nieautoryzowany dostęp (401 UNAUTHORIZED)

**Scenariusz:** Response status 401 (sesja wygasła)

**Obsługa:**
```typescript
if (response.status === 401) {
  window.location.href = '/login?redirect=/generate';
}
```

**UI:** Automatyczne przekierowanie do logowania

### Błąd 5: Błąd serwera (500 INTERNAL_ERROR)

**Scenariusz:** Response status 500

**Obsługa:**
```typescript
if (response.status >= 500) {
  setError('Nie udało się wygenerować podsumowania. Spróbuj ponownie później.');
}
```

**UI:** Ogólny komunikat błędu, friendly dla użytkownika

### Błąd 6: Tekst zbyt krótki (client-side validation)

**Scenariusz:** Użytkownik próbuje wysłać tekst < 100 znaków

**Obsługa:**
```typescript
const validation = validateInput(articleText);
if (!validation.isValid) {
  setError(validation.message);
  return; // prevent API call
}
```

**UI:**
- Przycisk disabled
- ValidationMessage: "Wprowadź dłuższy tekst artykułu (minimum 100 znaków)"
- CharCounter czerwony

### Błąd 7: Timeout API

**Scenariusz:** Request trwa > 30s

**Obsługa:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch('/api/summaries/generate-ai', {
    signal: controller.signal,
    // ...
  });
  clearTimeout(timeoutId);
} catch (err) {
  if (err.name === 'AbortError') {
    setError('Przekroczono czas oczekiwania. Spróbuj ponownie.');
  }
}
```

**UI:** Error message o timeout

### Ogólna strategia obsługi błędów:

1. **Zawsze wyłącz loading state** w finally block
2. **Nie zmniejszaj licznika** gdy API zwraca błąd
3. **Pokazuj user-friendly messages** zamiast technical errors
4. **Loguj szczegóły** do console dla debugowania (dev mode)
5. **Umożliw retry** - użytkownik może poprawić i spróbować ponownie

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

```
src/
  pages/
    generate.astro (nowy)
  components/
    generate/
      GenerateAiForm.tsx (nowy)
      ArticleTextarea.tsx (nowy)
      CharCounter.tsx (nowy)
      ValidationMessage.tsx (nowy)
      StructurePreview.tsx (nowy)
      AIUsageCounter.tsx (nowy)
      GenerateButton.tsx (nowy)
      LoadingOverlay.tsx (nowy)
      MobileViewToggle.tsx (nowy)
    hooks/
      useAiGeneration.ts (nowy)
  lib/
    utils/
      validation.ts (nowy - helper functions)
      date-format.ts (nowy - format dates)
```

### Krok 2: Implementacja typów i helpers

1. Dodaj nowe typy do `src/types.ts` lub utwórz `src/components/generate/types.ts`:
   - `GenerateFormState`
   - `ValidationResult`
   - `MobileView`
   - `ValidationConfig`

2. Utwórz helper functions w `src/lib/utils/validation.ts`:
   ```typescript
   export const MIN_ARTICLE_LENGTH = 100;
   
   export function validateArticleText(text: string): ValidationResult {
     // implementacja
   }
   ```

3. Utwórz date formatting w `src/lib/utils/date-format.ts`:
   ```typescript
   export function formatResetDate(isoDate: string): string {
     // format do "DD.MM.YYYY"
   }
   ```

### Krok 3: Implementacja custom hooka useAiGeneration

Utwórz `src/components/hooks/useAiGeneration.ts` zgodnie z opisem w sekcji 6.

**Testy manualne:**
- Mock różne stany usageData
- Testuj walidację z różnymi długościami tekstu
- Mockuj response API (success i errors)

### Krok 4: Implementacja komponentów prezentacyjnych (od najmniejszych)

**Kolejność implementacji:**

1. **CharCounter.tsx** (najprostszy)
   - Pure component, tylko props
   - Conditional styling based on count

2. **ValidationMessage.tsx**
   - Użyj Alert z Shadcn
   - Props: message, severity, dismissible

3. **StructurePreview.tsx**
   - Statyczny content
   - Lista 6 sekcji z ikonami (lucide-react)
   - Użyj Card z Shadcn

4. **LoadingOverlay.tsx**
   - Fixed positioning z backdrop
   - Spinner + message
   - Conditional rendering based on isVisible

5. **AIUsageCounter.tsx**
   - Użyj Progress z Shadcn
   - Oblicz percentage: (usage_count / monthly_limit) * 100
   - Format daty odnowienia

### Krok 5: Implementacja komponentów interaktywnych

1. **ArticleTextarea.tsx**
   - Użyj Textarea z Shadcn
   - Dodaj auto-resize logic:
     ```typescript
     useEffect(() => {
       if (textareaRef.current) {
         textareaRef.current.style.height = 'auto';
         textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
       }
     }, [value]);
     ```
   - Props: value, onChange, disabled, error

2. **GenerateButton.tsx**
   - Wrapper z TooltipProvider i Tooltip
   - Button z Shadcn
   - Conditional tooltip message
   - Loading state (spinner in button)

3. **MobileViewToggle.tsx**
   - Użyj Tabs z Shadcn
   - Dwa TabsTrigger: "Tekst artykułu", "Struktura"
   - onValueChange aktualizuje parent state

### Krok 6: Implementacja głównego komponentu GenerateAiForm

1. Zaimportuj wszystkie komponenty dzieci
2. Użyj custom hook useAiGeneration
3. Implementuj layout desktop (two-column grid):
   ```tsx
   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
     {/* Left column */}
     {/* Right column */}
   </div>
   ```
4. Implementuj layout mobile (single column z tabs)
5. Conditional rendering LoadingOverlay
6. Wire up wszystkie event handlers

**Desktop layout structure:**
```tsx
<div className="hidden lg:grid lg:grid-cols-2 gap-6">
  <div className="space-y-4">
    <AIUsageCounter usageData={usageData} />
    <ArticleTextarea value={articleText} onChange={setArticleText} />
    <CharCounter count={articleText.length} />
    {validationError && <ValidationMessage message={validationError} severity="error" />}
  </div>
  <div className="space-y-4">
    <StructurePreview />
    <GenerateButton 
      onClick={generateSummary}
      disabled={!canGenerate}
      isLoading={isGenerating}
      tooltipMessage={getTooltipMessage()}
    />
  </div>
</div>
```

**Mobile layout structure:**
```tsx
<div className="lg:hidden space-y-4">
  <AIUsageCounter usageData={usageData} />
  <MobileViewToggle activeView={mobileView} onViewChange={setMobileView}>
    <TabsContent value="input">
      <ArticleTextarea value={articleText} onChange={setArticleText} />
      <CharCounter count={articleText.length} />
      {validationError && <ValidationMessage message={validationError} severity="error" />}
    </TabsContent>
    <TabsContent value="preview">
      <StructurePreview />
    </TabsContent>
  </MobileViewToggle>
  <GenerateButton {...} />
</div>
```

### Krok 7: Utworzenie strony Astro

Utwórz `src/pages/generate.astro`:

```astro
---
import Layout from '../layouts/Layout.astro';
import GenerateAiForm from '../components/generate/GenerateAiForm';
import type { UserAiUsageDTO } from '../types';

// Fetch usage data server-side
const response = await fetch(`${Astro.url.origin}/api/users/ai-usage`, {
  headers: {
    cookie: Astro.request.headers.get('cookie') || ''
  }
});

if (!response.ok) {
  return Astro.redirect('/login?redirect=/generate');
}

const usageData: UserAiUsageDTO = await response.json();
---

<Layout title="Generuj podsumowanie AI - AI SciSum">
  <main class="container mx-auto px-4 py-8 max-w-7xl">
    <h1 class="text-3xl font-bold mb-6">Generuj podsumowanie AI</h1>
    <GenerateAiForm client:load initialUsageData={usageData} />
  </main>
</Layout>
```

### Krok 8: Stylowanie i responsywność

1. Użyj Tailwind classes zgodnie z projektem
2. Testuj breakpointy:
   - Mobile: < 1024px (single column, tabs)
   - Desktop: >= 1024px (two columns)
3. Sprawdź accessibility:
   - Labels dla form fields
   - ARIA attributes dla tooltips
   - Keyboard navigation

### Krok 9: Testowanie integracji z API

1. **Test sukcesu generowania:**
   - Wklej tekst > 100 znaków
   - Kliknij Generate
   - Sprawdź czy wywołuje POST /api/summaries/generate-ai
   - Sprawdź przekierowanie do /editor/{id}
   - Sprawdź aktualizację licznika

2. **Test limitu AI:**
   - Mock usageData z can_generate: false
   - Sprawdź czy button disabled
   - Sprawdź tooltip message

3. **Test błędów:**
   - Mock API error 500
   - Sprawdź wyświetlenie error message
   - Sprawdź czy loading state się wyłącza

4. **Test walidacji:**
   - Wpisz < 100 znaków
   - Sprawdź disabled button
   - Sprawdź czerwony CharCounter

### Krok 10: Dodanie nawigacji do widoku

1. Dodaj link w Sidebar/Navigation:
   ```tsx
   <NavLink href="/generate">Generuj AI</NavLink>
   ```

2. Dodaj w Dashboard jako CTA button:
   ```tsx
   <Button asChild>
     <a href="/generate">Stwórz podsumowanie AI</a>
   </Button>
   ```

### Krok 11: Optymalizacja i finalizacja

1. **Performance:**
   - Memoizuj komponenty z React.memo gdzie potrzeba
   - useCallback dla event handlers w GenerateAiForm

2. **Error boundaries:**
   - Dodaj React Error Boundary dla graceful error handling

3. **Loading states:**
   - Skeleton dla AIUsageCounter podczas initial load

4. **Accessibility audit:**
   - Użyj axe DevTools
   - Sprawdź screen reader compatibility

5. **Code review checklist:**
   - Wszystkie typy są używane
   - Brak any types
   - Error handling kompletny
   - User feedback dla wszystkich akcji
   - Mobile responsive
   - Zgodność z PRD i User Stories

### Krok 12: Dokumentacja

1. Dodaj JSDoc comments do komponentów
2. Zaktualizuj README jeśli potrzeba
3. Dodaj przykłady użycia w Storybook (opcjonalnie)

### Krok 13: Testing (opcjonalny dla MVP, ale rekomendowany)

1. **Unit tests dla helpers:**
   - validateArticleText
   - formatResetDate

2. **Integration tests dla hooka:**
   - useAiGeneration z different scenarios

3. **E2E tests:**
   - Happy path: paste → generate → redirect
   - Error path: limit reached
   - Error path: validation failed

---

**Szacowany czas implementacji:** 2-3 dni dla doświadczonego frontend developera

**Priorytet dependencies:** Shadcn/ui components muszą być zainstalowane i skonfigurowane przed rozpoczęciem.
