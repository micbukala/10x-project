# API Endpoint Implementation Plan: GET /api/users/ai-usage

## 1. Przegląd punktu końcowego

Endpoint `GET /api/users/ai-usage` umożliwia użytkownikowi sprawdzenie aktualnego statusu wykorzystania miesięcznego limitu generacji AI. Zwraca szczegółowe informacje o:
- Liczbie wykorzystanych generacji w bieżącym miesiącu
- Miesięcznym limicie generacji
- Liczbie pozostałych dostępnych generacji
- Okresie rozliczeniowym (początek i koniec bieżącego miesiąca)
- Informacji, czy użytkownik może wygenerować kolejne podsumowanie AI

Endpoint jest niezbędny dla frontendu, aby wyświetlić użytkownikowi informacje o dostępności funkcji AI oraz aby zablokować przycisk generowania AI, gdy limit zostanie wyczerpany.

## 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/users/ai-usage`
- **Uwierzytelnienie:** Wymagane (JWT Bearer token w nagłówku Authorization)
- **Parametry:**
  - **Wymagane:** Brak
  - **Opcjonalne:** Brak
- **Request Body:** Brak (metoda GET)
- **Headers:**
  - `Authorization: Bearer <jwt_token>` - wymagany

## 3. Wykorzystywane typy

### Odpowiedź sukcesu

```typescript
// src/types.ts - już zdefiniowane
interface UserAiUsageDTO {
  can_generate: boolean;
  usage_count: number;
  monthly_limit: number;
  remaining_generations: number;
  period_start: string; // ISO 8601 format
  period_end: string;   // ISO 8601 format
}
```

### Odpowiedź błędu

```typescript
// src/types.ts - już zdefiniowane
interface ApiErrorDTO {
  error: {
    code: ApiErrorCode;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
  };
}

type ApiErrorCode = "UNAUTHORIZED" | "INTERNAL_ERROR" | ...;
```

### Typy wewnętrzne (database)

```typescript
// Dane pobierane z tabeli users
interface UserDbRow {
  id: string;
  ai_usage_count: number;
  usage_period_start: string; // timestamp
}
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "can_generate": true,
  "usage_count": 3,
  "monthly_limit": 5,
  "remaining_generations": 2,
  "period_start": "2025-10-01T00:00:00.000Z",
  "period_end": "2025-10-31T23:59:59.999Z"
}
```

**Pola odpowiedzi:**
- `can_generate`: `true` jeśli `remaining_generations > 0`, w przeciwnym razie `false`
- `usage_count`: Aktualna liczba wykorzystanych generacji w bieżącym miesiącu
- `monthly_limit`: Stała wartość `5` (zdefiniowana w `MONTHLY_LIMIT_AI_USAGE`)
- `remaining_generations`: `monthly_limit - usage_count`
- `period_start`: Początek bieżącego miesiąca kalendarzowego w formacie ISO 8601
- `period_end`: Koniec bieżącego miesiąca kalendarzowego (23:59:59.999) w formacie ISO 8601

