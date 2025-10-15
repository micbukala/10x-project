# API Endpoint Implementation Plan: Create Manual Summary

## 1. Przegląd punktu końcowego

**Endpoint:** `POST /api/summaries`

**Cel:** Utworzenie nowego manualnego streszczenia artykułu naukowego. Użytkownik może utworzyć streszczenie z pustą strukturą treści lub wstępnie wypełnioną zawartością. Streszczenie jest oznaczone jako `creation_type: 'manual'` i nie wykorzystuje limitu AI generacji.

**Główne funkcjonalności:**
- Tworzenie streszczenia z wymaganym tytułem i strukturą treści
- Automatyczne przypisanie do zalogowanego użytkownika
- Walidacja kompletności struktury treści (6 wymaganych pól)
- Automatyczne generowanie UUID i timestampów
- Oznaczenie jako manualne streszczenie (bez AI)

## 2. Szczegóły żądania

### Metoda HTTP
`POST`

### Struktura URL
`/api/summaries`

### Nagłówki
- `Authorization: Bearer <jwt_token>` - **Wymagany**
- `Content-Type: application/json` - **Wymagany**

### Parametry URL
Brak parametrów URL.

### Request Body

**Struktura:**
```typescript
{
  title: string;          // Wymagany, niepusty po trim, max 500 znaków
  content: {              // Wymagany, obiekt ze wszystkimi 6 polami
    research_objective: string;
    methods: string;
    results: string;
    discussion: string;
    open_questions: string;
    conclusions: string;
  }
}
```

**Przykład - puste streszczenie:**
```json
{
  "title": "My Research Notes",
  "content": {
    "research_objective": "",
    "methods": "",
    "results": "",
    "discussion": "",
    "open_questions": "",
    "conclusions": ""
  }
}
```

**Przykład - wstępnie wypełnione:**
```json
{
  "title": "Climate Change Impact Study",
  "content": {
    "research_objective": "Investigate temperature effects on biodiversity",
    "methods": "5-year longitudinal study of marine ecosystems",
    "results": "",
    "discussion": "",
    "open_questions": "",
    "conclusions": ""
  }
}
```

### Walidacja Request Body

**Zod Schema (do dodania w `src/lib/services/schemas/summary.schema.ts`):**
```typescript
export const createManualSummarySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(500, "Title cannot exceed 500 characters"),
  content: z.custom<SummaryContentDTO>(
    (data) => isSummaryContent(data),
    "Invalid summary content structure. All 6 fields are required: research_objective, methods, results, discussion, open_questions, conclusions"
  ),
});
```

**Reguły walidacji:**
1. `title` musi być niepustym stringiem po usunięciu białych znaków
2. `title` nie może przekraczać 500 znaków (zgodnie z DB constraint)
3. `content` musi być obiektem zawierającym dokładnie 6 pól stringowych
4. Wszystkie pola w `content` muszą być stringami (mogą być puste)
5. Request body musi być prawidłowym JSON

## 3. Wykorzystywane typy

### Istniejące typy (z `src/types.ts`)

**Command Model:**
```typescript
export interface CreateManualSummaryCommand {
  title: string;
  content: SummaryContentDTO;
}
```

**Response DTO:**
```typescript
export type CreateManualSummaryResponseDTO = SummaryDetailDTO;

export interface SummaryDetailDTO {
  id: string;
  title: string;
  content: SummaryContentDTO;
  creation_type: Enums<"summary_creation_type">;
  ai_model_name: string | null;
  created_at: string;
  updated_at: string;
}
```

**Content Structure:**
```typescript
export interface SummaryContentDTO {
  research_objective: string;
  methods: string;
  results: string;
  discussion: string;
  open_questions: string;
  conclusions: string;
}
```

**Type Guard:**
```typescript
export function isSummaryContent(value: unknown): value is SummaryContentDTO;
```

**Error DTOs:**
```typescript
export interface ApiErrorDTO {
  error: {
    code: ApiErrorCode;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
  };
}

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "DATABASE_ERROR";
```

