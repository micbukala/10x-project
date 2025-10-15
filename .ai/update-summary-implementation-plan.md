# API Endpoint Implementation Plan: Update Summary (PATCH /api/summaries/:id)

## 1. Przegląd punktu końcowego

Endpoint `PATCH /api/summaries/:id` umożliwia częściową aktualizację istniejącego podsumowania naukowego. Użytkownik może zaktualizować tytuł, wybrane pola treści podsumowania lub oba te elementy jednocześnie. Tylko uwierzytelnieni użytkownicy mogą modyfikować swoje własne podsumowania.

## 2. Szczegóły żądania

- **Metoda HTTP:** PATCH
- **Struktura URL:** `/api/summaries/:id`
- **Parametry ścieżki:**
  - `id` (UUID, wymagany) - Identyfikator podsumowania
- **Parametry zapytania:** Brak
- **Request Body:**

```typescript
{
  title?: string;
  content?: {
    research_objective?: string;
    methods?: string;
    results?: string;
    discussion?: string;
    open_questions?: string;
    conclusions?: string;
  }
}
```

- **Uwagi:** Wszystkie pola są opcjonalne. Aktualizowane są tylko dostarczone pola, pozostałe pozostają bez zmian.

## 3. Wykorzystywane typy

### Typy wejściowe

```typescript
// Istniejące typy z src/types.ts
export interface UpdateSummaryCommand {
  title?: string;
  content?: Partial<SummaryContentDTO>;
}

export type UpdateSummaryResponseDTO = SummaryDetailDTO;
```

### Typy wyjściowe i błędów

```typescript
// Istniejące typy z src/types.ts
export interface SummaryDetailDTO {
  id: string;
  title: string;
  content: SummaryContentDTO;
  creation_type: Enums<"summary_creation_type">;
  ai_model_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiErrorDTO {
  error: {
    code: ApiErrorCode;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
  };
}
```

## 4. Szczegóły odpowiedzi

### Odpowiedź sukcesu (200 OK)

```json
{
  "id": "uuid",
  "title": "Updated Title",
  "content": {
    "research_objective": "Updated or original research_objective",
    "methods": "Updated or original methods",
    "results": "Updated or original results",
    "discussion": "Updated or original discussion",
    "open_questions": "Updated or original open_questions",
    "conclusions": "Updated or original conclusions"
  },
  "creation_type": "ai|manual",
  "ai_model_name": "string|null",
  "created_at": "2025-10-14T10:30:00Z",
  "updated_at": "2025-10-14T12:15:00Z"
}
```

### Kody odpowiedzi

- `200 OK` - Podsumowanie zaktualizowane pomyślnie
- `400 Bad Request` - Nieprawidłowe dane wejściowe
- `401 Unauthorized` - Brak lub nieprawidłowy token uwierzytelniania
- `403 Forbidden` - Podsumowanie należy do innego użytkownika
- `404 Not Found` - Podsumowanie nie znalezione