### Błąd uwierzytelnienia (401 Unauthorized)

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### Błąd serwera (500 Internal Server Error)

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to retrieve AI usage information"
  }
}
```

## 5. Przepływ danych

### Sekwencja operacji:

1. **Walidacja uwierzytelnienia (Middleware)**
   - Middleware Astro (`src/middleware/index.ts`) weryfikuje obecność i poprawność JWT token
   - Jeśli brak tokenu lub nieprawidłowy → zwraca 401 Unauthorized
   - Token ważny → kontynuacja z `context.locals.supabase`

2. **Pobranie ID użytkownika**
   - Endpoint pobiera `user_id` z uwierzytelnionego użytkownika przez `context.locals.supabase.auth.getUser()`
   - Jeśli getUser() zwraca błąd → 401 Unauthorized

3. **Wywołanie User Service**
   - Endpoint deleguje logikę biznesową do `UserService.getAiUsage(supabaseClient, userId)`
   - Service layer izoluje logikę biznesową od warstwy API

4. **Pobranie danych z bazy (Service)**
   ```sql
   SELECT ai_usage_count, usage_period_start 
   FROM users 
   WHERE id = $1
   ```
   - RLS policy `select_own_profile` zapewnia, że użytkownik widzi tylko swoje dane
   - Jeśli użytkownik nie istnieje → błąd 500 (nie powinno się zdarzyć, bo middleware weryfikuje)

5. **Logika okresu rozliczeniowego (Service)**
   - Pobranie aktualnej daty/czasu
   - Obliczenie początku bieżącego miesiąca: `date_trunc('month', now())`
   - Sprawdzenie czy `usage_period_start < początek_bieżącego_miesiąca`
   - Jeśli TAK → reset licznika:
     ```sql
     UPDATE users 
     SET ai_usage_count = 0, usage_period_start = date_trunc('month', now())
     WHERE id = $1
     RETURNING ai_usage_count, usage_period_start
     ```
   - Jeśli NIE → użyj pobranych wartości

6. **Obliczenia (Service)**
   - `monthly_limit = MONTHLY_LIMIT_AI_USAGE` (stała = 5)
   - `remaining_generations = monthly_limit - ai_usage_count`
   - `can_generate = remaining_generations > 0`
   - `period_start = początek_bieżącego_miesiąca` (ISO 8601)
   - `period_end = koniec_bieżącego_miesiąca` (ISO 8601, 23:59:59.999)

7. **Zwrócenie odpowiedzi**
   - Service zwraca `UserAiUsageDTO`
   - Endpoint serializuje do JSON
   - Status: 200 OK

### Diagram przepływu:

```
Client → [JWT Token] → Middleware (auth check)
                              ↓
                         API Endpoint (GET /api/users/ai-usage)
                              ↓
                      Get user ID from auth
                              ↓
                      UserService.getAiUsage()
                              ↓
                      Query users table (RLS)
                              ↓
                      Check period reset needed?
                         ↙        ↘
                      YES         NO
                       ↓           ↓
              Update counter   Use current
                       ↓           ↓
                      Calculate response data
                              ↓
                      Return UserAiUsageDTO
                              ↓
                      Client ← [200 OK + JSON]
