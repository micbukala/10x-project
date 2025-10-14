# API Endpoint Implementation Plan: Delete Summary (DELETE /api/summaries/:id)

## 1. Przegląd punktu końcowego

Endpoint `DELETE /api/summaries/:id` umożliwia permanentne usunięcie podsumowania naukowego. Operacja jest nieodwracalna i wymaga uwierzytelnienia. Użytkownik może usuwać tylko swoje własne podsumowania - próba usunięcia cudzego zasobu skutkuje błędem 403 Forbidden.

## 2. Szczegóły żądania

- **Metoda HTTP:** DELETE
- **Struktura URL:** `/api/summaries/:id`
- **Parametry ścieżki:**
  - `id` (UUID, wymagany) - Identyfikator podsumowania do usunięcia
- **Parametry zapytania:** Brak
- **Request Body:** Brak

**Uwagi:**
- Uwierzytelnianie wymaga tokenu JWT Bearer w nagłówku Authorization
- Endpoint nie przyjmuje żadnych dodatkowych parametrów oprócz ID w ścieżce

## 3. Wykorzystywane typy

### Typy wyjściowe

```typescript
// Istniejące typy z src/types.ts
export interface DeleteSummaryResponseDTO {
  message: string;
  deleted_id: string;
}
```

### Typy błędów

```typescript
// Istniejące typy z src/types.ts
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
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INVALID_PARAMETER"
  | "INTERNAL_ERROR"
  | "DATABASE_ERROR";
```

### Schema walidacji (nowy)

```typescript
// src/lib/services/schemas/summary.schema.ts
import { z } from "zod";

export const summaryIdSchema = z.object({
  id: z.string().uuid({ message: "Invalid summary ID format" }),
});
```

## 4. Szczegóły odpowiedzi

### Odpowiedź sukcesu (200 OK)

```json
{
  "message": "Summary deleted successfully",
  "deleted_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Kody odpowiedzi

- `200 OK` - Podsumowanie usunięte pomyślnie
- `400 Bad Request` - Nieprawidłowy format UUID
- `401 Unauthorized` - Brak lub nieprawidłowy token uwierzytelniania
- `403 Forbidden` - Podsumowanie należy do innego użytkownika
- `404 Not Found` - Podsumowanie nie znalezione
- `500 Internal Server Error` - Błąd serwera/bazy danych

### Przykłady odpowiedzi błędów

**400 Bad Request:**
```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid summary ID format"
  }
}
```

**401 Unauthorized:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**403 Forbidden:**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Permission denied"
  }
}
```