### Typy wewnętrzne (do użycia w service)

**Supabase Insert Type:**
```typescript
// Wewnątrz SummaryService.createManualSummary()
type SummaryInsert = Database['public']['Tables']['summaries']['Insert'];
```

## 4. Szczegóły odpowiedzi

### Sukces - 201 Created

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "My Research Notes",
  "content": {
    "research_objective": "",
    "methods": "",
    "results": "",
    "discussion": "",
    "open_questions": "",
    "conclusions": ""
  },
  "creation_type": "manual",
  "ai_model_name": null,
  "created_at": "2025-10-14T11:00:00.000Z",
  "updated_at": "2025-10-14T11:00:00.000Z"
}
```

**Struktura odpowiedzi:**
- Wszystkie pola z request body plus wygenerowane metadane
- `id` - UUID wygenerowany przez PostgreSQL
- `creation_type` - zawsze "manual"
- `ai_model_name` - zawsze null dla manualnych streszczeń
- `created_at` i `updated_at` - identyczne przy tworzeniu

### Błędy

#### 401 Unauthorized - Brak autentykacji
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 400 Bad Request - Walidacja tytułu (pusty)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "field": "title"
  }
}
```

#### 400 Bad Request - Walidacja tytułu (za długi)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title cannot exceed 500 characters",
    "field": "title"
  }
}
```

#### 400 Bad Request - Nieprawidłowa struktura content
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid summary content structure. All 6 fields are required: research_objective, methods, results, discussion, open_questions, conclusions",
    "field": "content",
    "details": {
      // Zod error details
    }
  }
}
```

#### 400 Bad Request - Nieprawidłowy JSON
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid JSON format",
    "details": {
      // Parse error details
    }
  }
}
```

#### 500 Internal Server Error - Błąd bazy danych
```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to create summary"
  }
}
```

## 5. Przepływ danych

### Diagram przepływu

```
1. Client Request
   ↓
2. Astro Middleware (src/middleware/index.ts)
   - Walidacja JWT token
   - Utworzenie Supabase client w context.locals
   - Ekstrakcja user z token
   ↓
3. API Route Handler (src/pages/api/summaries/index.ts)
   - Sprawdzenie locals.user
   - Parse request body (JSON)
   - Walidacja z Zod schema
   ↓
4. SummaryService.createManualSummary()
   - Przygotowanie danych do INSERT
   - Wywołanie Supabase client
   ↓
5. Supabase (PostgreSQL)
   - RLS policy: sprawdzenie auth.uid()
   - INSERT do tabeli summaries
   - Trigger: set updated_at
   - RETURN wstawionego rekordu
   ↓
6. SummaryService
   - Konwersja database row → SummaryDetailDTO
   - Return DTO
   ↓
7. API Route Handler
   - Log successful request (ApiMonitoring)
   - Return Response 201
   ↓
8. Client receives response
```

### Interakcje z bazą danych

**Tabela:** `summaries`

**Operacja:** `INSERT`

**Przygotowane dane:**
```typescript
{
  user_id: string,           // z locals.user.id
  title: string,             // z request body (po walidacji)
  content: Json,             // SummaryContentDTO → JSONB
  creation_type: 'manual',   // stała wartość
  ai_model_name: null,       // stała wartość dla manual
  // id, created_at, updated_at - auto-generated
}
```

**Query Supabase:**
```typescript
const { data, error } = await supabase
  .from('summaries')
  .insert({
    user_id: userId,
    title: title,
    content: content as unknown as Json,
    creation_type: 'manual',
    ai_model_name: null,
  })
  .select()
  .single();