### Przykład odpowiedzi błędu (400 Bad Request)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title cannot be empty",
    "field": "title"
  }
}
```

## 5. Przepływ danych

1. **Uwierzytelnianie użytkownika**
   - Sprawdzenie tokenu JWT i odczytanie ID użytkownika

2. **Walidacja danych wejściowych**
   - Walidacja ID podsumowania (UUID)
   - Walidacja struktury żądania za pomocą schematu Zod
   - Sprawdzenie, czy tytuł nie jest pusty (jeśli dostarczony)
   - Sprawdzenie struktury pól content (jeśli dostarczone)

3. **Pobieranie istniejącego podsumowania**
   - Zapytanie do bazy danych w celu pobrania istniejącego podsumowania
   - Weryfikacja, czy podsumowanie istnieje
   - Sprawdzenie, czy użytkownik jest właścicielem podsumowania

4. **Aktualizacja podsumowania**
   - Przygotowanie danych do aktualizacji (tylko zmienione pola)
   - Aktualizacja podsumowania w bazie danych (Supabase)
   - Pobranie zaktualizowanego podsumowania

5. **Przygotowanie odpowiedzi**
   - Formatowanie danych zgodnie z typem UpdateSummaryResponseDTO
   - Zwrócenie odpowiedzi z kodem 200 OK

## 6. Względy bezpieczeństwa

1. **Uwierzytelnianie**
   - Wymagany token JWT Bearer
   - Wykorzystanie lokalsów Astro do weryfikacji tokenu

2. **Autoryzacja**
   - Weryfikacja, czy zalogowany użytkownik jest właścicielem podsumowania
   - Wykorzystanie Row Level Security Supabase do dodatkowej warstwy zabezpieczeń

3. **Walidacja danych**
   - Sanityzacja danych wejściowych przed zapisem do bazy danych
   - Weryfikacja poprawności UUID
   - Weryfikacja struktury i poprawności pól treści
   - Zabezpieczenia przed pustymi wartościami

4. **Zapobieganie atakom**
   - Ochrona przed SQL Injection (przez parametryzowane zapytania Supabase)
   - Zapobieganie atakom XSS przez sanityzację danych wejściowych

## 7. Obsługa błędów

| Scenariusz                      | Kod statusu | Kod błędu          | Komunikat                                           |
|--------------------------------|------------|-------------------|---------------------------------------------------|
| Brak tokenu uwierzytelniania    | 401        | UNAUTHORIZED      | Authentication required                           |
| Nieprawidłowy token             | 401        | UNAUTHORIZED      | Invalid authentication token                      |
| Podsumowanie nie istnieje       | 404        | NOT_FOUND         | Summary not found                                 |
| Podsumowanie należy do innego użytkownika | 403 | FORBIDDEN     | You do not have permission to update this summary |
| Pusty tytuł                     | 400        | VALIDATION_ERROR  | Title cannot be empty                             |
| Nieprawidłowa struktura content | 400        | VALIDATION_ERROR  | Invalid summary content structure                  |
| Nieprawidłowe ID podsumowania   | 400        | VALIDATION_ERROR  | Invalid summary ID                                |
| Błąd bazy danych                | 500        | DATABASE_ERROR    | Failed to update summary                          |
| Nieznany błąd                   | 500        | INTERNAL_ERROR    | An unexpected error occurred                      |

## 8. Rozważania dotyczące wydajności

1. **Pamięć podręczna (caching)**
   - Niewymagana w tym przypadku ze względu na charakter endpointu (aktualizacja)

## 9. Etapy wdrożenia

1. **Rozszerzenie serwisu SummaryService**
   - Implementacja metody `updateSummary` w `src/lib/services/summary.service.ts`
   - Obsługa walidacji własności podsumowania
   - Obsługa częściowych aktualizacji pól content

2. **Utworzenie schematu walidacji Zod**
   - Implementacja schematu walidacji dla UpdateSummaryCommand
   - Obsługa opcjonalnych pól
   - Walidacja struktury JSONB dla pól content

3. **Implementacja handlera endpointu**
   - Utworzenie pliku `src/pages/api/summaries/[id].ts`
   - Implementacja metody PATCH
   - Integracja z SummaryService
   - Obsługa parametrów ścieżki i walidacji UUID

4. **Implementacja obsługi błędów**
   - Obsługa błędów walidacji Zod
   - Obsługa błędów 401, 403, 404
   - Integracja z systemem monitorowania API

5. **Dokumentacja**
   - Aktualizacja dokumentacji API
   - Dodanie przykładów użycia dla frontendowych deweloperów

## 10. Przykładowa implementacja

### Handler endpointu (src/pages/api/summaries/[id].ts)

```typescript
import { z } from "zod";
import type { APIRoute } from "astro";
import { SummaryService } from "../../../lib/services/summary.service";
import { isSummaryContent } from "../../../types";
import { ApiMonitoring } from "../../../../monitoring";

// Disable static prerendering for API routes
export const prerender = false;