**404 Not Found:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Summary not found"
  }
}
```

## 5. Przepływ danych

### Diagram sekwencji

```
Client -> API Endpoint: DELETE /api/summaries/:id
API Endpoint -> Middleware: Sprawdź autentykację
Middleware --> API Endpoint: user & supabase
API Endpoint -> Validation: Waliduj UUID
Validation --> API Endpoint: Wynik walidacji
API Endpoint -> SummaryService: deleteSummary(userId, summaryId)
SummaryService -> Supabase: SELECT summary WHERE id = :id
Supabase --> SummaryService: Summary data
SummaryService -> SummaryService: Sprawdź ownership (user_id === userId)
SummaryService -> Supabase: DELETE FROM summaries WHERE id = :id
Supabase --> SummaryService: Deleted record ID
SummaryService --> API Endpoint: deleted_id
API Endpoint --> Client: 200 OK + response DTO
```

### Kroki przepływu:

1. **Żądanie HTTP:**
   - Client wysyła DELETE request z JWT token w nagłówku
   - URL zawiera UUID podsumowania do usunięcia

2. **Uwierzytelnianie (Middleware):**
   - Middleware sprawdza ważność tokenu JWT
   - Wyodrębnia user ID z tokenu
   - Przekazuje `locals.user` i `locals.supabase` do handlera

3. **Walidacja parametrów:**
   - Walidacja formatu UUID parametru `:id` za pomocą Zod schema
   - Zwrot błędu 400 jeśli format nieprawidłowy

4. **Delegacja do Service:**
   - Inicjalizacja `SummaryService` z Supabase client
   - Wywołanie `deleteSummary(userId, summaryId)`

5. **Weryfikacja w Service:**
   - Pobranie podsumowania z bazy danych
   - Sprawdzenie czy istnieje (404 jeśli nie)
   - Weryfikacja ownership (403 jeśli user_id !== userId)
   - Usunięcie rekordu z bazy danych

6. **Odpowiedź:**
   - Zwrot 200 OK z ID usuniętego podsumowania
   - Lub odpowiedni kod błędu z szczegółami

## 6. Względy bezpieczeństwa

### Uwierzytelnianie
- **JWT Bearer Token:** Wymagany w nagłówku `Authorization: Bearer <token>`
- **Middleware:** Automatyczna weryfikacja tokenu przez Astro middleware
- **Session:** Sprawdzenie ważności sesji Supabase

### Autoryzacja
- **Ownership Verification:** Service sprawdza czy `summary.user_id === locals.user.id`
- **IDOR Prevention:** Zapobieganie Insecure Direct Object Reference przez weryfikację właściciela
- **Row Level Security:** Supabase RLS jako dodatkowa warstwa ochrony

### Walidacja danych
- **UUID Validation:** Zod schema sprawdza format UUID parametru `:id`
- **Input Sanitization:** Supabase client automatycznie parametryzuje zapytania (SQL injection protection)

### Ochrona przed nadużyciami
- **Rate Limiting:** (opcjonalnie) Można dodać ograniczenie liczby żądań DELETE
- **Audit Log:** (opcjonalnie) Rejestrowanie operacji usuwania dla celów audytu
- **Soft Delete Alternative:** Endpoint implementuje hard delete zgodnie ze specyfikacją (nieodwracalne)

### Nagłówki bezpieczeństwa
```typescript
{
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate', // Prevent caching of sensitive operations
}
```

## 7. Obsługa błędów

### Macierz obsługi błędów

| Scenariusz | Kod błędu | Status HTTP | Akcja |
|------------|-----------|-------------|-------|
| Brak tokenu JWT | UNAUTHORIZED | 401 | Zwrot przez middleware |
| Nieprawidłowy/wygasły token | UNAUTHORIZED | 401 | Zwrot przez middleware |
| Nieprawidłowy format UUID | INVALID_PARAMETER | 400 | Walidacja Zod schema |
| Podsumowanie nie istnieje | NOT_FOUND | 404 | Sprawdzenie w service |
| Próba usunięcia cudzego zasobu | FORBIDDEN | 403 | Weryfikacja ownership w service |
| Błąd bazy danych | DATABASE_ERROR | 500 | Catch w service |
| Nieoczekiwany wyjątek | INTERNAL_ERROR | 500 | Global error handler |

### Implementacja w Service

```typescript
async deleteSummary(userId: string, summaryId: string): Promise<string> {
  // 1. Fetch summary to check existence and ownership
  const { data: summary, error: fetchError } = await this.supabase
    .from("summaries")
    .select("id, user_id")
    .eq("id", summaryId)
    .single();

  // 2. Handle not found
  if (fetchError || !summary) {
    throw new Error("Summary not found");
  }

  // 3. Check ownership - prevent IDOR
  if (summary.user_id !== userId) {
    throw new Error("Permission denied");
  }

  // 4. Delete the summary
  const { error: deleteError } = await this.supabase
    .from("summaries")
    .delete()
    .eq("id", summaryId);

  if (deleteError) {
    throw new Error(`Failed to delete summary: ${deleteError.message}`);
  }

  return summaryId;
}
```

### Mapowanie błędów w ErrorService

`ErrorService.createErrorResponse()` już obsługuje:
- "Summary not found" → 404 NOT_FOUND
- "Permission denied" → 403 FORBIDDEN
- Błędy bazy danych → 500 DATABASE_ERROR
- Inne wyjątki → 500 INTERNAL_ERROR

## 8. Rozważania dotyczące wydajności

### Optymalizacje zapytań
- **Selective Fetch:** Pobranie tylko `id` i `user_id` dla weryfikacji (nie pełny rekord)
- **Single Query:** Weryfikacja i usunięcie w minimalnej liczbie zapytań
- **Index Usage:** Wykorzystanie primary key index dla szybkiego wyszukiwania po ID

### Caching
- **No Cache:** Operacje DELETE nie powinny być cache'owane
- **Headers:** `Cache-Control: no-store` zapobiega cache'owaniu odpowiedzi


## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie schema walidacji
**Plik:** `src/lib/services/schemas/summary.schema.ts`

```typescript
// Dodanie nowego schema
export const summaryIdSchema = z.object({
  id: z.string().uuid({ message: "Invalid summary ID format" }),
});
```

### Krok 2: Rozszerzenie SummaryService
**Plik:** `src/lib/services/summary.service.ts`

Dodanie metody `deleteSummary`:

```typescript
/**
 * Delete a summary by ID
 * @throws Error if summary not found or user doesn't have permission
 */