```

**Row Level Security:**
- Policy automatycznie weryfikuje, że `auth.uid() = user_id`
- Użytkownik może tworzyć tylko swoje streszczenia

**Zwrócone dane:**
```typescript
{
  id: uuid,
  user_id: uuid,
  title: string,
  content: jsonb,
  original_ai_content: null,
  creation_type: 'manual',
  ai_model_name: null,
  created_at: timestamptz,
  updated_at: timestamptz,
}
```

### Brak interakcji zewnętrznych
- Brak wywołań API zewnętrznych
- Brak aktualizacji tabeli `users` (w przeciwieństwie do AI generation)
- Operacja atomiczna - jeden INSERT

## 6. Względy bezpieczeństwa

### Autentykacja

**Mechanizm:** Supabase Auth JWT Bearer Token

**Implementacja:**
1. Middleware Astro waliduje token w każdym requeście
2. Token zawiera `sub` (user ID) i metadata
3. Supabase client tworzony z JWT automatycznie stosuje RLS
4. Brak token = 401 Unauthorized

**Weryfikacja w route handler:**
```typescript
const user = locals.user;
if (!user) {
  return new Response(
    JSON.stringify({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    }),
    { status: 401 }
  );
}
```

### Autoryzacja

**Mechanizm:** Row-Level Security (RLS) w PostgreSQL

**Policy dla INSERT:**
```sql
CREATE POLICY "Users can insert their own summaries"
ON summaries FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Skutki:**
- User może tworzyć tylko streszczenia ze swoim `user_id`
- Próba podmiany `user_id` w request = odrzucona przez RLS
- Aplikacja przekazuje `user.id` z JWT, nie z request body

**Dodatkowa walidacja:**
- Nigdy nie akceptuj `user_id` z request body
- Zawsze użyj `locals.user.id` z zweryfikowanego JWT

### Walidacja danych

**Input Sanitization:**
1. **Title:**
   - `.trim()` usuwa białe znaki na początku/końcu
   - Limit 500 znaków zapobiega nadmiernie długim tytułom
   - Zod automatycznie escape'uje niebezpieczne znaki w JSON

2. **Content:**
   - Type guard `isSummaryContent()` weryfikuje strukturę
   - Wszystkie pola muszą być stringami
   - JSONB w PostgreSQL bezpiecznie przechowuje dowolny tekst
   - Brak możliwości SQL injection (parametryzowane query)

**Zabezpieczenia przed atakami:**
- **SQL Injection:** Parametryzowane zapytania Supabase SDK
- **XSS:** Frontend odpowiedzialny za escape podczas renderowania
- **NoSQL Injection:** Zod schema zapobiega nieoczekiwanym typom
- **JSON Injection:** Parser JSON + Zod validation

### Limity zasobów

**Content Size Limit:**
```typescript
// Dodatkowa walidacja w schema (optional, do rozważenia)
.refine(
  (content) => {
    const totalLength = Object.values(content).join('').length;
    return totalLength <= 50000; // 50KB tekstowej treści
  },
  "Content too large (max 50KB)"
)
```

**Rate Limiting:**
- Nie zaimplementowane w MVP
- Do rozważenia w przyszłości (np. max 100 summaries/hour)
- Może być dodane na poziomie middleware lub reverse proxy

### HTTPS i nagłówki bezpieczeństwa

**Wymagania:**
- Wszystkie requesty przez HTTPS (produkcja)
- Security headers w odpowiedziach (standardowe dla Astro)

**Nagłówki (automatyczne w Astro + DigitalOcean):**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

## 7. Obsługa błędów

### Hierarchia obsługi błędów

```
1. JSON Parse Error
   → 400 VALIDATION_ERROR "Invalid JSON format"

2. Zod Validation Error
   → 400 VALIDATION_ERROR z details

3. Database Error (Supabase)
   → 500 DATABASE_ERROR "Failed to create summary"

4. Unexpected Error
   → 500 INTERNAL_ERROR "An unexpected error occurred"
```

### Szczegółowe scenariusze błędów

