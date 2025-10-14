# API Endpoint Implementation Plan: Generate AI Summary

## 1. Przegląd punktu końcowego

Endpoint `POST /api/summaries/generate-ai` służy do tworzenia nowych podsumowań artykułów naukowych wygenerowanych przez AI. Główne funkcje:

- Atomiczne zapisanie podsumowania AI w bazie danych
- Automatyczna dekrementacja licznika użycia AI użytkownika
- Walidacja miesięcznego limitu generacji AI (5 generacji/miesiąc)
- Przechowywanie oryginalnej treści AI dla celów analitycznych

Endpoint wykorzystuje dedykowaną funkcję bazodanową `create_ai_summary`, która zapewnia transakcyjną spójność operacji.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/summaries/generate-ai`
- **Autoryzacja:** Wymagana (JWT Bearer token w middleware)
- **Content-Type:** `application/json`

### Parametry:

#### Wymagane (Request Body):
- `title` (string) - Tytuł podsumowania, min. 1 znak po trim
- `content` (object) - Strukturyzowana treść podsumowania z polami:
  - `research_objective` (string) - Cel badania
  - `methods` (string) - Metody badawcze
  - `results` (string) - Wyniki badania
  - `discussion` (string) - Dyskusja
  - `open_questions` (string) - Pytania otwarte
  - `conclusions` (string) - Wnioski
- `ai_model_name` (string) - Nazwa modelu AI użytego do generacji (np. "anthropic/claude-3.5-sonnet")

#### Opcjonalne:
Brak

### Request Body Example:

```json
{
  "title": "Effects of Climate Change on Marine Biodiversity",
  "content": {
    "research_objective": "To investigate the impact of rising ocean temperatures...",
    "methods": "We conducted a 5-year longitudinal study...",
    "results": "Our findings show a 23% decline in species diversity...",
    "discussion": "The results align with previous studies...",
    "open_questions": "How will these trends affect coastal ecosystems?",
    "conclusions": "Immediate action is required to mitigate..."
  },
  "ai_model_name": "anthropic/claude-3.5-sonnet"
}
```

## 3. Wykorzystywane typy

### Command Models (Input):
```typescript
// Request validation
GenerateAiSummaryCommand {
  title: string;
  content: SummaryContentDTO;
  ai_model_name: string;
}

// Database function parameters
CreateAiSummaryFunctionParams {
  p_title: string;
  p_content: SummaryContentDTO;
  p_original_ai_content: SummaryContentDTO;
  p_ai_model_name: string;
}
```

### DTOs (Output):
```typescript
// Success response
GenerateAiSummaryResponseDTO extends SummaryDetailDTO {
  id: string;
  title: string;
  content: SummaryContentDTO;
  creation_type: "ai";
  ai_model_name: string;
  created_at: string;
  updated_at: string;
  remaining_generations: number; // Unique to this endpoint
}

// Error responses
AiLimitExceededErrorDTO {
  error: {
    code: "AI_LIMIT_EXCEEDED";
    message: string;
    current_usage: number;
    monthly_limit: number;
    reset_date: string;
  }
}

ApiErrorDTO {
  error: {
    code: ApiErrorCode;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
  }
}
```

### Pomocnicze:
```typescript
SummaryContentDTO {
  research_objective: string;
  methods: string;
  results: string;
  discussion: string;
  open_questions: string;
  conclusions: string;
}
```

## 4. Szczegóły odpowiedzi

### Success Response (201 Created):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Effects of Climate Change on Marine Biodiversity",
  "content": {
    "research_objective": "To investigate the impact of rising ocean temperatures...",
    "methods": "We conducted a 5-year longitudinal study...",
    "results": "Our findings show a 23% decline in species diversity...",
    "discussion": "The results align with previous studies...",
    "open_questions": "How will these trends affect coastal ecosystems?",
    "conclusions": "Immediate action is required to mitigate..."
  },
  "creation_type": "ai",
  "ai_model_name": "anthropic/claude-3.5-sonnet",
  "created_at": "2025-10-14T11:00:00Z",
  "updated_at": "2025-10-14T11:00:00Z",
  "remaining_generations": 4
}
```

### Error Responses:

#### 400 Bad Request (Validation Error):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid content structure. Missing required field: research_objective",
    "field": "content.research_objective"
  }
}
```

#### 401 Unauthorized:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 403 Forbidden (AI Limit Exceeded):
```json
{
  "error": {
    "code": "AI_LIMIT_EXCEEDED",
    "message": "Monthly AI generation limit reached (5/5). Limit will reset on 2025-11-01.",
    "current_usage": 5,
    "monthly_limit": 5,
    "reset_date": "2025-11-01T00:00:00Z"
  }
}
```

#### 500 Internal Server Error:
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to create AI summary"
  }
}
```

## 5. Przepływ danych

### High-Level Flow:
```
Client Request
    ↓
Astro Middleware (Authentication)
    ↓
Route Handler: /api/summaries/generate-ai.ts
    ↓
Zod Validation (GenerateAiSummaryCommand)
    ↓
Extract user_id from Astro.locals.user
    ↓
SummaryService.createAiSummary()
    ├─→ Check AI usage limit (query users table)
    ├─→ If limit exceeded → throw AiLimitExceededError
    ├─→ Call DB function: create_ai_summary()
    │   ├─→ Insert into summaries table
    │   ├─→ Increment ai_usage_count
    │   └─→ Return summary data
    └─→ Calculate remaining_generations
    ↓
Return GenerateAiSummaryResponseDTO (201)
```

### Detailed Data Flow:

1. **Request Reception:**
   - Astro middleware intercepts request
   - Validates JWT token
   - Attaches `user` object to `Astro.locals`

2. **Route Handler Processing:**
   - Parses request body
   - Validates against Zod schema
   - Extracts `user_id` from authenticated user

3. **Business Logic (SummaryService):**
   - Query `users` table to get current `ai_usage_count` and `usage_period_start`
   - Calculate if limit exceeded (ai_usage_count >= MONTHLY_AI_LIMIT)
   - If limit OK, prepare parameters for DB function
   - Call `create_ai_summary` RPC function with parameters:
     - `p_title`: title from request
     - `p_content`: content from request
     - `p_original_ai_content`: same as content (for analytics)
     - `p_ai_model_name`: ai_model_name from request

4. **Database Operations (Atomic Transaction):**
   - Function `create_ai_summary` executes:
     - INSERT into `summaries` table
     - UPDATE `users` SET `ai_usage_count = ai_usage_count + 1`
     - RETURN complete summary record

5. **Response Construction:**
   - Map DB response to `GenerateAiSummaryResponseDTO`
   - Calculate `remaining_generations = MONTHLY_AI_LIMIT - (ai_usage_count + 1)`
   - Return with status 201

### Database Interaction:

```sql
-- Function call (via Supabase RPC)
SELECT * FROM create_ai_summary(
  p_title := 'Title',
  p_content := '{"research_objective": "...", ...}'::jsonb,
  p_original_ai_content := '{"research_objective": "...", ...}'::jsonb,
  p_ai_model_name := 'anthropic/claude-3.5-sonnet'
);
```

## 6. Względy bezpieczeństwa

### Authentication & Authorization:

1. **JWT Token Validation:**
   - Middleware `src/middleware/index.ts` validates JWT Bearer token
   - Extracts user identity and attaches to `Astro.locals.supabase` and `Astro.locals.user`
   - Returns 401 if token missing/invalid

2. **User Context:**
   - Use authenticated `user_id` from `Astro.locals.user.id`
   - Never trust user_id from request body
   - DB function uses `auth.uid()` for additional validation

3. **Row Level Security (RLS):**
   - Database policies ensure users can only access their own summaries
   - `create_ai_summary` function respects RLS policies

### Input Validation:

1. **Zod Schema Validation:**
   ```typescript
   const GenerateAiSummarySchema = z.object({
     title: z.string().trim().min(1, "Title is required"),
     content: z.object({
       research_objective: z.string().min(1),
       methods: z.string().min(1),
       results: z.string().min(1),
       discussion: z.string().min(1),
       open_questions: z.string().min(1),
       conclusions: z.string().min(1),
     }),
     ai_model_name: z.string().min(1, "AI model name is required"),
   });
   ```

2. **Type Guard Validation:**
   - Use `isSummaryContent()` helper to validate content structure
   - Prevents injection of invalid JSONB data