async deleteSummary(userId: string, summaryId: string): Promise<string> {
  // Fetch summary to verify existence and ownership
  const { data: summary, error: fetchError } = await this.supabase
    .from("summaries")
    .select("id, user_id")
    .eq("id", summaryId)
    .single();

  if (fetchError || !summary) {
    throw new Error("Summary not found");
  }

  // Verify ownership
  if (summary.user_id !== userId) {
    throw new Error("Permission denied");
  }

  // Delete the summary
  const { error: deleteError } = await this.supabase
    .from("summaries")
    .delete()
    .eq("id", summaryId);

  if (deleteError) {
    throw new Error(`Failed to delete summary: ${deleteError.message}`);
  }

  return summaryId;
}
```

### Krok 3: Utworzenie endpoint handlera
**Plik:** `src/pages/api/summaries/[id].ts`

Implementacja DELETE handlera:

```typescript
import type { APIRoute } from "astro";
import { SummaryService } from "../../../lib/services/summary.service";
import { ErrorService } from "../../../lib/services/error.service";
import { summaryIdSchema } from "../../../lib/services/schemas/summary.schema";
import type { DeleteSummaryResponseDTO } from "../../../types";

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { supabase, user } = locals;

    // Validate summary ID format
    const validationResult = summaryIdSchema.safeParse(params);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_PARAMETER",
            message: "Invalid summary ID format",
            details: validationResult.error.flatten(),
          },
        }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }

    const { id } = validationResult.data;

    // Initialize service and delete summary
    const summaryService = new SummaryService(supabase);
    const deletedId = await summaryService.deleteSummary(user.id, id);

    // Build success response
    const response: DeleteSummaryResponseDTO = {
      message: "Summary deleted successfully",
      deleted_id: deletedId,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in DELETE /api/summaries/:id:", error);
    return ErrorService.createErrorResponse(error);
  }
};
```
### Krok 4: Weryfikacja integracji z bazą danych

1. **Sprawdzenie CASCADE delete:**
   - Zweryfikować czy RLS policies działają poprawnie
   - Potwierdzić że rekord jest faktycznie usuwany z bazy

2. **Weryfikacja ownership:**
   - Upewnić się że nie można usunąć cudzego podsumowania
   - Sprawdzić logi błędów 403

3. **Performance check:**
   - Zmierzyć czas wykonania DELETE operation
   - Sprawdzić wykorzystanie connection pool

### Krok 5: Dokumentacja

1. **Aktualizacja OpenAPI spec** (jeśli istnieje):
   - Dodanie definicji endpoint DELETE /api/summaries/:id
   - Opisanie wszystkich kodów odpowiedzi

2. **Przykłady użycia:**
   - Dodanie przykładów cURL do dokumentacji API
   - Przykłady dla wszystkich scenariuszy (sukces + błędy)

3. **Changelog:**
   - Odnotowanie dodania endpoint DELETE w notes release'owych

### Krok 6: Code Review 

1. **Code Review checklist:**
   - ✅ Walidacja UUID działa poprawnie
   - ✅ Service sprawdza ownership
   - ✅ Błędy są odpowiednio mapowane
   - ✅ Nie ma SQL injection vulnerabilities
   - ✅ Cache headers są ustawione
   - ✅ Logging błędów działa


---