#### 1. Brak autentykacji
**Trigger:** `locals.user === undefined`
```typescript
Status: 401
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 2. Nieprawidłowy JSON body
**Trigger:** `request.json()` throws SyntaxError
```typescript
Status: 400
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid JSON format",
    "details": { /* parse error */ }
  }
}
```

#### 3. Pusty tytuł (po trim)
**Trigger:** `title.trim().length === 0`
```typescript
Status: 400
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "field": "title"
  }
}
```

#### 4. Tytuł za długi
**Trigger:** `title.length > 500`
```typescript
Status: 400
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title cannot exceed 500 characters",
    "field": "title"
  }
}
```

#### 5. Nieprawidłowa struktura content
**Trigger:** Brakujące pole lub nieprawidłowy typ
```typescript
Status: 400
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid summary content structure. All 6 fields are required: research_objective, methods, results, discussion, open_questions, conclusions",
    "field": "content",
    "details": {
      "_errors": [],
      "fieldErrors": {
        "research_objective": ["Expected string, received undefined"]
      }
    }
  }
}
```

#### 6. Database error (INSERT failed)
**Trigger:** Supabase error podczas INSERT
```typescript
Status: 500
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to create summary"
  }
}
```
**Log (server-side):**
```typescript
console.error('Database error while creating summary:', error);
// Pełny error z stack trace w monitoring
```

#### 7. Nieoczekiwany błąd
**Trigger:** Dowolny inny error
```typescript
Status: 500
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

### Logging i monitoring

**Successful request:**
```typescript
ApiMonitoring.logApiRequest({
  timestamp: new Date().toISOString(),
  endpoint: '/api/summaries',
  method: 'POST',
  userId: user.id,
  duration: Date.now() - startTime,
  statusCode: 201,
});
```

**Error request:**
```typescript
ApiMonitoring.logApiRequest({
  timestamp: new Date().toISOString(),
  endpoint: '/api/summaries',
  method: 'POST',
  userId: user?.id,  // może być undefined
  duration: Date.now() - startTime,
  statusCode: 400|500,
  error: {
    code: 'VALIDATION_ERROR',
    message: error.message,
    stack: error.stack,
  },
});
```

**Console logging:**
- Błędy bazy danych: `console.error('Database error:', error)`
- Nieoczekiwane błędy: `console.error('Unexpected error:', error)`
- Nie logować wrażliwych danych (hasła, tokeny)

## 8. Rozważania dotyczące wydajności

### Optymalizacje zapytań

**Single INSERT:**
- Jedna operacja INSERT zamiast multiple queries
- `.single()` natychmiast zwraca wstawiony rekord
- Brak dodatkowego SELECT (Supabase RETURNING)

**Indexes wykorzystywane:**
- Primary key na `id` (auto)
- Index na `user_id` (dla przyszłych SELECT)
- Brak potrzeby index na `creation_type` dla INSERT

### Potencjalne wąskie gardła

**1. JSONB Parsing**
- PostgreSQL parsuje i waliduje JSONB przy INSERT
- Duże content (>10KB) może być wolniejsze
- **Mitigacja:** Limit rozmiaru content (50KB)

**2. RLS Policy Evaluation**
- PostgreSQL sprawdza RLS policy przy każdym INSERT
- Minimalny overhead (~1ms)
- Nieuniknione, część security

**3. Database Connection Pool**
- Supabase SDK zarządza pool automatycznie
- Limit connections (domyślnie 60 w Supabase)
- **Mitigacja:** Reuse Supabase client z `locals.supabase`

**4. Concurrent Inserts**
- Brak table-level locks dla INSERT
- Row-level locking tylko na nowy rekord
- Excellent scalability dla wielu użytkowników

### Caching

**Brak cachingu dla POST:**
- POST nie jest idempotentny
- Każde wywołanie tworzy nowy rekord
- Cache nieaplikowalny

**Response time target:**
- < 200ms dla typowego requesta
- < 500ms dla dużego content
- Większość czasu: network latency

### Monitoring wydajności

**Metryki do śledzenia:**
1. Request duration (już logowane w ApiMonitoring)
2. Database query time (Supabase dashboard)
3. Validation time (jeśli > 50ms)
4. Error rate (4xx/5xx)

**Alerting thresholds:**
- Average response time > 1s
- Error rate > 5%
- Database connections > 80% pool