3. **Sanitization:**
   - Trim all string inputs
   - Validate JSONB structure before DB insertion
   - Use parameterized queries (Supabase handles this)

### Rate Limiting & Abuse Prevention:

1. **Business Rule Enforcement:**
   - Monthly limit: 5 AI generations per user
   - Enforced at application level before DB call
   - Atomic counter increment prevents race conditions

2. **Additional Protections:**
   - Consider implementing request rate limiting (e.g., max 10 requests/minute)
   - Monitor for unusual patterns (many failed attempts)
   - Log all AI generation attempts for audit trail

### Data Privacy:

1. **User Data Isolation:**
   - Cascade delete ensures cleanup when user account deleted
   - No cross-user data leakage through RLS

2. **Sensitive Information:**
   - AI model names stored for analytics
   - Original AI content stored separately for comparison
   - No PII in summary content (user responsibility)

## 7. Obsługa błędów

### Error Hierarchy:

```
Application Errors
├── Authentication Errors (401)
│   └── Missing/Invalid JWT token
├── Validation Errors (400)
│   ├── Invalid request body structure
│   ├── Missing required fields
│   └── Invalid field values
├── Business Logic Errors (403)
│   └── AI_LIMIT_EXCEEDED
└── Server Errors (500)
    ├── Database connection errors
    ├── DB function execution errors
    └── Unexpected runtime errors
```

### Konkretne scenariusze:

#### 1. Unauthorized (401):
**Trigger:** Missing or invalid JWT token
**Handler:** Middleware catches before route handler
**Response:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 2. Validation Error (400):
**Triggers:**
- Missing required fields
- Invalid field types
- Invalid JSONB structure

**Handler:** Zod validation in route handler
**Examples:**
```json
// Missing field
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid content structure. Missing required field: research_objective",
    "field": "content.research_objective"
  }
}

// Invalid type
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Expected string, received number",
    "field": "title"
  }
}
```

#### 3. AI Limit Exceeded (403):
**Trigger:** User has reached monthly AI generation limit (5/5)
**Handler:** Service layer checks before DB call
**Response:**
```json
{
  "error": {
    "code": "AI_LIMIT_EXCEEDED",
    "message": "Monthly AI generation limit reached (5/5). Limit will reset on 2025-11-01.",
    "current_usage": 5,
    "monthly_limit": 5,
    "reset_date": "2025-11-01T00:00:00Z"
  }
}
```

**Logic for reset_date calculation:**
```typescript
const periodStart = new Date(user.usage_period_start);
const resetDate = new Date(periodStart);
resetDate.setMonth(resetDate.getMonth() + 1);
resetDate.setHours(0, 0, 0, 0);
```

#### 4. Database Errors (500):
**Triggers:**
- Connection timeout
- DB function throws error
- Constraint violations (unlikely with validation)
- Transaction rollback

**Handler:** Try-catch in service layer
**Response:**
```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to create AI summary"
  }
}
```

**Logging:**
```typescript
console.error('[AI Summary Creation Error]', {
  user_id: userId,
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
});
```

#### 5. Unexpected Errors (500):
**Trigger:** Any unhandled exception
**Handler:** Top-level try-catch in route handler
**Response:**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

### Error Handling Pattern:

```typescript
// In route handler
try {
  // Validation
  const validated = GenerateAiSummarySchema.parse(requestBody);
  
  // Business logic
  const summary = await summaryService.createAiSummary(
    supabase,
    userId,
    validated
  );
  
  return new Response(JSON.stringify(summary), { status: 201 });
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(JSON.stringify({
      error: {
        code: "VALIDATION_ERROR",
        message: error.errors[0].message,
        field: error.errors[0].path.join('.')
      }
    }), { status: 400 });
  }
  
  if (error instanceof AiLimitExceededError) {
    return new Response(JSON.stringify({
      error: {
        code: "AI_LIMIT_EXCEEDED",
        message: error.message,
        current_usage: error.currentUsage,
        monthly_limit: error.monthlyLimit,
        reset_date: error.resetDate
      }
    }), { status: 403 });
  }
  
  console.error('[Unexpected Error]', error);
  return new Response(JSON.stringify({
    error: {
      code: "INTERNAL_ERROR",
      message: "Failed to create AI summary"
    }
  }), { status: 500 });
}
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła:

1. **Database Round Trips:**
   - **Problem:** Dwa separate queries (check limit + create summary)
   - **Solution:** Use DB function `create_ai_summary` for atomic operation
   - **Benefit:** Single RPC call, transactional consistency

2. **JSONB Validation:**
   - **Problem:** Complex content structure validation
   - **Solution:** Zod schema + type guard (fast in-memory operations)
   - **Impact:** Minimal (< 1ms for typical payloads)

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie infrastruktury
- [ ] Zweryfikować istnienie funkcji bazodanowej `create_ai_summary`
- [ ] Sprawdzić schemat tabeli `summaries` i `users`
- [ ] Potwierdzić działanie middleware autentykacji (`src/middleware/index.ts`)
- [ ] Upewnić się, że typy w `src/types.ts` są zgodne ze specyfikacją

### Krok 2: Utworzenie SummaryService
- [ ] Utworzyć plik `src/lib/services/summary.service.ts`
- [ ] Zaimplementować klasę `SummaryService` z metodą `createAiSummary()`
- [ ] Dodać logikę sprawdzania limitu AI:
  ```typescript
  async checkAiUsageLimit(supabase: SupabaseClient, userId: string): Promise<{
    canGenerate: boolean;
    currentUsage: number;
    resetDate: string;
  }>
  ```
- [ ] Zaimplementować wywołanie funkcji `create_ai_summary` przez Supabase RPC
- [ ] Dodać obsługę błędów i custom error types (`AiLimitExceededError`)

### Krok 3: Zdefiniowanie schematów walidacji
- [ ] Utworzyć Zod schema w pliku route handler:
  ```typescript
  const GenerateAiSummarySchema = z.object({
    title: z.string().trim().min(1, "Title is required"),
    content: z.object({
      research_objective: z.string().min(1),
      methods: z.string().min(1),
      results: z.string().min(1),
      discussion: z.string().min(1),
      open_questions: z.string().min(1),
      conclusions: z.string().min(1),
    }),
    ai_model_name: z.string().min(1, "AI model name is required"),
  });
  ```
- [ ] Dodać type guard validation z wykorzystaniem `isSummaryContent()`

### Krok 4: Implementacja route handler
- [ ] Utworzyć plik `src/pages/api/summaries/generate-ai.ts`
- [ ] Dodać `export const prerender = false`
- [ ] Zaimplementować handler `POST`:
  ```typescript
  export async function POST({ request, locals }: APIContext): Promise<Response>
  ```
- [ ] Pobrać supabase client z `locals.supabase`
- [ ] Pobrać user z `locals.user` (zweryfikować czy istnieje)
- [ ] Sparsować i zwalidować request body z Zod
- [ ] Wywołać `summaryService.createAiSummary()`
- [ ] Zwrócić response 201 z `GenerateAiSummaryResponseDTO`

### Krok 5: Obsługa błędów
- [ ] Dodać try-catch block w route handler
- [ ] Obsłużyć `ZodError` → 400 Bad Request
- [ ] Obsłużyć `AiLimitExceededError` → 403 Forbidden
- [ ] Obsłużyć błędy bazy danych → 500 Internal Server Error
- [ ] Zaimplementować structured error responses zgodnie z `ApiErrorDTO`
- [ ] Dodać comprehensive logging:
  ```typescript
  console.error('[AI Summary Error]', {
    userId,
    error: error.message,
    timestamp: new Date().toISOString()
  });

### Krok 6: Dokumentacja
- [ ] Zaktualizować API documentation w `docs/api/`
- [ ] Dodać przykłady request/response w dokumentacji
- [ ] Udokumentować error codes i ich znaczenie
- [ ] Dodać informacje o limitach AI w user-facing docs

### Krok 7: Monitoring i deployment
- [ ] Dodać metryki do `monitoring/index.ts`:
  - Counter: `ai_summaries_created_total`
  - Counter: `ai_limit_exceeded_total`
  - Histogram: `ai_summary_creation_duration_ms`
- [ ] Skonfigurować alerty dla error rate > 1%
- [ ] Deploy do staging environment
- [ ] Deploy do production

---