```

## 6. Względy bezpieczeństwa

### Uwierzytelnienie
- **JWT Token:** Wymagany Bearer token w nagłówku `Authorization`
- **Middleware:** `src/middleware/index.ts` weryfikuje token przed dotarciem do endpointu
- **Supabase Auth:** Wykorzystanie `context.locals.supabase.auth.getUser()` do weryfikacji tożsamości
- **Brak tokenu:** Automatyczne przekierowanie do 401 przez middleware

### Autoryzacja
- **RLS (Row-Level Security):** Polityka `select_own_profile` w tabeli `users` zapewnia, że użytkownik widzi tylko swoje dane
- **User ID:** Zawsze pobierany z `auth.uid()`, nigdy z parametrów żądania
- **Brak możliwości podszywania się:** Niemożliwe jest sprawdzenie limitu innego użytkownika

### Walidacja danych
- **Brak danych wejściowych od użytkownika:** Endpoint nie przyjmuje parametrów, więc brak ryzyka injection
- **User ID:** Zawsze UUID z systemu auth, walidowany przez Supabase

### Ochrona przed atakami
- **SQL Injection:** Użycie parametryzowanych zapytań Supabase SDK
- **Authorization Bypass:** RLS wymusza izolację danych na poziomie bazy danych
- **Rate Limiting:** Warto rozważyć implementację rate limiting dla tego endpointu (np. max 10 req/min)

### HTTPS
- Wymagane dla produkcji ze względu na przesyłanie JWT tokens

## 7. Obsługa błędów

### Scenariusze błędów i kody statusu:

| Kod | Scenariusz | ApiErrorCode | Komunikat | Obsługa |
|-----|------------|--------------|-----------|---------|
| 401 | Brak tokenu JWT | UNAUTHORIZED | "Authentication required" | Middleware zwraca 401 |
| 401 | Nieprawidłowy token | UNAUTHORIZED | "Authentication required" | Middleware zwraca 401 |
| 401 | Token wygasł | UNAUTHORIZED | "Authentication required" | Middleware zwraca 401 |
| 401 | getUser() zwraca błąd | UNAUTHORIZED | "Authentication required" | Endpoint zwraca 401 |
| 500 | Błąd zapytania do bazy | INTERNAL_ERROR | "Failed to retrieve AI usage information" | Log błędu, zwróć 500 |
| 500 | Błąd aktualizacji countera | INTERNAL_ERROR | "Failed to retrieve AI usage information" | Log błędu, zwróć 500 |
| 500 | Nieoczekiwany błąd | INTERNAL_ERROR | "An unexpected error occurred" | Log błędu, zwróć 500 |

### Implementacja obsługi błędów:

```typescript
// W endpoint handler
try {
  const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();
  
  if (authError || !user) {
    return createErrorResponse(401, "UNAUTHORIZED", "Authentication required");
  }

  const aiUsage = await UserService.getAiUsage(context.locals.supabase, user.id);
  
  return new Response(JSON.stringify(aiUsage), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
} catch (error) {
  console.error("Error in GET /api/users/ai-usage:", error);
  
  return createErrorResponse(
    500,
    "INTERNAL_ERROR",
    "Failed to retrieve AI usage information"
  );
}
```

### Error Service
- Wykorzystanie `src/lib/services/error.service.ts` do tworzenia spójnych odpowiedzi błędów
- Funkcja `createErrorResponse()` powinna być użyta dla wszystkich błędów

### Logowanie błędów
- Wszystkie błędy 500 powinny być logowane z pełnym stack trace
- Użycie `console.error()` w development
- W produkcji: integracja z systemem monitorowania (np. Sentry)

## 8. Etapy wdrożenia

### Krok 1: Przygotowanie stałych i typów
```typescript
// src/lib/constants.ts
export const MONTHLY_LIMIT_AI_USAGE = 5;
```
- Dodać stałą `MONTHLY_LIMIT_AI_USAGE` do `src/lib/constants.ts`
- Sprawdzić czy `UserAiUsageDTO` jest poprawnie zdefiniowane w `src/types.ts`

### Krok 2: Implementacja User Service
**Lokalizacja:** `src/lib/services/user.service.ts`

**Funkcja do implementacji:**
```typescript
async function getAiUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<UserAiUsageDTO>
```

**Logika:**
1. Pobranie `ai_usage_count` i `usage_period_start` z tabeli `users`
2. Obliczenie początku i końca bieżącego miesiąca
3. Sprawdzenie czy `usage_period_start` < początek bieżącego miesiąca
4. Jeśli TAK → reset licznika przez UPDATE z RETURNING
5. Obliczenie `remaining_generations`, `can_generate`
6. Formatowanie dat do ISO 8601
7. Zwrócenie `UserAiUsageDTO`

**Obsługa błędów:**
- Try-catch dla operacji bazodanowych
- Rzucanie wyjątków dla błędów DB (catch w endpoint handler)

### Krok 3: Utworzenie endpointu API
**Lokalizacja:** `src/pages/api/users/ai-usage.ts`

**Struktura pliku:**
```typescript
import type { APIContext } from "astro";
import type { UserAiUsageDTO, ApiErrorDTO } from "../../../types";
import { UserService } from "../../../lib/services/user.service";
import { createErrorResponse } from "../../../lib/services/error.service";

export const prerender = false;

export async function GET(context: APIContext): Promise<Response> {
  // Implementacja
}
```

**Handler GET:**
1. Pobranie użytkownika z `context.locals.supabase.auth.getUser()`
2. Walidacja uwierzytelnienia (401 jeśli błąd)
3. Wywołanie `UserService.getAiUsage()`
4. Zwrócenie JSON response z statusem 200
5. Obsługa błędów w try-catch (500)

### Krok 4: Dokumentacja
1. **API Documentation:**
   - Aktualizacja `docs/api/user-profile.md` o nowy endpoint
   - Dodanie przykładów request/response

2. **OpenAPI Specification:**
   - Aktualizacja `docs/api/openapi.yaml` o endpoint `/api/users/ai-usage`

### Krok 5: Code Review Checklist
- [ ] Endpoint używa `export const prerender = false`
- [ ] Logika biznesowa wyodrębniona do service
- [ ] Używa `context.locals.supabase` zamiast importowania klienta
- [ ] Wszystkie błędy są obsługiwane i logowane
- [ ] Kody statusu HTTP są prawidłowe
- [ ] Typy TypeScript są używane konsekwentnie
- [ ] Format dat to ISO 8601
- [ ] RLS policies są respektowane
- [ ] Brak hardcoded values (użycie stałych)
- [ ] Error responses są zgodne z `ApiErrorDTO`