## 9. Kroki implementacji

### Krok 1: Dodaj Zod schema walidacji
**Plik:** `src/lib/services/schemas/summary.schema.ts`

**Akcja:** Dodaj nowy schema do walidacji create manual summary

```typescript
import { isSummaryContent, type SummaryContentDTO } from "../../types";

/**
 * Schema for validating manual summary creation request
 */
export const createManualSummarySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(500, "Title cannot exceed 500 characters"),
  content: z.custom<SummaryContentDTO>(
    (data) => isSummaryContent(data),
    "Invalid summary content structure. All 6 fields are required: research_objective, methods, results, discussion, open_questions, conclusions"
  ),
});

/**
 * Type inferred from createManualSummarySchema
 */
export type ValidatedCreateManualSummary = z.infer<typeof createManualSummarySchema>;
```

**Test:** Sprawdź czy schema poprawnie waliduje:
- Pusty title → błąd
- Title > 500 znaków → błąd
- Brakujące pole w content → błąd
- Prawidłowe dane → sukces

---

### Krok 2: Dodaj metodę w SummaryService
**Plik:** `src/lib/services/summary.service.ts`

**Akcja:** Dodaj `createManualSummary()` method

```typescript
/**
 * Create a new manual summary
 * @param userId - ID of the user creating the summary
 * @param title - Title of the summary
 * @param content - Structured content of the summary
 * @returns Promise resolving to the created summary details
 * @throws Error if there's a database error during creation
 */
async createManualSummary(
  userId: string,
  title: string,
  content: SummaryContentDTO
): Promise<SummaryDetailDTO> {
  // Prepare insert data
  const insertData = {
    user_id: userId,
    title: title,
    content: content as unknown as Json,
    creation_type: 'manual' as const,
    ai_model_name: null,
  };

  // Insert the summary
  const { data: summary, error } = await this.supabase
    .from('summaries')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Database error while creating manual summary:', error);
    throw new Error('Failed to create summary: Database error');
  }

  if (!summary) {
    throw new Error('Failed to create summary: No data returned');
  }

  // Return typed response
  return {
    id: summary.id,
    title: summary.title,
    content: summary.content as unknown as SummaryContentDTO,
    creation_type: summary.creation_type,
    ai_model_name: summary.ai_model_name,
    created_at: summary.created_at,
    updated_at: summary.updated_at,
  } as SummaryDetailDTO;
}
```

**Umiejscowienie:** Dodaj metodę w klasie `SummaryService`, po metodzie `deleteSummary()` lub `createAiSummary()`

**Test:** Unit test dla metody (opcjonalnie):
- Mock Supabase client
- Sprawdź poprawne wywołanie `.insert()`
- Sprawdź error handling

---

### Krok 3: Utwórz POST handler w API route
**Plik:** `src/pages/api/summaries/index.ts`

**Akcja:** Dodaj POST handler w istniejącym pliku (który już ma GET)

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { SummaryService } from "../../../lib/services/summary.service";
import { ErrorService } from "../../../lib/services/error.service";
import { createManualSummarySchema } from "../../../lib/services/schemas/summary.schema";
import { ApiMonitoring } from "../../../../monitoring";

export const prerender = false;

// ... existing GET handler ...