// Zod schema for request validation
const updateSummarySchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty").optional(),
  content: z.custom<Partial<SummaryContentDTO>>(
    (data) => {
      if (!data) return true;
      if (typeof data !== 'object' || data === null) return false;
      
      const contentFields = ["research_objective", "methods", "results", "discussion", "open_questions", "conclusions"];
      return Object.entries(data as Record<string, unknown>).every(
        ([key, value]) => contentFields.includes(key) && typeof value === 'string'
      );
    },
    "Invalid summary content structure"
  ).optional(),
}).refine(data => data.title !== undefined || data.content !== undefined, {
  message: "At least one field (title or content) must be provided",
});

export const PATCH: APIRoute = async ({ request, locals, params }) => {
  const startTime = Date.now();
  const endpoint = `/api/summaries/${params.id}`;

  try {
    // Ensure user is authenticated
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

    // Validate summary ID
    const summaryId = params.id;
    if (!summaryId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(summaryId)) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid summary ID",
            field: "id",
          },
        }),
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateSummarySchema.parse(body);

    // Initialize service with Supabase client from context
    const summaryService = new SummaryService(locals.supabase);

    // Update summary
    const updatedSummary = await summaryService.updateSummary(
      user.id,
      summaryId,
      validatedData.title,
      validatedData.content
    );

    // Log successful request
    ApiMonitoring.logApiRequest({
      timestamp: new Date().toISOString(),
      endpoint,
      method: "PATCH",
      userId: user.id,
      duration: Date.now() - startTime,
      statusCode: 200,
    });

    // Return successful response
    return new Response(JSON.stringify(updatedSummary), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    let status = 500;
    let errorCode = "INTERNAL_ERROR";
    let message = "An unexpected error occurred";
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      status = 400;
      errorCode = "VALIDATION_ERROR";
      message = error.errors[0]?.message || "Invalid request data";
      
      return new Response(
        JSON.stringify({
          error: {
            code: errorCode,
            message,
            details: error.errors,
          },
        }),
        { status }
      );
    }
    
    // Handle not found
    if (error instanceof Error && error.message === "Summary not found") {
      status = 404;
      errorCode = "NOT_FOUND";
      message = "Summary not found";
    }
    
    // Handle forbidden
    if (error instanceof Error && error.message === "Permission denied") {
      status = 403;
      errorCode = "FORBIDDEN";
      message = "You do not have permission to update this summary";
    }
    
    // Handle database errors
    if (error instanceof Error && error.message.includes("database")) {
      status = 500;
      errorCode = "DATABASE_ERROR";
      message = "Failed to update summary";
    }

    // Log error request
    ApiMonitoring.logApiRequest({
      timestamp: new Date().toISOString(),
      endpoint,
      method: "PATCH",
      userId: user?.id,
      duration: Date.now() - startTime,
      statusCode: status,
      error: {
        code: errorCode,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
    });

    // Return error response
    return new Response(
      JSON.stringify({
        error: {
          code: errorCode,
          message,
        },
      }),
      { status }
    );
  }
};
```

### Rozszerzenie SummaryService (src/lib/services/summary.service.ts)

```typescript
// Dodane do istniejącego SummaryService
async updateSummary(
  userId: string,
  summaryId: string,
  title?: string,
  contentUpdate?: Partial<SummaryContentDTO>
): Promise<SummaryDetailDTO> {
  // Fetch current summary to check ownership and get current values
  const { data: summary, error: fetchError } = await this.supabase
    .from("summaries")
    .select("*")
    .eq("id", summaryId)
    .single();

  if (fetchError) {
    throw new Error("Summary not found");
  }

  if (!summary) {
    throw new Error("Summary not found");
  }

  // Check ownership
  if (summary.user_id !== userId) {
    throw new Error("Permission denied");
  }

  // Prepare update data
  const updateData: Record<string, any> = {};
  
  // Update title if provided
  if (title !== undefined) {
    updateData.title = title;
  }
  
  // Update content if provided (merge with existing content)
  if (contentUpdate) {
    const mergedContent = {
      ...summary.content,
      ...contentUpdate
    };
    updateData.content = mergedContent;
  }
  
  // Update the summary
  const { data: updatedSummary, error: updateError } = await this.supabase
    .from("summaries")
    .update(updateData)
    .eq("id", summaryId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update summary: ${updateError.message}`);
  }

  return updatedSummary as unknown as SummaryDetailDTO;
}
```