/**
 * POST /api/summaries
 * Create a new manual summary
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = Date.now();
  const endpoint = "/api/summaries";

  try {
    // Check authentication
    const user = locals.user;
    if (!user) {
      return ErrorService.createUnauthorizedResponse();
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid JSON format",
          },
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedData = createManualSummarySchema.parse(body);

    // Initialize service
    const summaryService = new SummaryService(locals.supabase);

    // Create manual summary
    const summary = await summaryService.createManualSummary(
      user.id,
      validatedData.title,
      validatedData.content
    );

    // Log successful request
    ApiMonitoring.logApiRequest({
      timestamp: new Date().toISOString(),
      endpoint,
      method: "POST",
      userId: user.id,
      duration: Date.now() - startTime,
      statusCode: 201,
    });

    // Return success response
    return new Response(JSON.stringify(summary), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: firstError.message,
            field: firstError.path.join("."),
            details: error.flatten(),
          },
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log error request
    ApiMonitoring.logApiRequest({
      timestamp: new Date().toISOString(),
      endpoint,
      method: "POST",
      userId: locals.user?.id,
      duration: Date.now() - startTime,
      statusCode: 500,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
    });

    // Return error response
    return new Response(
      JSON.stringify({
        error: {
          code: "DATABASE_ERROR",
          message: "Failed to create summary",
        },
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

**Uwagi:**
- Handler powinien być w tym samym pliku co GET (zgodnie ze strukturą projektu)
- Import tylko dodatkowych zależności (schema, ErrorService)
- Użyj wzorca error handling z istniejącego `generate-ai.ts`

---

### Krok 4: Weryfikacja w bazie danych

**5.1. Sprawdź wstawiony rekord**

```sql
-- W Supabase SQL Editor
SELECT 
  id, 
  user_id, 
  title, 
  creation_type, 
  ai_model_name,
  created_at,
  updated_at
FROM summaries
WHERE creation_type = 'manual'
ORDER BY created_at DESC
LIMIT 5;
```

**Oczekiwania:**
- `creation_type` = 'manual'
- `ai_model_name` = NULL
- `user_id` = ID z JWT token
- `created_at` = `updated_at` (przy tworzeniu)
- `title` zgodny z request

**5.2. Sprawdź content JSONB**

```sql
SELECT 
  id,
  title,
  content->'research_objective' as research_objective,
  content->'methods' as methods,
  jsonb_typeof(content) as content_type
FROM summaries
WHERE id = '<created-summary-id>';
```

**Oczekiwania:**
- `content_type` = 'object'
- Wszystkie 6 pól obecne w JSONB
- Wartości zgodne z request

---

### Krok 5: Dokumentacja i monitoring

**6.1. Aktualizacja dokumentacji**
- Endpoint już udokumentowany w `docs/api-plan.md`
- Sprawdź zgodność implementacji ze specyfikacją
- Zaktualizuj przykłady jeśli potrzeba

**6.2. Setup monitoring dashboards**
- W Supabase Dashboard: sprawdź query performance
- W ApiMonitoring logs: zweryfikuj logowanie requestów
- Setup alerts dla error rate > 5%

**6.3. Dokumentacja dla frontendu**
```typescript
// Przykład użycia w frontend (do README lub storybook)
interface CreateSummaryRequest {
  title: string;
  content: SummaryContentDTO;
}

async function createManualSummary(
  token: string, 
  data: CreateSummaryRequest
): Promise<SummaryDetailDTO> {
  const response = await fetch('/api/summaries', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return response.json();
}
```

---

### Krok 7: Code review checklist

**Security:**
- [ ] User ID pochodzi z `locals.user`, nie z request body
- [ ] JWT token walidowany przez middleware
- [ ] RLS policy aktywna w Supabase
- [ ] Input sanitization przez Zod schema
- [ ] Brak wrażliwych danych w logach

**Functionality:**
- [ ] Wszystkie wymagane pola walidowane
- [ ] Poprawne kody statusu HTTP
- [ ] Consistent error responses
- [ ] Logging success i error requests
- [ ] TypeScript types zgodne z `types.ts`

**Performance:**
- [ ] Single database query (INSERT + RETURNING)
- [ ] Reuse Supabase client z locals
- [ ] Brak niepotrzebnych SELECT queries
- [ ] Reasonable content size limits

**Code Quality:**
- [ ] Follows project coding guidelines
- [ ] Proper error handling (try-catch)
- [ ] Comments dla complex logic
- [ ] Consistent naming conventions
- [ ] No TypeScript errors or warnings

**Testing:**
- [ ] Successful creation tested
- [ ] Validation errors tested
- [ ] Authorization tested (401)
- [ ] Database errors handled
- [ ] JSON parse errors handled

